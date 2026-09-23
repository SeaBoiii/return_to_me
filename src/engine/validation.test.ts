import { describe, expect, it } from "vitest";

import type { OfflinePackManifest, StoryDefinition, StoryNode, VoiceEntry } from "./types";
import {
  hasValidationErrors,
  validateAssetCatalog,
  validateStory,
} from "./validation";
import {
  testAssets,
  testStage,
  testStory,
  testVoices,
} from "./testFixtures";

describe("story validation", () => {
  const firstChapterPack: OfflinePackManifest = {
    id: "pack-1",
    chapterId: "chapter-1",
    title: "Chapter One voices",
    voiceUrls: [testVoices[0]!.url],
    expectedBytes: 100,
    contentRevision: testStory.revision,
  };

  it("accepts a connected, fully voiced definition", () => {
    const issues = validateStory(testStory, {
      assets: testAssets,
      voices: testVoices,
      requireVoiceCoverage: true,
    });
    expect(issues).toEqual([]);
    expect(hasValidationErrors(issues)).toBe(false);
  });

  it("reports incomplete production voice coverage", () => {
    const issues = validateStory(testStory, {
      voices: [],
      requireVoiceCoverage: true,
    });
    expect(issues.filter((entry) => entry.code === "incomplete-voice-coverage"))
      .toHaveLength(2);
  });

  it("deploys a complete voiced chapter while leaving later chapters unvoiced", () => {
    const options = {
      voices: [testVoices[0]!],
      offlinePacks: [firstChapterPack],
      requireCompleteChapterVoiceCoverage: true,
    };
    expect(validateStory(testStory, options)).toEqual([]);
    expect(validateStory(testStory, { ...options, requireVoiceCoverage: true }))
      .toEqual([expect.objectContaining({
        code: "incomplete-voice-coverage",
        path: "nodes.line-2",
      })]);
  });

  it("still permits a subtitles-only deployment", () => {
    expect(validateStory(testStory, {
      voices: [],
      offlinePacks: [],
      requireCompleteChapterVoiceCoverage: true,
    })).toEqual([]);
  });

  it("requires every alternate branch line in a voiced chapter", () => {
    const branched: StoryDefinition = {
      ...testStory,
      nodes: testStory.nodes.flatMap<StoryNode>((node) => node.type === "choice" ? [
        {
          ...node,
          choices: [
            { id: "honest", label: "Be honest", next: "branch-a" },
            { id: "quiet", label: "Stay quiet", next: "branch-b" },
          ],
        },
        ...["branch-a", "branch-b"].map((id) => ({
          id,
          type: "line" as const,
          chapterId: "chapter-1",
          stage: testStage,
          speakerId: "narrator",
          text: id,
          next: "line-2",
        })),
      ] : [node]),
    };
    const branchVoice: VoiceEntry = {
      ...testVoices[0]!, id: "voice-branch-a", lineId: "branch-a", url: "voices/branch-a.mp3",
    };
    const issues = validateStory(branched, {
      voices: [testVoices[0]!, branchVoice],
      offlinePacks: [{ ...firstChapterPack, voiceUrls: [...firstChapterPack.voiceUrls, branchVoice.url] }],
      requireCompleteChapterVoiceCoverage: true,
    });
    expect(issues).toEqual([expect.objectContaining({
      code: "incomplete-voice-coverage",
      path: "nodes.branch-b",
    })]);
  });

  it("rejects voices without an offline pack even when no pack catalog was supplied", () => {
    const issues = validateStory(testStory, {
      voices: [testVoices[0]!],
      requireCompleteChapterVoiceCoverage: true,
    });
    expect(issues.map((entry) => entry.code)).toContain("unknown-voice-pack");
  });

  it("does not let an empty declared chapter pack bypass coverage", () => {
    const issues = validateStory(testStory, {
      voices: [],
      offlinePacks: [{ ...firstChapterPack, voiceUrls: [] }],
      requireCompleteChapterVoiceCoverage: true,
    });
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      "empty-offline-pack", "orphan-voice-pack", "incomplete-voice-coverage",
    ]));
  });

  it("rejects a voice assigned to a different chapter's pack", () => {
    const issues = validateStory(testStory, {
      voices: [testVoices[0]!],
      offlinePacks: [{ ...firstChapterPack, chapterId: "chapter-2" }],
      requireCompleteChapterVoiceCoverage: true,
    });
    expect(issues.map((entry) => entry.code)).toContain("voice-pack-chapter-mismatch");
  });

  it("rejects orphan and duplicate chapter packs and URLs assigned to another pack", () => {
    const issues = validateStory(testStory, {
      voices: testVoices,
      offlinePacks: [
        { ...firstChapterPack, voiceUrls: [testVoices[0]!.url, testVoices[1]!.url] },
        { ...firstChapterPack, id: "orphan", voiceUrls: [testVoices[0]!.url] },
        { ...firstChapterPack, id: "pack-2", chapterId: "chapter-2", voiceUrls: [testVoices[1]!.url] },
      ],
      requireCompleteChapterVoiceCoverage: true,
    });
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      "duplicate-chapter-pack", "orphan-voice-pack", "undeclared-pack-url",
    ]));
  });

  it("rejects a pack that omits its associated voice URL", () => {
    const issues = validateStory(testStory, {
      voices: [testVoices[0]!],
      offlinePacks: [{ ...firstChapterPack, voiceUrls: [] }],
      requireCompleteChapterVoiceCoverage: true,
    });
    expect(issues.map((entry) => entry.code)).toContain("incomplete-pack");
  });

  it("finds broken links, unreachable nodes, and cycles", () => {
    const invalid: StoryDefinition = {
      ...testStory,
      nodes: [
        {
          id: "line-1",
          type: "line",
          chapterId: "chapter-1",
          stage: testStage,
          speakerId: "narrator",
          text: "Loop",
          next: "line-1",
        },
        {
          id: "choice-1",
          type: "choice",
          chapterId: "chapter-1",
          stage: testStage,
          prompt: "Broken?",
          choices: [
            { id: "a", label: "A", next: "not-real" },
            { id: "b", label: "B", next: "not-real" },
          ],
        },
        ...testStory.nodes.slice(2),
      ],
    };

    const codes = validateStory(invalid).map((entry) => entry.code);
    expect(codes).toContain("illegal-cycle");
    expect(codes).toContain("unreachable-node");
    expect(codes).toContain("invalid-option");
  });

  it("validates asset dimensions and focal points", () => {
    const issues = validateAssetCatalog([
      {
        ...testAssets[0]!,
        width: 0,
        focalPoint: { x: 2, y: 0.5 },
      },
    ]);
    expect(issues.map((entry) => entry.code)).toEqual([
      "invalid-asset-dimensions",
      "invalid-focal-point",
    ]);
  });
});
