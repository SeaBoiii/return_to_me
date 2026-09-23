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

  it("accepts a complete chapter batch with only its required profiles", () => {
    const result = parseVoiceImportDocument(
      {
        ...validDocument,
        chapterIds: ["prologue"],
        profiles: validDocument.profiles.slice(0, 1),
        clips: validDocument.clips.slice(0, 1),
      },
      context,
    );
    expect(result.chapterIds).toEqual(["prologue"]);
    expect(result.clips.map((clip) => clip.lineId)).toEqual(["line-001"]);
    expect(result.profiles.map((profile) => profile.id)).toEqual(["narrator"]);
  });

  it("allows the existing full profile list in a chapter batch", () => {
    const result = parseVoiceImportDocument(
      {
        ...validDocument,
        chapterIds: ["prologue"],
        clips: validDocument.clips.slice(0, 1),
      },
      context,
    );
    expect(result.profiles).toHaveLength(2);
    expect(result.clips).toHaveLength(1);
  });

  it("still requires every declared profile when chapterIds is absent", () => {
    const fullStory = parseVoiceImportDocument(validDocument, context);
    expect(fullStory).not.toHaveProperty("chapterIds");
    expect(() => parseVoiceImportDocument(
      { ...validDocument, profiles: validDocument.profiles.slice(0, 1) },
      context,
    )).toThrow(/Required profile "student" is missing/);
  });

  it.each([
    { chapterIds: [], error: /non-empty array/ },
    { chapterIds: "prologue", error: /non-empty array/ },
    { chapterIds: null, error: /non-empty array/ },
    { chapterIds: ["prologue", "prologue"], error: /duplicated/ },
    { chapterIds: ["unknown"], error: /Chapter ID "unknown" is unknown/ },
    { chapterIds: ["Prologue"], error: /lowercase kebab-case/ },
    { chapterIds: [" prologue"], error: /lowercase kebab-case/ },
    { chapterIds: [""], error: /non-empty string/ },
    { chapterIds: [1], error: /non-empty string/ },
  ])("rejects invalid chapter selection $chapterIds", ({ chapterIds, error }) => {
    expect(() => parseVoiceImportDocument(
      { ...validDocument, chapterIds },
      context,
    )).toThrow(error);
  });

  it("uses the declared chapter catalog when provided", () => {
    expect(() => parseVoiceImportDocument(
      { ...validDocument, chapterIds: ["chapter-1"] },
      { ...context, chapterIds: ["prologue"] },
    )).toThrow(/Chapter ID "chapter-1" is unknown/);
  });

  it("rejects clips from chapters outside the selected batch", () => {
    expect(() => parseVoiceImportDocument(
      { ...validDocument, chapterIds: ["prologue"] },
      context,
    )).toThrow(/Clip "line-002" belongs to unselected chapter "chapter-1"/);
  });

  it("requires every branch line in a selected chapter", () => {
    const withBranch: VoiceImportContext = {
      ...context,
      lines: [
        ...context.lines,
        { id: "branch-001", speakerId: "child", chapterId: "chapter-1" },
      ],
    };
    const missingBranch = {
      ...validDocument,
      chapterIds: ["chapter-1"],
      profiles: validDocument.profiles.slice(1),
      clips: validDocument.clips.slice(1),
    };
    expect(() => parseVoiceImportDocument(missingBranch, withBranch)).toThrow(
      /Spoken line "branch-001" is missing a clip/,
    );
    expect(parseVoiceImportDocument({
      ...missingBranch,
      clips: [
        ...missingBranch.clips,
        {
          ...validDocument.clips[1],
          lineId: "branch-001",
          sourceFile: "clips/branch-001.mp3",
          provenanceReference: "delivery/branch-001",
        },
      ],
    }, withBranch).clips).toHaveLength(2);
  });

  it("requires the selected chapter's profiles and retains provenance checks", () => {
    expect(() => parseVoiceImportDocument(
      {
        ...validDocument,
        chapterIds: ["chapter-1"],
        profiles: validDocument.profiles.slice(0, 1),
        clips: [{ ...validDocument.clips[1], provenanceReference: "" }],
      },
      context,
    )).toThrow(/Required profile "student" is missing/);
    expect(() => parseVoiceImportDocument(
      {
        ...validDocument,
        chapterIds: ["chapter-1"],
        clips: [{ ...validDocument.clips[1], provenanceReference: "" }],
      },
      context,
    )).toThrow(/provenanceReference must be a non-empty string/);
  });

  it("rejects duplicate clips in a chapter batch", () => {
    expect(() => parseVoiceImportDocument(
      {
        ...validDocument,
        chapterIds: ["prologue"],
        clips: [validDocument.clips[0], validDocument.clips[0]],
      },
      context,
    )).toThrow(/Line ID "line-001" is duplicated/);
  });

  it("rejects a batch that would remove an already imported chapter", () => {
    expect(() => parseVoiceImportDocument(
      {
        ...validDocument,
        chapterIds: ["chapter-1"],
        clips: validDocument.clips.slice(1),
      },
      { ...context, importedChapterIds: ["prologue"] },
    )).toThrow(/Already imported chapter "prologue" must remain in this cumulative import/);
  });

  it("accepts cumulative expansion, replacing the same chapters, and full-story upgrades", () => {
    const installed = { ...context, importedChapterIds: ["prologue", "prologue"] };
    expect(parseVoiceImportDocument({
      ...validDocument,
      chapterIds: ["prologue"],
      clips: validDocument.clips.slice(0, 1),
    }, installed).clips).toHaveLength(1);
    expect(parseVoiceImportDocument({
      ...validDocument,
      chapterIds: ["prologue", "chapter-1"],
    }, installed).clips).toHaveLength(2);
    expect(parseVoiceImportDocument(validDocument, installed).clips).toHaveLength(2);
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
