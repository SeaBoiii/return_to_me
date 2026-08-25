import { describe, expect, it } from "vitest";

import { parseSave, type SaveV1, type StoryDefinition } from "../engine";
import {
  BEFORE_NURUL_V3_REVISION,
  SCHOOL_YEARS_V1_REVISION,
  SCHOOL_YEARS_V2_REVISION,
  migrateSchoolYearsV1ToV2,
  migrateSchoolYearsV2ToBeforeNurulV3,
  schoolYearsSaveMigrations,
} from "./saveMigrations";

const stage = {
  backgroundId: "test-background",
  sprites: [],
  transition: "none",
  mood: "test",
} as const;

const targetStory = {
  id: "return-to-me-school-years",
  title: "Return to Me: Before Nurul",
  revision: BEFORE_NURUL_V3_REVISION,
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
      id: "chapter-4",
      title: "Chapter 4",
      startNodeId: "ch4-001",
    },
    {
      id: "chapter-5",
      title: "Chapter 5",
      startNodeId: "ch5-001",
    },
    {
      id: "chapter-6",
      title: "The Story I Wasn't In",
      startNodeId: "ch6-001",
    },
    {
      id: "epilogue",
      title: "The Doorway",
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
      next: "ch4-001",
      stage,
    },
    {
      id: "ch4-001",
      chapterId: "chapter-4",
      type: "line",
      speakerId: null,
      text: "Chapter 4",
      next: "ch5-001",
      stage,
    },
    {
      id: "ch5-001",
      chapterId: "chapter-5",
      type: "line",
      speakerId: null,
      text: "Chapter 5",
      next: "ch6-001",
      stage,
    },
    {
      id: "ch6-001",
      chapterId: "chapter-6",
      type: "line",
      speakerId: null,
      text: "Chapter 6",
      next: "epilogue-001",
      stage,
    },
    {
      id: "epilogue-001",
      chapterId: "epilogue",
      type: "line",
      speakerId: null,
      text: "The Doorway",
      next: "epilogue-end",
      stage,
    },
    {
      id: "epilogue-end",
      chapterId: "epilogue",
      type: "end",
      title: "University had barely begun.",
      stage,
    },
  ],
} as const satisfies StoryDefinition;

const makeSave = (
  storyRevision: string,
  overrides: Partial<SaveV1> = {},
): SaveV1 => ({
  version: 1,
  storyId: targetStory.id,
  storyRevision,
  currentNodeId: "ch5-001",
  status: "playing",
  history: [
    { kind: "line", nodeId: "ch2-001" },
    { kind: "choice", nodeId: "ch2-choice", optionId: "choice-a" },
    { kind: "line", nodeId: "ch2-010" },
  ],
  rememberedChoices: { "ch2-choice": "choice-a" },
  unlockedChapters: [
    "prologue",
    "chapter-1",
    "chapter-2",
    "chapter-3",
    "chapter-4",
    "chapter-5",
  ],
  seenNodeIds: ["prologue-001", "ch2-001", "ch2-choice", "ch2-010"],
  timestamp: 1_700_000_000_000,
  ...overrides,
});

const makeV1Save = (overrides: Partial<SaveV1> = {}): SaveV1 =>
  makeSave(SCHOOL_YEARS_V1_REVISION, {
    currentNodeId: "ch2-010",
    unlockedChapters: ["prologue", "chapter-1", "chapter-2"],
    ...overrides,
  });

const makeV2Save = (overrides: Partial<SaveV1> = {}): SaveV1 =>
  makeSave(SCHOOL_YEARS_V2_REVISION, overrides);

const migrate = (save: SaveV1) =>
  parseSave(JSON.stringify(save), targetStory, {
    migrations: schoolYearsSaveMigrations,
  });

const expectChapterSixRestart = (save: SaveV1): void => {
  expect(save).toMatchObject({
    storyRevision: BEFORE_NURUL_V3_REVISION,
    currentNodeId: "ch6-001",
    status: "playing",
  });
  expect(save.unlockedChapters).toContain("chapter-6");
  expect(save.unlockedChapters).not.toContain("epilogue");
  expect(save.unlockedChapters.filter((id) => id === "chapter-6")).toHaveLength(
    1,
  );
  expect(save.history.every((entry) => !entry.nodeId.startsWith("epilogue-")))
    .toBe(true);
  expect(
    Object.keys(save.rememberedChoices).every(
      (nodeId) => !nodeId.startsWith("epilogue-"),
    ),
  ).toBe(true);
  expect(save.seenNodeIds.every((id) => !id.startsWith("epilogue-"))).toBe(
    true,
  );
};

