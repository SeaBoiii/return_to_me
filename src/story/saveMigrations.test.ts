import { describe, expect, it } from "vitest";
import { story } from ".";

import { parseSave, type SaveV1, type StoryDefinition } from "../engine";
import {
  SCHOOL_YEARS_V1_REVISION,
  SCHOOL_YEARS_V2_REVISION,
  SCHOOL_YEARS_V3_REVISION,
  BEFORE_NURUL_V3_REVISION,
  SCHOOL_YEARS_V4_REVISION,
  schoolYearsSaveMigrations,
} from "./saveMigrations";

const stage = {
  backgroundId: "test-background",
  sprites: [],
  transition: "none",
  mood: "test",
} as const;

const makePublishedSave = (overrides: Partial<SaveV1> = {}): SaveV1 => ({
  version: 1,
  storyId: story.id,
  storyRevision: SCHOOL_YEARS_V3_REVISION,
  currentNodeId: "ch5-001",
  status: "playing",
  history: [{ kind: "choice", nodeId: "ch1-choice-sms", optionId: "sms-ask" }],
  rememberedChoices: { "ch1-choice-sms": "sms-ask" },
  unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3", "chapter-4", "chapter-5"],
  seenNodeIds: ["ch1-choice-sms", "ch5-001"],
  timestamp: 1_700_000_000_000,
  ...overrides,
});

const migratePublishedSave = (save: SaveV1) =>
  parseSave(JSON.stringify(save), story, { migrations: schoolYearsSaveMigrations });

