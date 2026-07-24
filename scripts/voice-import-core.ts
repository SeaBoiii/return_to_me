export interface VoiceImportProfileInput {
  readonly id: string;
  readonly speakerId: string;
  readonly provider: string;
  readonly licenseReference: string;
}

export interface VoiceImportClipInput {
  readonly lineId: string;
  readonly speakerId: string;
  readonly profileId: string;
  readonly sourceFile: string;
  readonly provenanceReference: string;
}

export interface VoiceImportDocument {
  readonly schemaVersion: 1;
  readonly storyId: string;
  readonly contentRevision: string;
  readonly disclosure: string;
  readonly profiles: readonly VoiceImportProfileInput[];
  readonly clips: readonly VoiceImportClipInput[];
}

export interface VoiceImportLineReference {
  readonly id: string;
  readonly speakerId: string;
  readonly chapterId: string;
}

export interface VoiceImportProfileReference {
  readonly id: string;
  readonly speakerId: string;
}

export interface VoiceImportContext {
  readonly storyId: string;
  readonly contentRevision: string;
  readonly lines: readonly VoiceImportLineReference[];
  readonly profiles: readonly VoiceImportProfileReference[];
}

const developmentOnlyMarker = /\bdevelopment[- ]only\b/i;

/**
 * Development timing fixtures may be complete and technically valid, but must
 * not cross the production import boundary without redistribution rights.
 */
export const isDevelopmentOnlyVoiceImportDocument = (
  document: VoiceImportDocument,
): boolean =>
  developmentOnlyMarker.test(document.disclosure) ||
  document.profiles.some(
    (profile) =>
      developmentOnlyMarker.test(profile.provider) ||
      developmentOnlyMarker.test(profile.licenseReference),
  ) ||
  document.clips.some((clip) =>
    developmentOnlyMarker.test(clip.provenanceReference),
  );

export class VoiceImportValidationError extends Error {
  public readonly issues: readonly string[];

  public constructor(issues: readonly string[]) {
    super(`Voice import manifest is invalid:\n- ${issues.join("\n- ")}`);
    this.name = "VoiceImportValidationError";
    this.issues = issues;
  }
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const ownKeysAre = (
  value: JsonRecord,
  allowed: readonly string[],
  path: string,
  issues: string[],
): void => {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      issues.push(`${path}.${key} is not a supported field.`);
    }
  }
};

const requiredString = (
  value: JsonRecord,
  key: string,
  path: string,
  issues: string[],
): string => {
  const candidate = value[key];
  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    issues.push(`${path}.${key} must be a non-empty string.`);
    return "";
  }
  if (candidate !== candidate.trim()) {
    issues.push(`${path}.${key} must not have leading or trailing whitespace.`);
  }
  return candidate;
};

const safeIdentifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const validateIdentifier = (
  value: string,
  path: string,
  issues: string[],
): void => {
  if (value.length > 0 && !safeIdentifier.test(value)) {
    issues.push(`${path} must use lowercase kebab-case characters only.`);
  }
};

const parseProfile = (
  value: unknown,
  index: number,
  issues: string[],
): VoiceImportProfileInput => {
  const path = `profiles[${index}]`;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return { id: "", speakerId: "", provider: "", licenseReference: "" };
  }
  ownKeysAre(
    value,
    ["id", "speakerId", "provider", "licenseReference"],
    path,
    issues,
  );
  const id = requiredString(value, "id", path, issues);
  const speakerId = requiredString(value, "speakerId", path, issues);
  validateIdentifier(id, `${path}.id`, issues);
  validateIdentifier(speakerId, `${path}.speakerId`, issues);
  return {
    id,
    speakerId,
    provider: requiredString(value, "provider", path, issues),
    licenseReference: requiredString(
      value,
      "licenseReference",
      path,
      issues,
    ),
  };
};

const parseClip = (
  value: unknown,
  index: number,
  issues: string[],
): VoiceImportClipInput => {
  const path = `clips[${index}]`;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return {
      lineId: "",
      speakerId: "",
      profileId: "",
      sourceFile: "",
      provenanceReference: "",
    };
  }
  ownKeysAre(
    value,
    [
      "lineId",
      "speakerId",
      "profileId",
      "sourceFile",
      "provenanceReference",
    ],
    path,
    issues,
  );
  const lineId = requiredString(value, "lineId", path, issues);
  const speakerId = requiredString(value, "speakerId", path, issues);
  const profileId = requiredString(value, "profileId", path, issues);
  validateIdentifier(lineId, `${path}.lineId`, issues);
  validateIdentifier(speakerId, `${path}.speakerId`, issues);
  validateIdentifier(profileId, `${path}.profileId`, issues);
  return {
    lineId,
    speakerId,
    profileId,
    sourceFile: requiredString(value, "sourceFile", path, issues),
    provenanceReference: requiredString(
      value,
      "provenanceReference",
      path,
      issues,
    ),
  };
};

