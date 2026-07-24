import { describe, expect, it } from "vitest";

import {
  createInitialEngineState,
  getCurrentNode,
  getDialogueHistory,
  reduceStory,
} from "./reducer";
import { testStory } from "./testFixtures";

describe("story reducer", () => {
  it("advances lines, remembers a choice, and reconverges", () => {
    let state = createInitialEngineState(testStory);
    expect(state.status).toBe("idle");

    state = reduceStory(testStory, state, { type: "START_NEW" });
    state = reduceStory(testStory, state, { type: "ADVANCE" });
    expect(getCurrentNode(testStory, state)?.id).toBe("choice-1");
    expect(state.seenNodeIds).toContain("line-1");

    state = reduceStory(testStory, state, {
      type: "CHOOSE",
      optionId: "honest",
    });
    expect(state.currentNodeId).toBe("line-2");
    expect(state.rememberedChoices["choice-1"]).toBe("honest");
    expect(state.unlockedChapters).toEqual(["chapter-1", "chapter-2"]);

    const history = getDialogueHistory(testStory, state.history);
    expect(history.map((entry) => entry.text)).toEqual([
      "A remembered beginning.",
      "Be honest",
    ]);

    state = reduceStory(testStory, state, { type: "ADVANCE" });
    expect(state.status).toBe("ended");
    expect(state.currentNodeId).toBe("end");
  });

  it("ignores invalid actions and locked chapter jumps", () => {
    const initial = createInitialEngineState(testStory);
    expect(
      reduceStory(testStory, initial, {
        type: "JUMP_TO_CHAPTER",
        chapterId: "chapter-2",
      }),
    ).toBe(initial);
    expect(reduceStory(testStory, initial, { type: "ADVANCE" })).toBe(initial);

    const playing = reduceStory(testStory, initial, { type: "START_NEW" });
    expect(
      reduceStory(testStory, playing, {
        type: "CHOOSE",
        optionId: "not-real",
      }),
    ).toBe(playing);
  });

  it("keeps seen nodes and unlocked chapters on replay, but reset clears them", () => {
    let state = reduceStory(testStory, createInitialEngineState(testStory), {
      type: "START_NEW",
    });
    state = reduceStory(testStory, state, { type: "ADVANCE" });
    state = reduceStory(testStory, state, {
      type: "CHOOSE",
      optionId: "quiet",
    });

    const replay = reduceStory(testStory, state, { type: "START_NEW" });
    expect(replay.currentNodeId).toBe("line-1");
    expect(replay.history).toEqual([]);
    expect(replay.rememberedChoices).toEqual({});
    expect(replay.seenNodeIds).toEqual(["line-1", "choice-1"]);
    expect(replay.unlockedChapters).toEqual(["chapter-1", "chapter-2"]);

    expect(reduceStory(testStory, replay, { type: "RESET" })).toEqual(
      createInitialEngineState(testStory),
    );
  });
});
