import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "./StoryContext";
import { DEFAULT_SETTINGS, REPLAY_STORAGE_KEY, SAVE_STORAGE_KEY, SETTINGS_STORAGE_KEY, createInitialEngineState, reduceStory, stateToSave } from "../engine";
import { story } from "../story";

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const hook = () => renderHook(() => useStory(), { wrapper: StoryProvider });
function seedMain() {
  const state = { ...reduceStory(story, createInitialEngineState(story), { type: "START_NEW" }), currentNodeId: "ch1-020", unlockedChapters: ["prologue", "chapter-1"], seenNodeIds: ["prologue-001", "ch1-001"] };
  const raw = JSON.stringify(stateToSave(story, state, 1234), null, 2);
  localStorage.setItem(SAVE_STORAGE_KEY, raw);
  return raw;
}

describe("main and replay session ownership", () => {
  it("persists a legacy migration only on main Continue, not when entering replay", () => {
    seedMain();
    const legacy = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    legacy.storyRevision = "school-years-1.0.0";
    const raw = JSON.stringify(legacy);
    localStorage.setItem(SAVE_STORAGE_KEY, raw);
    const { result } = hook();
    expect(result.current.savedProgress).toMatchObject({ status: "ok", migrated: true });
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBe(raw);
    act(() => { result.current.startReplay("prologue"); });
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBe(raw);
    act(() => { result.current.continueGame(); });
    expect(JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) ?? "{}")).toMatchObject({ storyRevision: story.revision, currentNodeId: "ch1-020", timestamp: 1234 });
    const migrated = localStorage.getItem(SAVE_STORAGE_KEY);
    act(() => { result.current.continueGame(); });
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBe(migrated);
  });
  it("preserves exact main save bytes throughout replay, reload, resume and return", () => {
    const original = seedMain(), first = hook();
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBe(original);
    act(() => { expect(first.result.current.startReplay("chapter-1")).toBe(true); });
    act(() => first.result.current.dispatch({ type: "ADVANCE" }));
    const replayNode = first.result.current.state.currentNodeId;
    expect(replayNode).not.toBe("ch1-001");
    expect(first.result.current.sessionMode).toBe("replay");
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBe(original);
    first.unmount();
    const second = hook();
    expect(second.result.current.sessionMode).toBe("main");
    expect(second.result.current.state.currentNodeId).toBe("ch1-020");
    act(() => { expect(second.result.current.resumeReplay()).toBe(true); });
    expect(second.result.current.state.currentNodeId).toBe(replayNode);
    act(() => { expect(second.result.current.returnToMain()).toBe(true); });
    expect(second.result.current.state.currentNodeId).toBe("ch1-020");
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBe(original);
    act(() => second.result.current.dispatch({ type: "ADVANCE" }));
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).not.toBe(original);
  });

  it("isolates same-batch main progress and replay activation without crossing save destinations", () => {
    seedMain();
    const { result } = hook();
    act(() => { result.current.dispatch({ type: "ADVANCE" }); result.current.startReplay("prologue"); });
    const stored = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) ?? "{}") as { currentNodeId: string };
    expect(stored.currentNodeId).toBe("ch1-021");
    expect(result.current.state.currentNodeId).toBe(story.startNodeId);
    expect(result.current.sessionMode).toBe("replay");
  });

  it("treats corrupt replay as isolated and refuses locked chapters", () => {
    const original = seedMain();
    localStorage.setItem(REPLAY_STORAGE_KEY, "{broken");
    const { result } = hook();
    expect(result.current.replayProgress.status).toBe("corrupt");
    act(() => { expect(result.current.resumeReplay()).toBe(false); expect(result.current.startReplay("chapter-11")).toBe(false); expect(result.current.continueGame()).toBe(true); });
    expect(result.current.state.currentNodeId).toBe("ch1-020");
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBe(original);
  });

  it("keeps Auto/Skip transient and resets them at each session activation", () => {
    seedMain();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, autoMode: true, skipSeen: true, textSize: 24 }));
    const { result } = hook();
    expect(result.current.settings).toMatchObject({ autoMode: false, skipSeen: false, textSize: 24 });
    act(() => result.current.updateSettings({ autoMode: true, skipSeen: true }));
    expect(result.current.settings.autoMode).toBe(true);
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}")).toMatchObject({ autoMode: false, skipSeen: false, textSize: 24 });
    act(() => { result.current.startReplay("chapter-1"); });
    expect(result.current.settings).toMatchObject({ autoMode: false, skipSeen: false });
    act(() => result.current.updateSettings({ autoMode: true }));
    act(() => { result.current.continueGame(); });
    expect(result.current.settings.autoMode).toBe(false);
  });

  it("clears both sessions on full reset and never resurrects replay on remount", () => {
    seedMain();
    const first = hook();
    act(() => { first.result.current.startReplay("chapter-1"); });
    expect(localStorage.getItem(REPLAY_STORAGE_KEY)).not.toBeNull();
    act(() => first.result.current.resetProgress());
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(REPLAY_STORAGE_KEY)).toBeNull();
    expect(first.result.current.state.status).toBe("idle");
    expect(first.result.current.sessionMode).toBe("main");
    first.unmount();
    const second = hook();
    expect(second.result.current.savedProgress.status).toBe("empty");
    expect(second.result.current.replayProgress.status).toBe("empty");
    expect(second.result.current.resumeReplay()).toBe(false);
  });

  it("exposes storage failure while retaining the in-session main bookmark", async () => {
    seedMain();
    const { result } = hook();
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("full"); });
    await act(async () => { result.current.dispatch({ type: "ADVANCE" }); await Promise.resolve(); });
    expect(result.current.storageMessage).toMatch(/could not be written/);
    expect(result.current.savedProgress.status).toBe("ok");
    expect(result.current.state.currentNodeId).toBe("ch1-021");
  });
});
