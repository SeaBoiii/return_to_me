export type ContentValidationMode = "development" | "deploy" | "release";

export const requiresCompleteVoiceCoverage = (
  mode: ContentValidationMode,
): boolean => mode === "release";

export const requiresCompleteChapterVoiceCoverage = (
  mode: ContentValidationMode,
): boolean => mode === "deploy";

export const describeValidationMode = (
  mode: ContentValidationMode,
  importedVoiceCount: number,
): string =>
  mode === "deploy"
    ? importedVoiceCount === 0
      ? "deployment, subtitles only"
      : "deployment, complete voiced chapters"
    : mode;
