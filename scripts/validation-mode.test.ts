import { describe, expect, it } from "vitest";

import {
  describeValidationMode,
  requiresCompleteChapterVoiceCoverage,
  requiresCompleteVoiceCoverage,
} from "./validation-mode";

describe("content validation modes", () => {
  it("allows a subtitles-only deployment when no voices are imported", () => {
    expect(requiresCompleteVoiceCoverage("deploy")).toBe(false);
    expect(describeValidationMode("deploy", 0)).toBe(
      "deployment, subtitles only",
    );
  });

  it("requires complete voiced chapters while permitting later unvoiced chapters", () => {
    expect(requiresCompleteChapterVoiceCoverage("deploy")).toBe(true);
    expect(requiresCompleteVoiceCoverage("deploy")).toBe(false);
    expect(describeValidationMode("deploy", 64)).toBe("deployment, complete voiced chapters");
  });

  it("keeps the explicitly voiced release gate strict", () => {
    expect(requiresCompleteVoiceCoverage("release")).toBe(true);
  });

  it("keeps ordinary development validation voice-optional", () => {
    expect(requiresCompleteVoiceCoverage("development")).toBe(false);
    expect(requiresCompleteChapterVoiceCoverage("development")).toBe(false);
  });
});
