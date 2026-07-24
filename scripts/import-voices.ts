import { execFile } from "node:child_process";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { story } from "../src/story";
import { voiceProfiles } from "../src/voices";
import {
  isDevelopmentOnlyVoiceImportDocument,
  parseVoiceImportDocument,
  type VoiceImportClipInput,
  type VoiceImportDocument,
  type VoiceImportLineReference,
  type VoiceImportProfileInput,
} from "./voice-import-core";

const HELP = `Import licensed, normalized static voice clips.

Usage:
  npm run voices:check -- path/to/voice-import.json
  npm run voices:import -- path/to/voice-import.json

Options:
  --dry-run  Validate the manifest and every MP3 without writing files.
  --help     Show this message.

ffprobe and ffmpeg must both be available on PATH. Imports are complete-set,
all-or-nothing operations; partial production manifests are rejected.
`;

interface CommandResult {
  readonly stdout: string;
  readonly stderr: string;
}

interface ProbeResult {
  readonly durationMs: number;
  readonly byteSize: number;
  readonly integratedLufs: number;
  readonly truePeakDb: number;
}

interface PreparedClip extends ProbeResult {
  readonly clip: VoiceImportClipInput;
  readonly profile: VoiceImportProfileInput;
  readonly chapterId: string;
  readonly sourcePath: string;
  readonly url: string;
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = resolve(projectRoot, "public");
const outputRoot = resolve(publicRoot, "voices");
const generatedPath = resolve(projectRoot, "src/voices/generated.ts");

const args = process.argv.slice(2);
if (args.includes("--help")) {
  process.stdout.write(HELP);
  process.exit(0);
}
const dryRun = args.includes("--dry-run");
const positional = args.filter((argument) => !argument.startsWith("--"));
const unknownOptions = args.filter(
  (argument) => argument.startsWith("--") && argument !== "--dry-run",
);
if (unknownOptions.length > 0 || positional.length !== 1) {
  if (unknownOptions.length > 0) {
    process.stderr.write(`Unknown option: ${unknownOptions.join(", ")}\n\n`);
  }
  process.stderr.write(HELP);
  process.exit(2);
}

const manifestArgument = positional[0];
if (manifestArgument === undefined) {
  process.stderr.write(HELP);
  process.exit(2);
}

const runTool = (command: string, toolArgs: readonly string[]): Promise<CommandResult> =>
  new Promise((resolveCommand, rejectCommand) => {
    execFile(
      command,
      [...toolArgs],
      { encoding: "utf8", maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        if (error !== null) {
          const maybeCode = error as NodeJS.ErrnoException;
          if (maybeCode.code === "ENOENT") {
            rejectCommand(
              new Error(
                `${command} was not found on PATH. Install ffmpeg (which includes ffprobe) before importing voices.`,
              ),
            );
            return;
          }
          rejectCommand(
            new Error(
              `${command} failed: ${stderr.trim() || error.message}`,
              { cause: error },
            ),
          );
          return;
        }
        resolveCommand({ stdout, stderr });
      },
    );
  });

const parseFiniteNumber = (value: unknown, label: string): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} is missing or is not finite.`);
  }
  return parsed;
};

const recordValue = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} is not an object.`);
  }
  return value as Record<string, unknown>;
};

const probeClip = async (path: string): Promise<Omit<ProbeResult, "byteSize">> => {
  const probe = await runTool("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=codec_name,sample_rate,channels,bit_rate:format=duration,bit_rate",
    "-of",
    "json",
    path,
  ]);
  const root = recordValue(JSON.parse(probe.stdout) as unknown, "ffprobe output");
  const streams = root.streams;
  if (!Array.isArray(streams) || streams.length !== 1) {
    throw new Error("the file must contain exactly one audio stream.");
  }
  const stream = recordValue(streams[0], "ffprobe audio stream");
  const format = recordValue(root.format, "ffprobe format");
  if (stream.codec_name !== "mp3") {
    throw new Error(`codec must be MP3, found ${JSON.stringify(stream.codec_name)}.`);
  }
  const sampleRate = parseFiniteNumber(stream.sample_rate, "sample rate");
  if (sampleRate !== 48_000) {
    throw new Error(`sample rate must be 48000 Hz, found ${sampleRate}.`);
  }
  const channels = parseFiniteNumber(stream.channels, "channel count");
  if (channels !== 1) {
    throw new Error(`audio must be mono, found ${channels} channels.`);
  }
  const bitrate = parseFiniteNumber(
    stream.bit_rate ?? format.bit_rate,
    "average bitrate",
  );
  if (bitrate < 80_000 || bitrate > 112_000) {
    throw new Error(
      `average bitrate must be approximately 96 kbps (80-112 kbps accepted), found ${Math.round(bitrate / 1000)} kbps.`,
    );
  }
  const durationSeconds = parseFiniteNumber(format.duration, "duration");
  if (durationSeconds <= 0) {
    throw new Error("duration must be greater than zero.");
  }

  const loudness = await runTool("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i",
    path,
    "-af",
    "loudnorm=I=-16:TP=-1:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ]);
  const reports = [
    ...loudness.stderr.matchAll(/\{\s*"input_i"[\s\S]*?\}/g),
  ];
  const reportText = reports.at(-1)?.[0];
  if (reportText === undefined) {
    throw new Error("ffmpeg did not produce a loudness measurement.");
  }
  const report = recordValue(
    JSON.parse(reportText) as unknown,
    "ffmpeg loudness report",
  );
  const integratedLufs = parseFiniteNumber(
    report.input_i,
    "integrated loudness",
  );
  const truePeakDb = parseFiniteNumber(report.input_tp, "true peak");
  if (Math.abs(integratedLufs - -16) > 0.6) {
    throw new Error(
      `integrated loudness must be -16 LUFS +/- 0.6, found ${integratedLufs} LUFS.`,
    );
  }
  if (truePeakDb > -1) {
    throw new Error(`true peak must not exceed -1 dBTP, found ${truePeakDb} dBTP.`);
  }

  return {
    durationMs: Math.max(1, Math.round(durationSeconds * 1000)),
    integratedLufs,
    truePeakDb,
  };
};

