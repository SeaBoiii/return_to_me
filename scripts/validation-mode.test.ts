import { describe, expect, it } from "vitest";

import {
  describeValidationMode,
  requiresCompleteVoiceCoverage,
} from "./validation-mode";

describe("content validation modes", () => {
  it("allows a subtitles-only deployment when no voices are imported", () => {
    expect(requiresCompleteVoiceCoverage("deploy", 0)).toBe(false);
    expect(describeValidationMode("deploy", 0)).toBe(
      "deployment, subtitles only",
    );
  });

  it("requires complete coverage as soon as a deployment contains voices", () => {
    expect(requiresCompleteVoiceCoverage("deploy", 1)).toBe(true);
    expect(requiresCompleteVoiceCoverage("deploy", 209)).toBe(true);
  });

  it("keeps the explicitly voiced release gate strict", () => {
    expect(requiresCompleteVoiceCoverage("release", 0)).toBe(true);
    expect(requiresCompleteVoiceCoverage("release", 209)).toBe(true);
  });

  it("keeps ordinary development validation voice-optional", () => {
    expect(requiresCompleteVoiceCoverage("development", 0)).toBe(false);
    expect(requiresCompleteVoiceCoverage("development", 1)).toBe(false);
  });
});