describe("merging both published v3 editions", () => {
  it.each([SCHOOL_YEARS_V3_REVISION, BEFORE_NURUL_V3_REVISION])(
    "preserves unfinished school progress from %s",
    (storyRevision) => {
      const source = makePublishedSave({ storyRevision });
      const result = migratePublishedSave(source);
      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.save).toEqual({ ...source, storyRevision: SCHOOL_YEARS_V4_REVISION });
      }
    },
  );

  it.each([
    { currentNodeId: "ch6-choice-silence", status: "playing" as const },
    { currentNodeId: "ch7-015", status: "playing" as const },
    { currentNodeId: "ch8-012", status: "playing" as const },
    { currentNodeId: "epilogue-001", status: "playing" as const },
    { currentNodeId: "epilogue-end", status: "ended" as const },
    { currentNodeId: "ch1-001", status: "playing" as const },
  ])("keeps adulthood position $currentNodeId and its choices while unlocking NS", (position) => {
    const source = makePublishedSave({
      ...position,
      history: [
        { kind: "choice", nodeId: "ch6-choice-silence", optionId: "silence-time" },
        { kind: "line", nodeId: "epilogue-001" },
      ],
      rememberedChoices: { "ch6-choice-silence": "silence-time" },
      unlockedChapters: ["prologue", "chapter-6", "chapter-7", "chapter-8", "epilogue"],
      seenNodeIds: ["ch6-choice-silence", "epilogue-001", "epilogue-end"],
    });
    const result = migratePublishedSave(source);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toEqual({
        ...source,
        storyRevision: SCHOOL_YEARS_V4_REVISION,
        unlockedChapters: [...source.unlockedChapters, "chapter-ns"],
      });
    }
  });

  it.each([
    ["ch6-036", "ns-036"],
    ["ch6-choice-discovery", "ns-choice-discovery"],
    ["epilogue-choice-threat-scan", "uni-arrival-choice-threat-scan"],
    ["epilogue-017", "uni-arrival-017"],
  ])("maps National Service position %s to %s without losing either set of reflections", (currentNodeId, expectedId) => {
    const source = makePublishedSave({
      storyRevision: BEFORE_NURUL_V3_REVISION,
      currentNodeId,
      history: [
        { kind: "choice", nodeId: "ch1-choice-sms", optionId: "sms-ask" },
        { kind: "choice", nodeId: "ch6-choice-discovery", optionId: "discovery-ask" },
        { kind: "choice", nodeId: "epilogue-choice-threat-scan", optionId: "threat-scan-air" },
        { kind: "line", nodeId: "epilogue-threat-scan-air-001" },
      ],
      rememberedChoices: {
        "ch1-choice-sms": "sms-ask",
        "ch6-choice-discovery": "discovery-ask",
        "epilogue-choice-threat-scan": "threat-scan-air",
      },
      unlockedChapters: ["prologue", "chapter-1", "chapter-6", "epilogue"],
      seenNodeIds: ["ch1-choice-sms", "ch6-choice-discovery", "epilogue-001"],
    });
    const result = migratePublishedSave(source);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toEqual({
        ...source,
        storyRevision: SCHOOL_YEARS_V4_REVISION,
        currentNodeId: expectedId,
        history: [
          { kind: "choice", nodeId: "ch1-choice-sms", optionId: "sms-ask" },
          { kind: "choice", nodeId: "ns-choice-discovery", optionId: "discovery-ask" },
          { kind: "choice", nodeId: "uni-arrival-choice-threat-scan", optionId: "threat-scan-air" },
          { kind: "line", nodeId: "uni-arrival-threat-scan-air-001" },
        ],
        rememberedChoices: {
          "ch1-choice-sms": "sms-ask",
          "ns-choice-discovery": "discovery-ask",
          "uni-arrival-choice-threat-scan": "threat-scan-air",
        },
        unlockedChapters: ["prologue", "chapter-1", "chapter-ns"],
        seenNodeIds: ["ch1-choice-sms", "ns-choice-discovery", "uni-arrival-001"],
      });
    }
  });

  it.each([
    { currentNodeId: "epilogue-end", status: "ended" as const, expectedId: "ch6-001" },
    { currentNodeId: "ch1-001", status: "playing" as const, expectedId: "ch1-001" },
    { currentNodeId: "ch6-036", status: "playing" as const, expectedId: "ns-036" },
    { currentNodeId: "epilogue-017", status: "playing" as const, expectedId: "uni-arrival-017" },
  ])("opens Almost Us after The Doorway, preserving replay at $currentNodeId", ({ expectedId, ...position }) => {
    const result = migratePublishedSave(makePublishedSave({
      ...position,
      storyRevision: BEFORE_NURUL_V3_REVISION,
      unlockedChapters: ["prologue", "chapter-6", "epilogue"],
      seenNodeIds: ["ch6-001", "epilogue-017", "epilogue-end"],
    }));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save.currentNodeId).toBe(expectedId);
      expect(result.save.status).toBe("playing");
      expect(result.save.unlockedChapters).toEqual(["prologue", "chapter-ns", "chapter-6"]);
      expect(result.save.seenNodeIds).toEqual(["ns-001", "uni-arrival-017"]);
    }
  });

  it("does not remigrate merged-edition saves", () => {
    const source = makePublishedSave({ storyRevision: SCHOOL_YEARS_V4_REVISION });
    const result = migratePublishedSave(source);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.migrated).toBe(false);
      expect(result.save).toEqual(source);
    }
  });

  it("rejects unknown IDs instead of silently discarding unrelated progress", () => {
    expect(migratePublishedSave(makePublishedSave({
      storyRevision: BEFORE_NURUL_V3_REVISION,
      currentNodeId: "ch6-unknown",
    })).status).toBe("corrupt");
  });
});