const assertContainedPath = (
  parent: string,
  candidate: string,
  label: string,
): void => {
  const fromParent = relative(parent, candidate);
  if (fromParent === "" || fromParent.startsWith("..") || isAbsolute(fromParent)) {
    throw new Error(`${label} must resolve to a file inside ${parent}.`);
  }
};

const resolveSourceFile = async (
  manifestDirectory: string,
  sourceFile: string,
): Promise<string> => {
  if (isAbsolute(sourceFile)) {
    throw new Error("sourceFile must be relative to the import manifest.");
  }
  if (extname(sourceFile).toLowerCase() !== ".mp3") {
    throw new Error("sourceFile must have an .mp3 extension.");
  }
  const lexicalPath = resolve(manifestDirectory, sourceFile);
  assertContainedPath(manifestDirectory, lexicalPath, "sourceFile");
  const [realManifestDirectory, realSourcePath] = await Promise.all([
    realpath(manifestDirectory),
    realpath(lexicalPath),
  ]);
  assertContainedPath(realManifestDirectory, realSourcePath, "sourceFile");
  const file = await stat(realSourcePath);
  if (!file.isFile() || file.size === 0) {
    throw new Error("sourceFile must resolve to a non-empty regular file.");
  }
  return realSourcePath;
};

const q = (value: string): string => JSON.stringify(value);

const renderGeneratedModule = (
  manifest: VoiceImportDocument,
  prepared: readonly PreparedClip[],
): string => {
  const entries = prepared
    .map(
      ({ clip, profile, durationMs, chapterId, url }) => `  {
    id: ${q(`voice-${clip.lineId}`)},
    lineId: ${q(clip.lineId)},
    speakerId: ${q(clip.speakerId)},
    url: ${q(url)},
    durationMs: ${durationMs},
    packId: ${q(`voice-${chapterId}`)},
    provenance: {
      provider: ${q(profile.provider)},
      profile: ${q(profile.id)},
      license: ${q(profile.licenseReference)},
      sourceReference: ${q(clip.provenanceReference)},
      synthetic: true,
    },
  },`,
    )
    .join("\n");

  const packs = story.chapters
    .map((chapter) => {
      const chapterClips = prepared.filter(
        (entry) => entry.chapterId === chapter.id,
      );
      const expectedBytes = chapterClips.reduce(
        (total, entry) => total + entry.byteSize,
        0,
      );
      const urls = chapterClips.map((entry) => `      ${q(entry.url)},`).join("\n");
      return `  {
    id: ${q(`voice-${chapter.id}`)},
    chapterId: ${q(chapter.id)},
    title: ${q(`${chapter.title} voice pack`)},
    voiceUrls: [
${urls}
    ],
    expectedBytes: ${expectedBytes},
    contentRevision: ${q(story.revision)},
  },`;
    })
    .join("\n");

  return `import type { OfflinePackManifest, VoiceEntry } from "../engine/types";

/** Generated by \`npm run voices:import\`. Do not hand-edit. */
export const generatedVoiceDisclosure = ${q(manifest.disclosure)};

export const generatedVoiceEntries = [
${entries}
] as const satisfies readonly VoiceEntry[];

export const generatedOfflinePackManifests = [
${packs}
] as const satisfies readonly OfflinePackManifest[];
`;
};

