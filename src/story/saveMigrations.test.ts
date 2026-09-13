import { describe, expect, it } from "vitest";

import { parseSave, type SaveV1, type StoryDefinition } from "../engine";
import {
  SCHOOL_YEARS_V1_REVISION,
  SCHOOL_YEARS_V2_REVISION,
  SCHOOL_YEARS_V3_REVISION,
  schoolYearsSaveMigrations,
} from "./saveMigrations";

const stage = {
  backgroundId: "test-background",
  sprites: [],
  transition: "none",
  mood: "test",
} as const;

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

const adulthoodStory = {
  ...targetStory,
  revision: SCHOOL_YEARS_V3_REVISION,
  chapters: [
    ...targetStory.chapters.filter((chapter) => chapter.id !== "epilogue"),
    { id: "chapter-6", title: "Almost Us", startNodeId: "ch6-001" },
    { id: "epilogue", title: "Arrival", startNodeId: "epilogue-001" },
  ],
  nodes: [
    ...targetStory.nodes.map((node) =>
      node.id === "ch3-001" ? { ...node, next: "ch6-001" } : node,
    ),
    {
      id: "ch6-001",
      chapterId: "chapter-6",
      type: "line",
      speakerId: null,
      text: "University",
      next: "epilogue-001",
      stage,
    },
  ],
} as const satisfies StoryDefinition;

const migrateToAdulthood = (save: SaveV1) =>
  parseSave(JSON.stringify(save), adulthoodStory, {
    migrations: schoolYearsSaveMigrations,
  });

describe("adulthood save revision migration", () => {
  it("preserves unfinished school progress without prematurely unlocking university", () => {
    const source = makeOldSave({ storyRevision: SCHOOL_YEARS_V2_REVISION });
    const result = migrateToAdulthood(source);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.migrated).toBe(true);
      expect(result.save).toEqual({
        ...source,
        storyRevision: SCHOOL_YEARS_V3_REVISION,
      });
    }
  });

  it.each([
    { currentNodeId: "epilogue-001", status: "playing" as const },
    { currentNodeId: "epilogue-end", status: "ended" as const },
  ])("resumes $currentNodeId at university and clears obsolete ending progress", (position) => {
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
    const result = migrateToAdulthood(source);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toEqual({
        ...source,
        storyRevision: SCHOOL_YEARS_V3_REVISION,
        currentNodeId: "ch6-001",
        status: "playing",
        history: [{ kind: "choice", nodeId: "ch2-choice", optionId: "choice-a" }],
        rememberedChoices: { "ch2-choice": "choice-a" },
        unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3", "chapter-6"],
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
    const result = migrateToAdulthood(source);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save.currentNodeId).toBe("ch1-001");
      expect(result.save.status).toBe("playing");
      expect(result.save.unlockedChapters).toContain("chapter-6");
      expect(result.save.unlockedChapters).not.toContain("epilogue");
      expect(result.save.history.every((entry) => !entry.nodeId.startsWith("epilogue-"))).toBe(true);
      expect(result.save.seenNodeIds.every((id) => !id.startsWith("epilogue-"))).toBe(true);
      expect(Object.keys(result.save.rememberedChoices).every((id) => !id.startsWith("epilogue-"))).toBe(true);
    }
  });

  it("chains a completed first edition through v2 and resumes Chapter 3 before university", () => {
    const result = migrateToAdulthood(makeOldSave({
      currentNodeId: "epilogue-end",
      status: "ended",
      unlockedChapters: ["prologue", "chapter-1", "chapter-2", "epilogue"],
      seenNodeIds: ["ch2-010", "epilogue-end"],
    }));

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toMatchObject({
        storyRevision: SCHOOL_YEARS_V3_REVISION,
        currentNodeId: "ch3-001",
        status: "playing",
        unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3"],
        seenNodeIds: ["ch2-010"],
      });
      expect(result.save.unlockedChapters).not.toContain("chapter-6");
    }
  });

  it("chains unfinished first-edition progress without changing its position or choices", () => {
    const source = makeOldSave();
    const result = migrateToAdulthood(source);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toEqual({ ...source, storyRevision: SCHOOL_YEARS_V3_REVISION });
    }
  });

  it("keeps a completed current-edition arrival intact on the next load", () => {
    const source = makeOldSave({
      storyRevision: SCHOOL_YEARS_V3_REVISION,
      currentNodeId: "epilogue-end",
      status: "ended",
      history: [{ kind: "line", nodeId: "epilogue-001" }],
      unlockedChapters: ["prologue", "chapter-1", "chapter-2", "chapter-3", "chapter-6", "epilogue"],
      seenNodeIds: ["epilogue-001", "epilogue-end"],
    });
    const result = migrateToAdulthood(source);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.migrated).toBe(false);
      expect(result.save).toEqual(source);
    }
  });

  it("continues to reject unknown non-epilogue references after migration", () => {
    const result = migrateToAdulthood(makeOldSave({
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
