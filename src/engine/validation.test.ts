import { describe, expect, it } from "vitest";

import type { StoryDefinition } from "./types";
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
