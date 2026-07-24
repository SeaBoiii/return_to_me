import { describe, expect, it } from "vitest";

import {
  isDevelopmentOnlyVoiceImportDocument,
  parseVoiceImportDocument,
  VoiceImportValidationError,
  type VoiceImportContext,
} from "./voice-import-core";

const context: VoiceImportContext = {
  storyId: "story",
  contentRevision: "revision-1",
  profiles: [
    { id: "narrator", speakerId: "adult" },
    { id: "student", speakerId: "child" },
  ],
  lines: [
    { id: "line-001", speakerId: "adult", chapterId: "prologue" },
    { id: "line-002", speakerId: "child", chapterId: "chapter-1" },
  ],
};

const validDocument = {
  $schema: "./voice-import.schema.json",
  schemaVersion: 1,
  storyId: "story",
  contentRevision: "revision-1",
  disclosure: "Licensed synthetic performances; no cloned voices.",
  profiles: [
    {
      id: "narrator",
      speakerId: "adult",
      provider: "Provider",
      licenseReference: "license/adult",
    },
    {
      id: "student",
      speakerId: "child",
      provider: "Provider",
      licenseReference: "license/child",
    },
  ],
  clips: [
    {
      lineId: "line-001",
      speakerId: "adult",
      profileId: "narrator",
      sourceFile: "clips/line-001.mp3",
      provenanceReference: "delivery/line-001",
    },
    {
      lineId: "line-002",
      speakerId: "child",
      profileId: "student",
      sourceFile: "clips/line-002.mp3",
      provenanceReference: "delivery/line-002",
    },
  ],
};

describe("voice import manifest validation", () => {
  it("accepts complete line, speaker, and profile coverage", () => {
    const result = parseVoiceImportDocument(validDocument, context);
    expect(result.clips.map((clip) => clip.lineId)).toEqual([
      "line-001",
      "line-002",
    ]);
  });

  it("identifies development-only fixtures before production import", () => {
    const parsed = parseVoiceImportDocument(
      {
        ...validDocument,
        disclosure: "DEVELOPMENT-ONLY timing placeholders.",
      },
      context,
    );
    expect(isDevelopmentOnlyVoiceImportDocument(parsed)).toBe(true);
    expect(
      isDevelopmentOnlyVoiceImportDocument(
        parseVoiceImportDocument(validDocument, context),
      ),
    ).toBe(false);
  });

  it("rejects incomplete production coverage", () => {
    const incomplete = {
      ...validDocument,
      clips: validDocument.clips.slice(0, 1),
    };
    expect(() => parseVoiceImportDocument(incomplete, context)).toThrow(
      /Spoken line "line-002" is missing a clip/,
    );
  });

  it("rejects a profile used for the wrong speaker", () => {
    const mismatched = {
      ...validDocument,
      clips: [
        validDocument.clips[0],
        { ...validDocument.clips[1], profileId: "narrator" },
      ],
    };
    expect(() => parseVoiceImportDocument(mismatched, context)).toThrow(
      /belongs to another speaker/,
    );
  });

  it("collects duplicate, unknown, and revision errors", () => {
    const malformed = {
      ...validDocument,
      contentRevision: "old-revision",
      extra: true,
      clips: [validDocument.clips[0], validDocument.clips[0]],
    };
    try {
      parseVoiceImportDocument(malformed, context);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(VoiceImportValidationError);
      const issues = (error as VoiceImportValidationError).issues.join("\n");
      expect(issues).toMatch(/not a supported field/);
      expect(issues).toMatch(/contentRevision/);
      expect(issues).toMatch(/duplicated/);
      expect(issues).toMatch(/line-002/);
    }
  });
});