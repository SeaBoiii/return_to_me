[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobeCommand = Get-Command ffprobe -ErrorAction SilentlyContinue

if ($null -eq $ffmpegCommand) {
  $ffmpegPath = Join-Path $projectRoot (
    "tmp\audio-tools\node_modules\ffmpeg-static\ffmpeg.exe"
  )
  if (-not (Test-Path -LiteralPath $ffmpegPath -PathType Leaf)) {
    throw "ffmpeg was not found on PATH or in tmp/audio-tools."
  }
  $env:PATH = "$(Split-Path -Parent $ffmpegPath);$env:PATH"
}
if ($null -eq $ffprobeCommand) {
  $ffprobePath = Join-Path $projectRoot (
    "tmp\audio-tools\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe"
  )
  if (-not (Test-Path -LiteralPath $ffprobePath -PathType Leaf)) {
    throw "ffprobe was not found on PATH or in tmp/audio-tools."
  }
  $env:PATH = "$(Split-Path -Parent $ffprobePath);$env:PATH"
}

Push-Location $projectRoot
try {
  & npm run voices:check -- (
    "voice-production/development/development.voice-import.json"
  )
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