const targetStory = {
  id: "return-to-me",
  title: "Return to Me",
  revision: SCHOOL_YEARS_V2_REVISION,
  startNodeId: "prologue-001",
  chapters: [
    {
      id: "prologue",
      title: "Prologue",
      startNodeId: "prologue-001",
    },
    {
      id: "chapter-1",
      title: "Chapter 1",
      startNodeId: "ch1-001",
    },
    {
      id: "chapter-2",
      title: "Chapter 2",
      startNodeId: "ch2-001",
    },
    {
      id: "chapter-3",
      title: "Chapter 3",
      startNodeId: "ch3-001",
    },
    {
      id: "epilogue",
      title: "Epilogue",
      startNodeId: "epilogue-001",
    },
  ],
  speakers: [],
  nodes: [
    {
      id: "prologue-001",
      chapterId: "prologue",
      type: "line",
      speakerId: null,
      text: "Prologue",
      next: "ch1-001",
      stage,
    },
    {
      id: "ch1-001",
      chapterId: "chapter-1",
      type: "line",
      speakerId: null,
      text: "Chapter 1",
      next: "ch2-001",
      stage,
    },
    {
      id: "ch2-001",
      chapterId: "chapter-2",
      type: "line",
      speakerId: null,
      text: "Chapter 2",
      next: "ch2-choice",
      stage,
    },
    {
      id: "ch2-choice",
      chapterId: "chapter-2",
      type: "choice",
      prompt: "Choose",
      choices: [{ id: "choice-a", label: "A", next: "ch2-010" }],
      stage,
    },
    {
      id: "ch2-010",
      chapterId: "chapter-2",
      type: "line",
      speakerId: null,
      text: "Still in Chapter 2",
      next: "ch3-001",
      stage,
    },
    {
      id: "ch3-001",
      chapterId: "chapter-3",
      type: "line",
      speakerId: null,
      text: "Chapter 3",
      next: "epilogue-001",
      stage,
    },
    {
      id: "epilogue-001",
      chapterId: "epilogue",
      type: "line",
      speakerId: null,
      text: "New epilogue",
      next: "epilogue-end",
      stage,
    },
    {
      id: "epilogue-end",
      chapterId: "epilogue",
      type: "end",
      title: "Continue?",
      stage,
    },
  ],
} as const satisfies StoryDefinition;

const makeOldSave = (overrides: Partial<SaveV1> = {}): SaveV1 => ({
  version: 1,
  storyId: targetStory.id,
  storyRevision: SCHOOL_YEARS_V1_REVISION,
  currentNodeId: "ch2-010",
  status: "playing",
  history: [
    { kind: "line", nodeId: "ch1-001" },
    { kind: "line", nodeId: "ch2-001" },
    { kind: "choice", nodeId: "ch2-choice", optionId: "choice-a" },
  ],
  rememberedChoices: { "ch2-choice": "choice-a" },
  unlockedChapters: ["prologue", "chapter-1", "chapter-2"],
  seenNodeIds: ["prologue-001", "ch1-001", "ch2-001", "ch2-choice"],
  timestamp: 1_700_000_000_000,
  ...overrides,
});

const expandedStory = {
  ...targetStory,
  revision: SCHOOL_YEARS_V4_REVISION,
  chapters: [
    ...targetStory.chapters.filter((chapter) => chapter.id !== "epilogue"),
    { id: "chapter-ns", title: "National Service", startNodeId: "ns-001" },
    { id: "epilogue", title: "Arrival", startNodeId: "epilogue-001" },
  ],
  nodes: [
    ...targetStory.nodes.map((node) =>
      node.id === "ch3-001" ? { ...node, next: "ns-001" } : node,
    ),
    {
      id: "ns-001",
      chapterId: "chapter-ns",
      type: "line",
      speakerId: null,
      text: "National Service",
      next: "epilogue-001",
      stage,
    },
  ],
} as const satisfies StoryDefinition;

const migrateToExpandedStory = (save: SaveV1) =>
  parseSave(JSON.stringify(save), expandedStory, {
    migrations: schoolYearsSaveMigrations,
  });