const installPreparedClips = async (
  prepared: readonly PreparedClip[],
  generatedSource: string,
): Promise<void> => {
  const stagingRoot = resolve(publicRoot, `.voices-staging-${process.pid}`);
  const backupRoot = resolve(publicRoot, `.voices-backup-${process.pid}`);
  assertContainedPath(publicRoot, stagingRoot, "Voice staging directory");
  assertContainedPath(publicRoot, backupRoot, "Voice backup directory");
  await Promise.all([
    rm(stagingRoot, { recursive: true, force: true }),
    rm(backupRoot, { recursive: true, force: true }),
  ]);
  await mkdir(stagingRoot, { recursive: true });
  let preserveBackup = false;

  try {
    for (const entry of prepared) {
      const destination = resolve(stagingRoot, entry.chapterId, `${entry.clip.lineId}.mp3`);
      assertContainedPath(stagingRoot, destination, "Voice destination");
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(entry.sourcePath, destination);
      const copied = await stat(destination);
      if (copied.size !== entry.byteSize) {
        throw new Error(`Copied byte count changed for ${entry.clip.lineId}.`);
      }
    }

    const previousGeneratedSource = await readFile(generatedPath, "utf8");
    let movedOldOutput = false;
    let movedNewOutput = false;
    try {
      await access(outputRoot);
      await rename(outputRoot, backupRoot);
      movedOldOutput = true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
    }

    try {
      await rename(stagingRoot, outputRoot);
      movedNewOutput = true;
      await writeFile(generatedPath, generatedSource, "utf8");
      await rm(backupRoot, { recursive: true, force: true });
    } catch (error) {
      const rollbackFailures: unknown[] = [];
      await writeFile(generatedPath, previousGeneratedSource, "utf8").catch(
        (rollbackError: unknown) => rollbackFailures.push(rollbackError),
      );
      if (movedNewOutput) {
        await rm(outputRoot, { recursive: true, force: true }).catch(
          (rollbackError: unknown) => rollbackFailures.push(rollbackError),
        );
      }
      if (movedOldOutput) {
        await rename(backupRoot, outputRoot).catch((rollbackError: unknown) =>
          rollbackFailures.push(rollbackError),
        );
      }
      if (rollbackFailures.length > 0) {
        preserveBackup = true;
        throw new AggregateError(
          [error, ...rollbackFailures],
          "Voice import failed and rollback was incomplete.",
          { cause: error },
        );
      }
      throw error;
    }
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
    if (!preserveBackup) {
      await rm(backupRoot, { recursive: true, force: true });
    }
  }
};

const main = async (): Promise<void> => {
  const manifestPath = resolve(projectRoot, manifestArgument);
  const manifestDirectory = dirname(manifestPath);
  const parsedJson = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  const lines = story.nodes.flatMap((node): readonly VoiceImportLineReference[] =>
    node.type === "line" && node.speakerId !== null
      ? [{ id: node.id, speakerId: node.speakerId, chapterId: node.chapterId }]
      : [],
  );
  const manifest = parseVoiceImportDocument(parsedJson, {
    storyId: story.id,
    contentRevision: story.revision,
    lines,
    profiles: voiceProfiles,
  });
  if (!dryRun && isDevelopmentOnlyVoiceImportDocument(manifest)) {
    throw new Error(
      "Development-only voice fixtures cannot be imported into the production " +
        "manifest. Use voices:check to audit them, then obtain redistribution-cleared clips.",
    );
  }
  const clipsByLine = new Map(manifest.clips.map((clip) => [clip.lineId, clip]));
  const profilesById = new Map(
    manifest.profiles.map((profile) => [profile.id, profile]),
  );
  const prepared: PreparedClip[] = [];

  for (const [index, line] of lines.entries()) {
    const clip = clipsByLine.get(line.id);
    if (clip === undefined) {
      throw new Error(`Internal validation error: clip ${line.id} disappeared.`);
    }
    const profile = profilesById.get(clip.profileId);
    if (profile === undefined) {
      throw new Error(`Internal validation error: profile ${clip.profileId} disappeared.`);
    }
    const sourcePath = await resolveSourceFile(manifestDirectory, clip.sourceFile);
    try {
      const [media, sourceStat] = await Promise.all([
        probeClip(sourcePath),
        stat(sourcePath),
      ]);
      prepared.push({
        clip,
        profile,
        chapterId: line.chapterId,
        sourcePath,
        url: `voices/${line.chapterId}/${line.id}.mp3`,
        byteSize: sourceStat.size,
        ...media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Clip ${line.id} (${clip.sourceFile}) is invalid: ${message}`, {
        cause: error,
      });
    }
    if ((index + 1) % 25 === 0 || index + 1 === lines.length) {
      process.stdout.write(`Validated ${index + 1}/${lines.length} clips.\n`);
    }
  }

  const generatedSource = renderGeneratedModule(manifest, prepared);
  const totalBytes = prepared.reduce((total, entry) => total + entry.byteSize, 0);
  if (dryRun) {
    process.stdout.write(
      `Voice import check passed: ${prepared.length} clips, ${totalBytes} bytes, no files written.\n`,
    );
    return;
  }

  await installPreparedClips(prepared, generatedSource);
  process.stdout.write(
    `Imported ${prepared.length} clips (${totalBytes} bytes) into public/voices and regenerated src/voices/generated.ts.\n`,
  );
};

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});