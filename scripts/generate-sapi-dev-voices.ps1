[CmdletBinding()]
param(
  [switch]$ProofOnly,
  [switch]$Force,
  [string]$FfmpegPath = "",
  [int]$ShardIndex = -1,
  [int]$ShardCount = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$outputRoot = [IO.Path]::GetFullPath(
  (Join-Path $projectRoot "voice-production\development")
)
$jobsPath = Join-Path $outputRoot "jobs.json"
$clipsRoot = Join-Path $outputRoot "clips"
$workRoot = Join-Path $outputRoot "work"
$fingerprintsRoot = Join-Path $outputRoot "fingerprints"

function Assert-ContainedPath {
  param(
    [Parameter(Mandatory = $true)][string]$Root,
    [Parameter(Mandatory = $true)][string]$Candidate
  )
  $resolvedRoot = [IO.Path]::GetFullPath($Root).TrimEnd("\") + "\"
  $resolvedCandidate = [IO.Path]::GetFullPath($Candidate)
  if (-not $resolvedCandidate.StartsWith(
    $resolvedRoot,
    [StringComparison]::OrdinalIgnoreCase
  )) {
    throw "Refusing to write outside $resolvedRoot"
  }
  return $resolvedCandidate
}

if (-not (Test-Path -LiteralPath $jobsPath -PathType Leaf)) {
  throw "Missing $jobsPath. Run npm run voices:dev:plan first."
}

if ([string]::IsNullOrWhiteSpace($FfmpegPath)) {
  $onPath = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($null -ne $onPath) {
    $FfmpegPath = $onPath.Source
  } else {
    $portable = Join-Path $projectRoot (
      "tmp\audio-tools\node_modules\ffmpeg-static\ffmpeg.exe"
    )
    if (Test-Path -LiteralPath $portable -PathType Leaf) {
      $FfmpegPath = $portable
    }
  }
}
if (
  [string]::IsNullOrWhiteSpace($FfmpegPath) -or
  -not (Test-Path -LiteralPath $FfmpegPath -PathType Leaf)
) {
  throw "ffmpeg was not found. Install it on PATH or pass -FfmpegPath."
}

$document = Get-Content -LiteralPath $jobsPath -Raw | ConvertFrom-Json
if ($document.developmentOnly -ne $true) {
  throw "The SAPI generator only accepts a development-only job plan."
}

$selectedJobs = @($document.jobs)
if ($ProofOnly) {
  $proofIds = @($document.proofLineIds)
  $selectedJobs = @(
    $document.jobs | Where-Object { $proofIds -contains $_.lineId }
  )
}
if ($ShardIndex -ge 0) {
  if ($ShardCount -lt 1 -or $ShardIndex -ge $ShardCount) {
    throw "ShardIndex must be between 0 and ShardCount - 1."
  }
  $allSelectedJobs = @($selectedJobs)
  $selectedJobs = @(
    for ($jobIndex = 0; $jobIndex -lt $allSelectedJobs.Count; $jobIndex += 1) {
      if ($jobIndex % $ShardCount -eq $ShardIndex) {
        $allSelectedJobs[$jobIndex]
      }
    }
  )
}

foreach ($directory in @(
  $outputRoot,
  $clipsRoot,
  $workRoot,
  $fingerprintsRoot
)) {
  if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
}

$profileById = @{}
foreach ($profile in $document.profiles) {
  $profileById[[string]$profile.id] = $profile
}

$speaker = New-Object -ComObject SAPI.SpVoice
$tokens = $speaker.GetVoices()
$tokenByProfile = @{}
foreach ($profile in $document.profiles) {
  $token = $null
  for ($index = 0; $index -lt $tokens.Count; $index += 1) {
    $candidate = $tokens.Item($index)
    if (
      $candidate.GetDescription().StartsWith(
        [string]$profile.engineVoice,
        [StringComparison]::OrdinalIgnoreCase
      )
    ) {
      $token = $candidate
      break
    }
  }
  if ($null -eq $token) {
    throw "SAPI voice '$($profile.engineVoice)' is not installed."
  }
  $tokenByProfile[[string]$profile.id] = $token
}

$generated = 0
$skipped = 0

function Write-NormalizedMp3 {
  param(
    [Parameter(Mandatory = $true)][string]$WavePath,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [Parameter(Mandatory = $true)][string]$LineId
  )

  $candidatePath = Join-Path $workRoot "$LineId-candidate.mp3"
  $bestPath = Join-Path $workRoot "$LineId-best.mp3"
  foreach ($candidate in @($candidatePath, $bestPath)) {
    if (Test-Path -LiteralPath $candidate) {
      Remove-Item -LiteralPath $candidate -Force
    }
  }

  $lowGain = 0.0
  $highGain = 30.0
  $bestGain = 0.0
  $bestDistance = [double]::PositiveInfinity
  $bestLufs = [double]::NegativeInfinity
  $bestPeak = [double]::PositiveInfinity

  for ($attempt = 0; $attempt -lt 5; $attempt += 1) {
    $gain = ($lowGain + $highGain) / 2.0
    $gainText = $gain.ToString(
      "0.000",
      [Globalization.CultureInfo]::InvariantCulture
    )
    $filter = (
      "volume=${gainText}dB," +
      "asoftclip=type=tanh:threshold=0.5:output=0.7"
    )

    & $FfmpegPath `
      -hide_banner `
      -loglevel error `
      -y `
      -i $WavePath `
      -af $filter `
      -ar 48000 `
      -ac 1 `
      -codec:a libmp3lame `
      -b:a 96k `
      $candidatePath
    if ($LASTEXITCODE -ne 0) {
      throw "ffmpeg failed for $LineId with exit code $LASTEXITCODE."
    }

    $savedPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $report = (
      & $FfmpegPath `
        -hide_banner `
        -nostats `
        -i $candidatePath `
        -af "loudnorm=I=-16:TP=-1:LRA=11:print_format=json" `
        -f null - 2>&1 | Out-String
    )
    $analysisExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedPreference
    if ($analysisExitCode -ne 0) {
      throw "ffmpeg loudness analysis failed for $LineId."
    }

    $matches = [regex]::Matches(
      $report,
      '\{\s*"input_i"[\s\S]*?\}'
    )
    if ($matches.Count -eq 0) {
      throw "ffmpeg produced no loudness report for $LineId."
    }
    $measurement = $matches[$matches.Count - 1].Value | ConvertFrom-Json
    $integratedLufs = [double]::Parse(
      [string]$measurement.input_i,
      [Globalization.CultureInfo]::InvariantCulture
    )
    $truePeak = [double]::Parse(
      [string]$measurement.input_tp,
      [Globalization.CultureInfo]::InvariantCulture
    )
    $distance = [Math]::Abs($integratedLufs - -16.0)
    if ($distance -lt $bestDistance -and $truePeak -le -1.0) {
      Copy-Item -LiteralPath $candidatePath -Destination $bestPath -Force
      $bestGain = $gain
      $bestDistance = $distance
      $bestLufs = $integratedLufs
      $bestPeak = $truePeak
    }

    if ($integratedLufs -lt -16.0) {
      $lowGain = $gain
    } else {
      $highGain = $gain
    }
  }

  if (
    -not (Test-Path -LiteralPath $bestPath -PathType Leaf) -or
    $bestDistance -gt 0.5 -or
    $bestPeak -gt -1.0
  ) {
    throw (
      "Could not normalize $LineId within tolerance. Best result: " +
      "$bestLufs LUFS, $bestPeak dBTP at $bestGain dB gain."
    )
  }

  Copy-Item -LiteralPath $bestPath -Destination $OutputPath -Force
  Remove-Item -LiteralPath $candidatePath, $bestPath -Force
}

try {
  for ($index = 0; $index -lt $selectedJobs.Count; $index += 1) {
    $job = $selectedJobs[$index]
    $profile = $profileById[[string]$job.profileId]
    if ($null -eq $profile) {
      throw "Unknown profile '$($job.profileId)' for $($job.lineId)."
    }

    $relativeClip = ([string]$job.outputFile).Replace("/", "\")
    $clipPath = Assert-ContainedPath $outputRoot (
      Join-Path $outputRoot $relativeClip
    )
    $fingerprintPath = Assert-ContainedPath $outputRoot (
      Join-Path $fingerprintsRoot "$($job.lineId).sha256"
    )
    $wavePath = Assert-ContainedPath $outputRoot (
      Join-Path $workRoot "$($job.lineId).wav"
    )

    $fingerprintMatches = (
      -not $Force -and
      (Test-Path -LiteralPath $clipPath -PathType Leaf) -and
      (Test-Path -LiteralPath $fingerprintPath -PathType Leaf) -and
      ((Get-Content -LiteralPath $fingerprintPath -Raw).Trim() -eq
        [string]$job.fingerprint)
    )
    if ($fingerprintMatches) {
      $skipped += 1
      continue
    }

    foreach ($candidate in @($wavePath, $clipPath)) {
      if (Test-Path -LiteralPath $candidate) {
        Remove-Item -LiteralPath $candidate -Force
      }
    }

    Write-Progress `
      -Activity "Generating development voices" `
      -Status "$($index + 1)/$($selectedJobs.Count): $($job.lineId)" `
      -PercentComplete ((($index + 1) / $selectedJobs.Count) * 100)

    $stream = New-Object -ComObject SAPI.SpFileStream
    try {
      $speaker.Voice = $tokenByProfile[[string]$job.profileId]
      $speaker.Rate = [int]$profile.rate
      $speaker.Volume = 100
      $stream.Open($wavePath, 3, $false)
      $speaker.AudioOutputStream = $stream
      [void]$speaker.Speak([string]$job.text)
      $stream.Close()
    } finally {
      try { $stream.Close() } catch {}
      [Runtime.InteropServices.Marshal]::FinalReleaseComObject($stream) |
        Out-Null
    }

    Write-NormalizedMp3 `
      -WavePath $wavePath `
      -OutputPath $clipPath `
      -LineId ([string]$job.lineId)
    if (
      -not (Test-Path -LiteralPath $clipPath -PathType Leaf) -or
      (Get-Item -LiteralPath $clipPath).Length -eq 0
    ) {
      throw "No MP3 was created for $($job.lineId)."
    }

    Remove-Item -LiteralPath $wavePath -Force
    [IO.File]::WriteAllText(
      $fingerprintPath,
      "$($job.fingerprint)`n",
      [Text.UTF8Encoding]::new($false)
    )
    $generated += 1
  }
} finally {
  Write-Progress -Activity "Generating development voices" -Completed
  [Runtime.InteropServices.Marshal]::FinalReleaseComObject($speaker) | Out-Null
}

$manifestProfiles = @(
  $document.profiles | ForEach-Object {
    [ordered]@{
      id = $_.id
      speakerId = $_.speakerId
      provider = $_.provider
      licenseReference = $_.licenseReference
    }
  }
)
$manifestClips = @(
  $document.jobs | ForEach-Object {
    [ordered]@{
      lineId = $_.lineId
      speakerId = $_.speakerId
      profileId = $_.profileId
      sourceFile = $_.outputFile
      provenanceReference = (
        "DEVELOPMENT-ONLY local SAPI synthesis; fingerprint " +
        $_.fingerprint
      )
    }
  }
)
$manifest = [ordered]@{
  schemaVersion = 1
  storyId = $document.storyId
  contentRevision = $document.contentRevision
  disclosure = (
    "DEVELOPMENT-ONLY synthetic timing placeholders made with bundled " +
    "Windows voices; not cleared for publication or redistribution."
  )
  profiles = $manifestProfiles
  clips = $manifestClips
}
$manifestPath = Join-Path $outputRoot "development.voice-import.json"
[IO.File]::WriteAllText(
  $manifestPath,
  (($manifest | ConvertTo-Json -Depth 8) + "`n"),
  [Text.UTF8Encoding]::new($false)
)

$html = [Text.StringBuilder]::new()
[void]$html.AppendLine("<!doctype html>")
[void]$html.AppendLine('<html lang="en-SG"><meta charset="utf-8">')
[void]$html.AppendLine(
  "<meta name=`"viewport`" content=`"width=device-width,initial-scale=1`">"
)
[void]$html.AppendLine("<title>Return to Me - development voice proofs</title>")
[void]$html.AppendLine(
  "<style>body{font:16px system-ui;max-width:980px;margin:auto;padding:2rem;" +
  "background:#0b1320;color:#f7f1e7}article{border-top:1px solid #456;" +
  "padding:1rem 0}audio{width:100%}.warning{padding:1rem;background:#492f14}" +
  "small{color:#b8c7d8}</style><body>"
)
[void]$html.AppendLine("<h1>Development voice proofs</h1>")
[void]$html.AppendLine(
  '<p class="warning"><strong>Development only.</strong> Generic Windows ' +
  "voices are being used for timing and interface testing. They are not " +
  "approved final performances and must not be published.</p>"
)
foreach ($profile in $document.profiles) {
  [void]$html.AppendLine(
    "<h2>$([Net.WebUtility]::HtmlEncode([string]$profile.displayName))</h2>"
  )
  foreach ($job in @(
    $document.jobs | Where-Object { $_.profileId -eq $profile.id }
  )) {
    $clipPath = Join-Path $outputRoot (
      ([string]$job.outputFile).Replace("/", "\")
    )
    if (-not (Test-Path -LiteralPath $clipPath -PathType Leaf)) {
      continue
    }
    $lineId = [Net.WebUtility]::HtmlEncode([string]$job.lineId)
    $text = [Net.WebUtility]::HtmlEncode([string]$job.text)
    $source = [Net.WebUtility]::HtmlEncode([string]$job.outputFile)
    [void]$html.AppendLine(
      "<article><small>$lineId</small><p>$text</p>" +
      "<audio controls preload=`"none`" src=`"$source`"></audio></article>"
    )
  }
}
[void]$html.AppendLine("</body></html>")
[IO.File]::WriteAllText(
  (Join-Path $outputRoot "preview.html"),
  $html.ToString(),
  [Text.UTF8Encoding]::new($false)
)

$available = @(
  $document.jobs | Where-Object {
    Test-Path -LiteralPath (
      Join-Path $outputRoot (([string]$_.outputFile).Replace("/", "\"))
    )
  }
).Count
Write-Output (
  "Development voice generation complete: generated $generated, " +
  "reused $skipped, available $available/$($document.jobs.Count)."
)
Write-Output "Audition page: $(Join-Path $outputRoot 'preview.html')"