describe("combined expansion save revision migration", () => {
  it("preserves unfinished school progress without prematurely unlocking National Service", () => {
    const source = makeOldSave({ storyRevision: SCHOOL_YEARS_V2_REVISION });
    const result = migrateToExpandedStory(source);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.migrated).toBe(true);
      expect(result.save).toEqual({
        ...source,
        storyRevision: SCHOOL_YEARS_V4_REVISION,
      });
    }
  });

  it.each([
    { currentNodeId: "epilogue-001", status: "playing" as const },
    { currentNodeId: "epilogue-end", status: "ended" as const },
  ])("resumes $currentNodeId at National Service and clears obsolete ending progress", (position) => {
    const source = makeOldSave({
      ...position,
      storyRevision: SCHOOL_YEARS_V2_REVISION,
      history: [
        { kind: "choice", nodeId: "ch2-choice", optionId: "choice-a" },
        { kind: "line", nodeId: "epilogue-013" },
      ],
      rememberedChoices: {
        "ch2-choice": "choice-a",
        "epilogue-choice": "old-choice",
      },
      unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3", "epilogue"],
      seenNodeIds: ["ch2-choice", "epilogue-013", "epilogue-end"],
    });
    const result = migrateToExpandedStory(source);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toEqual({
        ...source,
        storyRevision: SCHOOL_YEARS_V4_REVISION,
        currentNodeId: "ns-001",
        status: "playing",
        history: [{ kind: "choice", nodeId: "ch2-choice", optionId: "choice-a" }],
        rememberedChoices: { "ch2-choice": "choice-a" },
        unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3", "chapter-ns"],
        seenNodeIds: ["ch2-choice"],
      });
    }
  });

  it.each<[string, Partial<SaveV1>]>([
    ["chapter unlock", { unlockedChapters: ["prologue", "chapter-1", "epilogue"] }],
    ["history", { history: [{ kind: "line", nodeId: "epilogue-013" }] }],
    ["seen nodes", { seenNodeIds: ["epilogue-end"] }],
    ["remembered choice", { rememberedChoices: { "epilogue-choice": "old-choice" } }],
  ])("keeps an earlier replay position while detecting completed content through %s", (_label, markers) => {
    const source = makeOldSave({
      storyRevision: SCHOOL_YEARS_V2_REVISION,
      currentNodeId: "ch1-001",
      ...markers,
    });
    const result = migrateToExpandedStory(source);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save.currentNodeId).toBe("ch1-001");
      expect(result.save.status).toBe("playing");
      expect(result.save.unlockedChapters).toContain("chapter-ns");
      expect(result.save.unlockedChapters).not.toContain("epilogue");
      expect(result.save.history.every((entry) => !entry.nodeId.startsWith("epilogue-"))).toBe(true);
      expect(result.save.seenNodeIds.every((id) => !id.startsWith("epilogue-"))).toBe(true);
      expect(Object.keys(result.save.rememberedChoices).every((id) => !id.startsWith("epilogue-"))).toBe(true);
    }
  });

  it("chains a completed first edition through v2 and resumes Chapter 3 before National Service", () => {
    const result = migrateToExpandedStory(makeOldSave({
      currentNodeId: "epilogue-end",
      status: "ended",
      unlockedChapters: ["prologue", "chapter-1", "chapter-2", "epilogue"],
      seenNodeIds: ["ch2-010", "epilogue-end"],
    }));

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toMatchObject({
        storyRevision: SCHOOL_YEARS_V4_REVISION,
        currentNodeId: "ch3-001",
        status: "playing",
        unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3"],
        seenNodeIds: ["ch2-010"],
      });
      expect(result.save.unlockedChapters).not.toContain("chapter-ns");
    }
  });

  it("chains unfinished first-edition progress without changing its position or choices", () => {
    const source = makeOldSave();
    const result = migrateToExpandedStory(source);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toEqual({ ...source, storyRevision: SCHOOL_YEARS_V4_REVISION });
    }
  });

  it("keeps a completed current-edition arrival intact on the next load", () => {
    const source = makeOldSave({
      storyRevision: SCHOOL_YEARS_V4_REVISION,
      currentNodeId: "epilogue-end",
      status: "ended",
      history: [{ kind: "line", nodeId: "epilogue-001" }],
      unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3", "chapter-ns", "epilogue"],
      seenNodeIds: ["epilogue-001", "epilogue-end"],
    });
    const result = migrateToExpandedStory(source);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.migrated).toBe(false);
      expect(result.save).toEqual(source);
    }
  });

  it("continues to reject unknown non-epilogue references after migration", () => {
    const result = migrateToExpandedStory(makeOldSave({
      storyRevision: SCHOOL_YEARS_V2_REVISION,
      seenNodeIds: ["unknown-node", "epilogue-end"],
    }));
    expect(result.status).toBe("corrupt");
  });
});

