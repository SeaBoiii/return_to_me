import { stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { artAssets as assetEntries } from "../src/art/manifest";
import {
  formatValidationIssues,
  hasValidationErrors,
  validateStory,
  type ValidationIssue,
} from "../src/engine/validation";
import { story, storyAssetIds } from "../src/story";
import {
  productionVoiceManifest,
  voiceEntries,
  voiceProfiles,
  offlinePackManifests,
} from "../src/voices";
import {
  describeValidationMode,
  requiresCompleteVoiceCoverage,
  type ContentValidationMode,
} from "./validation-mode";

const HELP = `Validate Return to Me content.

Usage:
  npm run validate
  npm run validate:deploy
  npm run validate:release

Options:
  --deploy          Allow zero voice clips, but reject partial voice coverage.
  --require-voices  Require one licensed static clip for every spoken line.
  --help            Show this message.
`;

const args = new Set(process.argv.slice(2));
if (args.has("--help")) {
  process.stdout.write(HELP);
  process.exit(0);
}

const knownArgs = new Set(["--deploy", "--require-voices"]);
const unknownArgs = [...args].filter((arg) => !knownArgs.has(arg));
if (unknownArgs.length > 0) {
  process.stderr.write(`Unknown option: ${unknownArgs.join(", ")}\n\n${HELP}`);
  process.exit(2);
}

if (args.has("--deploy") && args.has("--require-voices")) {
  process.stderr.write(
    `Choose either --deploy or --require-voices, not both.\n\n${HELP}`,
  );
  process.exit(2);
}

const validationMode: ContentValidationMode = args.has("--require-voices")
  ? "release"
  : args.has("--deploy")
    ? "deploy"
    : "development";
const requireVoices = requiresCompleteVoiceCoverage(
  validationMode,
  voiceEntries.length,
);
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = resolve(projectRoot, "public");

const validationIssue = (
  code: string,
  message: string,
  path?: string,
): ValidationIssue => ({
  severity: "error",
  code,
  message,
  ...(path === undefined ? {} : { path }),
});

const issues: ValidationIssue[] = [
  ...validateStory(story, {
    assets: assetEntries,
    voices: voiceEntries,
    offlinePacks: offlinePackManifests,
    requireVoiceCoverage: requireVoices,
  }),
];

const referencedAssetIds = new Set<string>(storyAssetIds);
const manifestAssetIds = new Set<string>(
  assetEntries.map((entry) => entry.id),
);
for (const assetId of referencedAssetIds) {
  if (!manifestAssetIds.has(assetId)) {
    issues.push(
      validationIssue(
        "missing-asset-manifest-entry",
        `Referenced asset "${assetId}" is absent from the deployed asset manifest.`,
        "assetEntries",
      ),
    );
  }
}
for (const assetId of manifestAssetIds) {
  if (!referencedAssetIds.has(assetId)) {
    issues.push(
      validationIssue(
        "unreferenced-asset-manifest-entry",
        `Asset manifest entry "${assetId}" is not referenced by the story.`,
        "assetEntries",
      ),
    );
  }
}

if (
  productionVoiceManifest.storyId !== story.id ||
  productionVoiceManifest.contentRevision !== story.revision
) {
  issues.push(
    validationIssue(
      "voice-manifest-revision-mismatch",
      "The production voice manifest must target the active story and revision.",
      "productionVoiceManifest",
    ),
  );
}

const knownSpeakerIds = new Set(story.speakers.map((speaker) => speaker.id));
const spokenSpeakerIds = new Set(
  story.nodes.flatMap((node) =>
    node.type === "line" && node.speakerId !== null ? [node.speakerId] : [],
  ),
);
const profileIds = new Set<string>();
const profiledSpeakers = new Set<string>();
for (const [index, profile] of voiceProfiles.entries()) {
  if (profileIds.has(profile.id)) {
    issues.push(
      validationIssue(
        "duplicate-voice-profile",
        `Voice profile ID "${profile.id}" is repeated.`,
        `voiceProfiles[${index}]`,
      ),
    );
  }
  profileIds.add(profile.id);
  if (profiledSpeakers.has(profile.speakerId)) {
    issues.push(
      validationIssue(
        "duplicate-speaker-profile",
        `Speaker "${profile.speakerId}" has more than one voice profile.`,
        `voiceProfiles[${index}]`,
      ),
    );
  }
  profiledSpeakers.add(profile.speakerId);
  if (!knownSpeakerIds.has(profile.speakerId)) {
    issues.push(
      validationIssue(
        "unknown-profile-speaker",
        `Voice profile "${profile.id}" references an unknown speaker.`,
        `voiceProfiles[${index}].speakerId`,
      ),
    );
  }
}
for (const speakerId of spokenSpeakerIds) {
  if (!profiledSpeakers.has(speakerId)) {
    issues.push(
      validationIssue(
        "missing-speaker-profile",
        `Spoken character "${speakerId}" needs a provider-neutral voice profile.`,
        "voiceProfiles",
      ),
    );
  }
}

for (const [index, voice] of voiceEntries.entries()) {
  if (!profileIds.has(voice.provenance.profile)) {
    issues.push(
      validationIssue(
        "unknown-voice-profile",
        `Voice "${voice.id}" references unknown profile "${voice.provenance.profile}".`,
        `voiceEntries[${index}].provenance.profile`,
      ),
    );
  }
  if (
    voice.provenance.provider.trim().length === 0 ||
    voice.provenance.license.trim().length === 0 ||
    (voice.provenance.sourceReference?.trim().length ?? 0) === 0 ||
    voice.provenance.synthetic !== true
  ) {
    issues.push(
      validationIssue(
        "invalid-voice-provenance",
        `Voice "${voice.id}" needs provider, license, source reference, and synthetic disclosure metadata.`,
        `voiceEntries[${index}].provenance`,
      ),
    );
  }
}

for (const [index, pack] of offlinePackManifests.entries()) {
  if (pack.voiceUrls.length === 0) {
    issues.push(
      validationIssue(
        "empty-offline-pack",
        `Offline pack "${pack.id}" must include at least one voice URL.`,
        `offlinePackManifests[${index}].voiceUrls`,
      ),
    );
  }
}

const localPublicPath = (
  url: string,
): { readonly path?: string; readonly error?: string } => {
  if (/^https:\/\//i.test(url)) {
    return {};
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//")) {
    return { error: "Only local paths or HTTPS URLs are supported." };
  }

  const path = resolve(publicRoot, url.replace(/^\/+/, ""));
  const fromPublic = relative(publicRoot, path);
  if (fromPublic.startsWith("..") || isAbsolute(fromPublic)) {
    return { error: "Path escapes the public directory." };
  }
  return { path };
};

const validateDeployedFile = async (
  url: string,
  label: string,
  path: string,
): Promise<number | undefined> => {
  const resolved = localPublicPath(url);
  if (resolved.error !== undefined) {
    issues.push(validationIssue("invalid-deployed-url", `${label}: ${resolved.error}`, path));
    return undefined;
  }
  if (resolved.path === undefined) {
    return undefined;
  }

  try {
    const file = await stat(resolved.path);
    if (!file.isFile() || file.size === 0) {
      issues.push(
        validationIssue(
          "invalid-deployed-file",
          `${label} does not resolve to a non-empty file.`,
          path,
        ),
      );
      return undefined;
    }
    return file.size;
  } catch {
    issues.push(
      validationIssue(
        "missing-deployed-file",
        `${label} is missing from public output (${url}).`,
        path,
      ),
    );
    return undefined;
  }
};

await Promise.all(
  assetEntries.map((asset, index) =>
    validateDeployedFile(
      asset.url,
      `Asset "${asset.id}"`,
      `assetEntries[${index}].url`,
    ),
  ),
);

const voiceSizes = new Map<string, number>();
await Promise.all(
  voiceEntries.map(async (voice, index) => {
    const size = await validateDeployedFile(
      voice.url,
      `Voice "${voice.id}"`,
      `voiceEntries[${index}].url`,
    );
    if (size !== undefined) {
      voiceSizes.set(voice.url, size);
    }
  }),
);

for (const [index, pack] of offlinePackManifests.entries()) {
  const undeclaredUrl = pack.voiceUrls.find(
    (url) => !voiceEntries.some((voice) => voice.url === url),
  );
  if (undeclaredUrl !== undefined) {
    issues.push(
      validationIssue(
        "undeclared-pack-url",
        `Offline pack "${pack.id}" contains URL without a voice entry: ${undeclaredUrl}.`,
        `offlinePackManifests[${index}].voiceUrls`,
      ),
    );
  }

  const knownSize = pack.voiceUrls.reduce(
    (total, url) => total + (voiceSizes.get(url) ?? 0),
    0,
  );
  if (pack.voiceUrls.length > 0 && knownSize > 0 && pack.expectedBytes !== knownSize) {
    issues.push(
      validationIssue(
        "pack-size-mismatch",
        `Offline pack "${pack.id}" declares ${pack.expectedBytes} bytes; local clips total ${knownSize}.`,
        `offlinePackManifests[${index}].expectedBytes`,
      ),
    );
  }
}

if (hasValidationErrors(issues)) {
  const displayLimit = 60;
  const displayed = issues.slice(0, displayLimit);
  process.stderr.write(`${formatValidationIssues(displayed)}\n`);
  if (issues.length > displayed.length) {
    process.stderr.write(
      `...and ${issues.length - displayed.length} more validation errors.\n`,
    );
  }
  process.exitCode = 1;
} else {
  const spokenLines = story.nodes.filter(
    (node) => node.type === "line" && node.speakerId !== null,
  ).length;
  const mode = describeValidationMode(validationMode, voiceEntries.length);
  process.stdout.write(
    `Content validation passed (${mode}): ${story.nodes.length} nodes, ` +
      `${assetEntries.length} art assets, ${voiceEntries.length}/${spokenLines} voiced lines.\n`,
  );
}