describe("Before Nurul save revision migration", () => {
  it("registers both revision steps and rejects the wrong direct inputs", () => {
    expect(schoolYearsSaveMigrations).toEqual({
      [SCHOOL_YEARS_V1_REVISION]: migrateSchoolYearsV1ToV2,
      [SCHOOL_YEARS_V2_REVISION]: migrateSchoolYearsV2ToBeforeNurulV3,
    });
    expect(migrateSchoolYearsV1ToV2(makeV2Save(), targetStory)).toBeUndefined();
    expect(
      migrateSchoolYearsV2ToBeforeNurulV3(makeV1Save(), targetStory),
    ).toBeUndefined();
  });

  it("preserves an earlier v2 position and progress except for its revision", () => {
    const source = makeV2Save({
      currentNodeId: "ch4-001",
      history: [
        { kind: "line", nodeId: "ch2-001" },
        { kind: "choice", nodeId: "ch2-choice", optionId: "choice-a" },
      ],
      unlockedChapters: [
        "prologue",
        "chapter-1",
        "chapter-2",
        "chapter-3",
        "chapter-4",
      ],
      seenNodeIds: ["prologue-001", "ch2-001", "ch2-choice", "ch4-001"],
    });
    const result = migrate(source);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expect(result.migrated).toBe(true);
    expect(result.message).toMatch(/expanded story edition/i);
    expect(result.save).toEqual({
      ...source,
      storyRevision: BEFORE_NURUL_V3_REVISION,
    });
  });

  it("restarts an in-progress old epilogue at Chapter 6 and removes every obsolete marker", () => {
    const result = migrate(
      makeV2Save({
        currentNodeId: "epilogue-001",
        history: [
          { kind: "line", nodeId: "ch5-001" },
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
          "chapter-3",
          "chapter-4",
          "chapter-5",
          "epilogue",
          "chapter-6",
        ],
        seenNodeIds: ["ch5-001", "epilogue-001", "epilogue-end"],
      }),
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expectChapterSixRestart(result.save);
    expect(result.save.history).toEqual([
      { kind: "line", nodeId: "ch5-001" },
    ]);
    expect(result.save.rememberedChoices).toEqual({
      "ch2-choice": "choice-a",
    });
    expect(result.save.seenNodeIds).toEqual(["ch5-001"]);
  });

  it.each([
    {
      signal: "current node",
      overrides: { currentNodeId: "epilogue-001" },
    },
    {
      signal: "history",
      overrides: {
        history: [{ kind: "line", nodeId: "epilogue-001" }] as const,
      },
    },
    {
      signal: "seen nodes",
      overrides: { seenNodeIds: ["ch5-001", "epilogue-001"] },
    },
    {
      signal: "remembered choices",
      overrides: {
        rememberedChoices: { "epilogue-choice": "old-choice" },
      },
    },
    {
      signal: "chapter unlocks",
      overrides: {
        unlockedChapters: [
          "prologue",
          "chapter-1",
          "chapter-2",
          "chapter-3",
          "chapter-4",
          "chapter-5",
          "epilogue",
        ],
      },
    },
    {
      signal: "ended status",
      overrides: { status: "ended" as const },
    },
  ])("recognises old epilogue progress from $signal", ({ overrides }) => {
    const result = migrate(makeV2Save(overrides));

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expectChapterSixRestart(result.save);
    }
  });

  it("restarts a completed v2 story at Chapter 6 as playable progress", () => {
    const result = migrate(
      makeV2Save({
        currentNodeId: "epilogue-end",
        status: "ended",
        history: [
          { kind: "line", nodeId: "ch5-001" },
          { kind: "line", nodeId: "epilogue-001" },
        ],
        unlockedChapters: [
          "prologue",
          "chapter-1",
          "chapter-2",
          "chapter-3",
          "chapter-4",
          "chapter-5",
          "epilogue",
        ],
        seenNodeIds: ["ch5-001", "epilogue-001", "epilogue-end"],
      }),
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expectChapterSixRestart(result.save);
    }
  });

  it("chains an earlier v1 save through both revisions without moving it", () => {
    const source = makeV1Save();
    const result = migrate(source);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.save).toEqual({
        ...source,
        storyRevision: BEFORE_NURUL_V3_REVISION,
      });
    }
  });

  it("chains a completed v1 save to Chapter 3 rather than skipping to Chapter 6", () => {
    const result = migrate(
      makeV1Save({
        currentNodeId: "epilogue-end",
        status: "ended",
        history: [
          { kind: "line", nodeId: "ch2-010" },
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
        seenNodeIds: ["ch2-010", "epilogue-001", "epilogue-end"],
      }),
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expect(result.save).toMatchObject({
      storyRevision: BEFORE_NURUL_V3_REVISION,
      currentNodeId: "ch3-001",
      status: "playing",
      history: [{ kind: "line", nodeId: "ch2-010" }],
      rememberedChoices: { "ch2-choice": "choice-a" },
      unlockedChapters: [
        "prologue",
        "chapter-1",
        "chapter-2",
        "chapter-3",
      ],
      seenNodeIds: ["ch2-010"],
    });
    expect(result.save.unlockedChapters).not.toContain("chapter-6");
  });

  it("rejects malformed migrated references, malformed shapes, and unsupported revisions", () => {
    expect(
      migrate(
        makeV2Save({
          seenNodeIds: ["ch5-001", "unknown-old-node"],
        }),
      ).status,
    ).toBe("corrupt");

    expect(
      migrate(
        makeV2Save({
          currentNodeId: "epilogue-001",
          history: [
            { kind: "line", nodeId: "epilogue-001" },
            { kind: "line", nodeId: "unknown-old-node" },
          ],
        }),
      ).status,
    ).toBe("corrupt");

    expect(
      migrate(
        makeV2Save({
          rememberedChoices: { "ch2-choice": "" },
        }),
      ).status,
    ).toBe("corrupt");

    expect(
      migrate(makeV2Save({ storyRevision: "school-years-0.9.0" })).status,
    ).toBe("incompatible");
  });
});