const migrate = (save: SaveV1) =>
  parseSave(JSON.stringify(save), targetStory, {
    migrations: schoolYearsSaveMigrations,
  });

describe("School Years save revision migration", () => {
  it("preserves an in-progress Chapter 2 save", () => {
    const source = makeOldSave();
    const result = migrate(source);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expect(result.migrated).toBe(true);
    expect(result.message).toMatch(/expanded story edition/i);
    expect(result.save).toEqual({
      ...source,
      storyRevision: SCHOOL_YEARS_V2_REVISION,
    });
  });

  it("redirects an in-progress old epilogue to Chapter 3 and removes its markers", () => {
    const result = migrate(
      makeOldSave({
        currentNodeId: "epilogue-001",
        history: [
          { kind: "line", nodeId: "ch2-001" },
          { kind: "line", nodeId: "epilogue-001" },
        ],
        rememberedChoices: {
          "ch2-choice": "choice-a",
          "epilogue-choice": "old-choice",
        },
        unlockedChapters: [
          "prologue",
          "chapter-1",
          "chapter-2",
          "epilogue",
        ],
        seenNodeIds: ["ch2-001", "epilogue-001"],
      }),
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expect(result.save).toMatchObject({
      currentNodeId: "ch3-001",
      status: "playing",
      history: [{ kind: "line", nodeId: "ch2-001" }],
      rememberedChoices: { "ch2-choice": "choice-a" },
      unlockedChapters: [
        "prologue",
        "chapter-1",
        "chapter-2",
        "chapter-3",
      ],
      seenNodeIds: ["ch2-001"],
    });
  });

  it("redirects a completed v1 story to Chapter 3 as playable progress", () => {
    const result = migrate(
      makeOldSave({
        currentNodeId: "epilogue-end",
        status: "ended",
        unlockedChapters: [
          "prologue",
          "chapter-1",
          "chapter-2",
          "epilogue",
        ],
        seenNodeIds: ["ch2-010", "epilogue-001"],
      }),
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save.currentNodeId).toBe("ch3-001");
      expect(result.save.status).toBe("playing");
      expect(result.save.unlockedChapters).toContain("chapter-3");
      expect(result.save.unlockedChapters).not.toContain("epilogue");
    }
  });

  it("keeps an earlier replay position while unlocking Chapter 3", () => {
    const result = migrate(
      makeOldSave({
        currentNodeId: "ch1-001",
        history: [],
        unlockedChapters: [
          "prologue",
          "chapter-1",
          "chapter-2",
          "epilogue",
        ],
        seenNodeIds: ["ch1-001", "epilogue-001", "epilogue-end"],
      }),
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save.currentNodeId).toBe("ch1-001");
      expect(result.save.status).toBe("playing");
      expect(result.save.unlockedChapters).toContain("chapter-3");
      expect(result.save.seenNodeIds).toEqual(["ch1-001"]);
    }
  });

  it("rejects malformed migrated references and unsupported revisions", () => {
    expect(
      migrate(
        makeOldSave({
          seenNodeIds: ["ch2-001", "unknown-old-node"],
        }),
      ).status,
    ).toBe("corrupt");

    expect(
      migrate(
        makeOldSave({ storyRevision: "school-years-0.9.0" }),
      ).status,
    ).toBe("incompatible");
  });
});
