import { describe, expect, it } from "vitest";
import { createInitialEngineState, reduceStory } from "./reducer";
import { createReplaySession, reduceReplaySession, replayToSave, parseReplay, loadReplay, saveReplay, clearReplay, REPLAY_STORAGE_KEY } from "./replay";
import { SAVE_STORAGE_KEY, stateToSave, type StorageLike } from "./persistence";
import { testStory } from "./testFixtures";
import type { StoryDefinition } from "./types";

const mainState = () => reduceStory(testStory, createInitialEngineState(testStory), { type: "START_NEW" });
class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("isolated chapter replays", () => {
  it("starts only unlocked chapters with independent choices/history and copied seen state", () => {
    const main = { ...mainState(), seenNodeIds: ["line-1"], rememberedChoices: { "choice-1": "quiet" }, history: [{ kind: "line" as const, nodeId: "line-1" }] };
    expect(createReplaySession(testStory, main, "chapter-2")).toBeUndefined();
    expect(createReplaySession(testStory, main, "unknown")).toBeUndefined();
    const replay = createReplaySession(testStory, main, "chapter-1")!;
    expect(replay.state).toMatchObject({ currentNodeId: "line-1", history: [], rememberedChoices: {}, seenNodeIds: ["line-1"], unlockedChapters: ["chapter-1"] });
    expect(replay.state.seenNodeIds).not.toBe(main.seenNodeIds);
    expect(replay.state.unlockedChapters).not.toBe(main.unlockedChapters);
  });

  it("records the final choice without entering or unlocking the next chapter", () => {
    const main = mainState(), original = JSON.stringify(main);
    let replay = createReplaySession(testStory, main, "chapter-1")!;
    replay = reduceReplaySession(testStory, replay, { type: "ADVANCE" });
    replay = reduceReplaySession(testStory, replay, { type: "CHOOSE", optionId: "honest" });
    expect(replay.completed).toBe(true);
    expect(replay.state).toMatchObject({ currentNodeId: "choice-1", status: "playing", unlockedChapters: ["chapter-1"], rememberedChoices: { "choice-1": "honest" }, history: [{ kind: "line", nodeId: "line-1" }, { kind: "choice", nodeId: "choice-1", optionId: "honest" }], seenNodeIds: ["line-1", "choice-1"] });
    expect(reduceReplaySession(testStory, replay, { type: "CHOOSE", optionId: "quiet" })).toBe(replay);
    expect(JSON.stringify(main)).toBe(original);
    expect(parseReplay(JSON.stringify(replayToSave(testStory, replay, 1)), testStory, main.unlockedChapters)).toMatchObject({ status: "ok", replay: { completed: true } });
  });

  it("records a boundary line once, and does not accept chapter jumps or arbitrary loads in replay", () => {
    const story: StoryDefinition = { ...testStory, nodes: testStory.nodes.map((node) => node.id === "line-1" && node.type === "line" ? { ...node, next: "line-2" } : node) };
    const initial = createReplaySession(story, mainState(), "chapter-1")!;
    expect(reduceReplaySession(story, initial, { type: "JUMP_TO_CHAPTER", chapterId: "chapter-2" })).toBe(initial);
    const ended = reduceReplaySession(story, initial, { type: "ADVANCE" });
    expect(ended).toMatchObject({ completed: true, state: { currentNodeId: "line-1", history: [{ kind: "line", nodeId: "line-1" }], unlockedChapters: ["chapter-1"] } });
    expect(reduceReplaySession(story, ended, { type: "ADVANCE" })).toBe(ended);
  });

  it("recognises the story ending inside a replay without fabricating nodes", () => {
    const main = { ...mainState(), unlockedChapters: ["chapter-1", "chapter-2"] };
    let replay = createReplaySession(testStory, main, "chapter-2")!;
    replay = reduceReplaySession(testStory, replay, { type: "ADVANCE" });
    expect(replay).toMatchObject({ completed: true, state: { currentNodeId: "end", status: "ended", history: [{ kind: "line", nodeId: "line-2" }] } });
    expect(parseReplay(JSON.stringify(replayToSave(testStory, replay)), testStory, main.unlockedChapters).status).toBe("ok");
  });

  it("persists and clears only the replay envelope, preserving exact main bytes", () => {
    const storage = new MemoryStorage(), main = mainState();
    const rawMain = JSON.stringify(stateToSave(testStory, main, 1234), null, 3);
    storage.setItem(SAVE_STORAGE_KEY, rawMain);
    const replay = replayToSave(testStory, createReplaySession(testStory, main, "chapter-1")!, 55);
    expect(saveReplay(replay, { storage })).toEqual({ ok: true });
    expect(loadReplay(testStory, main.unlockedChapters, { storage })).toEqual({ status: "ok", replay });
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(rawMain);
    expect(clearReplay({ storage })).toEqual({ ok: true });
    expect(storage.getItem(REPLAY_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(rawMain);
  });

  it("rejects corrupt, cross-chapter, incompatible and no-longer-unlocked replays", () => {
    const main = mainState(), replay = replayToSave(testStory, createReplaySession(testStory, main, "chapter-1")!);
    expect(parseReplay("{invalid", testStory, main.unlockedChapters).status).toBe("corrupt");
    expect(parseReplay(JSON.stringify({ ...replay, chapterId: "chapter-2" }), testStory, ["chapter-1", "chapter-2"]).status).toBe("corrupt");
    expect(parseReplay(JSON.stringify(replay), testStory, []).status).toBe("incompatible");
    expect(parseReplay(JSON.stringify({ ...replay, completed: true }), testStory, main.unlockedChapters).status).toBe("corrupt");
    expect(parseReplay(JSON.stringify({ ...replay, save: { ...replay.save, storyRevision: "old" } }), testStory, main.unlockedChapters).status).toBe("incompatible");
    expect(parseReplay(JSON.stringify({ ...replay, save: { ...replay.save, history: [{ kind: "line", nodeId: "line-2" }] } }), testStory, main.unlockedChapters).status).toBe("corrupt");
  });

  it("reports blocked replay storage without throwing or touching main storage", () => {
    const storage: StorageLike = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(loadReplay(testStory, ["chapter-1"], { storage }).status).toBe("unavailable");
    expect(saveReplay(replayToSave(testStory, createReplaySession(testStory, mainState(), "chapter-1")!), { storage })).toMatchObject({ ok: false });
    expect(clearReplay({ storage })).toMatchObject({ ok: false });
  });
});
