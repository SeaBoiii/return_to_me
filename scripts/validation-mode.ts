export type ContentValidationMode = "development" | "deploy" | "release";

export const requiresCompleteVoiceCoverage = (
  mode: ContentValidationMode,
  importedVoiceCount: number,
): boolean =>
  mode === "release" || (mode === "deploy" && importedVoiceCount > 0);

export const describeValidationMode = (
  mode: ContentValidationMode,
  importedVoiceCount: number,
): string =>
  mode === "deploy" && importedVoiceCount === 0
    ? "deployment, subtitles only"
    : mode;