/**
 * Parse and validate the provider-neutral import document against the active
 * story. A production import is intentionally all-or-nothing: every spoken
 * line and every declared profile must be present exactly once.
 */
export const parseVoiceImportDocument = (
  value: unknown,
  context: VoiceImportContext,
): VoiceImportDocument => {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new VoiceImportValidationError(["The root value must be an object."]);
  }
  ownKeysAre(
    value,
    [
      "$schema",
      "schemaVersion",
      "storyId",
      "contentRevision",
      "disclosure",
      "profiles",
      "clips",
    ],
    "manifest",
    issues,
  );

  if (value.schemaVersion !== 1) {
    issues.push("manifest.schemaVersion must be 1.");
  }
  const storyId = requiredString(value, "storyId", "manifest", issues);
  const contentRevision = requiredString(
    value,
    "contentRevision",
    "manifest",
    issues,
  );
  const disclosure = requiredString(value, "disclosure", "manifest", issues);
  if (storyId !== context.storyId) {
    issues.push(
      `manifest.storyId must be ${JSON.stringify(context.storyId)} for this build.`,
    );
  }
  if (contentRevision !== context.contentRevision) {
    issues.push(
      `manifest.contentRevision must be ${JSON.stringify(context.contentRevision)} for this build.`,
    );
  }

  const rawProfiles = value.profiles;
  const profiles = Array.isArray(rawProfiles)
    ? rawProfiles.map((profile, index) => parseProfile(profile, index, issues))
    : [];
  if (!Array.isArray(rawProfiles)) {
    issues.push("manifest.profiles must be an array.");
  }

  const rawClips = value.clips;
  const clips = Array.isArray(rawClips)
    ? rawClips.map((clip, index) => parseClip(clip, index, issues))
    : [];
  if (!Array.isArray(rawClips)) {
    issues.push("manifest.clips must be an array.");
  }

  const expectedProfiles = new Map(
    context.profiles.map((profile) => [profile.id, profile]),
  );
  const importedProfiles = new Map<string, VoiceImportProfileInput>();
  for (const profile of profiles) {
    if (importedProfiles.has(profile.id)) {
      issues.push(`Profile ID ${JSON.stringify(profile.id)} is duplicated.`);
      continue;
    }
    importedProfiles.set(profile.id, profile);
    const expected = expectedProfiles.get(profile.id);
    if (expected === undefined) {
      issues.push(`Profile ID ${JSON.stringify(profile.id)} is unknown.`);
    } else if (profile.speakerId !== expected.speakerId) {
      issues.push(
        `Profile ${JSON.stringify(profile.id)} must belong to speaker ${JSON.stringify(expected.speakerId)}.`,
      );
    }
  }
  for (const profile of context.profiles) {
    if (!importedProfiles.has(profile.id)) {
      issues.push(`Required profile ${JSON.stringify(profile.id)} is missing.`);
    }
  }

  const expectedLines = new Map(context.lines.map((line) => [line.id, line]));
  const importedLines = new Map<string, VoiceImportClipInput>();
  for (const clip of clips) {
    if (importedLines.has(clip.lineId)) {
      issues.push(`Line ID ${JSON.stringify(clip.lineId)} is duplicated.`);
      continue;
    }
    importedLines.set(clip.lineId, clip);
    const expected = expectedLines.get(clip.lineId);
    if (expected === undefined) {
      issues.push(
        `Clip lineId ${JSON.stringify(clip.lineId)} is not a spoken story line.`,
      );
      continue;
    }
    if (clip.speakerId !== expected.speakerId) {
      issues.push(
        `Clip ${JSON.stringify(clip.lineId)} must use speaker ${JSON.stringify(expected.speakerId)}.`,
      );
    }
    const profile = importedProfiles.get(clip.profileId);
    if (profile === undefined) {
      issues.push(
        `Clip ${JSON.stringify(clip.lineId)} references unknown profile ${JSON.stringify(clip.profileId)}.`,
      );
    } else if (profile.speakerId !== clip.speakerId) {
      issues.push(
        `Clip ${JSON.stringify(clip.lineId)} profile ${JSON.stringify(clip.profileId)} belongs to another speaker.`,
      );
    }
  }
  for (const line of context.lines) {
    if (!importedLines.has(line.id)) {
      issues.push(`Spoken line ${JSON.stringify(line.id)} is missing a clip.`);
    }
  }

  if (issues.length > 0) {
    throw new VoiceImportValidationError(issues);
  }

  return {
    schemaVersion: 1,
    storyId,
    contentRevision,
    disclosure,
    profiles,
    clips,
  };
};