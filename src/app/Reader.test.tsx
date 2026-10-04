import { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Reader } from "./Reader";
import { StoryProvider, useStory } from "./StoryContext";
import { DEFAULT_SETTINGS, SAVE_STORAGE_KEY, SETTINGS_STORAGE_KEY, type SettingsV1 } from "../engine";
import { story } from "../story";

// These tests exercise real reader/session/audio coordination; visual framing has separate coverage.
vi.mock("./ReadingStage", () => ({ ReadingStage: () => <div data-testid="stage" /> }));

class TestAudio extends EventTarget {
  currentTime = 0;
  volume = 1;
  muted = false;
  preload = "";
  paused = false;
  play = vi.fn(() => { this.paused = false; return Promise.resolve(); });
  pause = vi.fn(() => { this.paused = true; });
  end() { this.dispatchEvent(new Event("ended")); }
}
let audios: TestAudio[];
let current: ReturnType<typeof useStory>;

function Probe() {
  const value = useStory();
  useEffect(() => { current = value; }, [value]);
  return <output data-testid="current-node">{value.state.currentNodeId}</output>;
}
const ui = (panelOpen = false, pauseRequest = 0) => <StoryProvider><Reader panelOpen={panelOpen} pauseRequest={pauseRequest} onTitle={() => undefined} onOpenPanel={() => undefined} /><Probe /></StoryProvider>;

function seed(nodeId = "ch1-020", patch: Partial<SettingsV1> = {}) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, textSpeedMs: 0, ...patch }));
  localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ version: 1, storyId: story.id, storyRevision: story.revision,
    currentNodeId: nodeId, status: "playing", history: [], rememberedChoices: {}, unlockedChapters: ["prologue", "chapter-1"], seenNodeIds: ["ch1-020"], timestamp: 1 }));
}
const nodeId = () => screen.getByTestId("current-node").textContent;
const visibleText = () => screen.getByLabelText("Passage text").querySelector("p[aria-hidden]")?.textContent ?? "";
async function tick(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}
function visibility(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
}

beforeEach(() => {
  localStorage.clear();
  audios = [];
  vi.useFakeTimers();
  vi.stubGlobal("Audio", class {
    constructor() { const audio = new TestAudio(); audios.push(audio); return audio; }
  });
  vi.stubGlobal("PointerEvent", MouseEvent);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: vi.fn((query: string) => ({
    matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })) });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  window.getSelection()?.removeAllRanges();
});

describe("reader suspension and gestures", () => {
  it("keeps menu -> hidden tab -> menu close suspended until visible and explicitly resumed", async () => {
    seed();
    const view = render(ui());
    await tick(0);
    expect(audios).toHaveLength(1);
    audios[0]!.currentTime = 3.5;
    act(() => current.updateSettings({ autoMode: true }));
    view.rerender(ui(true));
    expect(audios[0]!.paused).toBe(true);
    visibility(true);
    view.rerender(ui(false));
    visibility(false);
    await tick(10_000);
    expect(nodeId()).toBe("ch1-020");
    expect(audios[0]!.play).toHaveBeenCalledTimes(1);
    expect(audios[0]!.currentTime).toBe(3.5);
    fireEvent.click(screen.getByRole("button", { name: "Resume reading" }));
    await tick(0);
    expect(audios[0]!.play).toHaveBeenCalledTimes(2);
    expect(audios[0]!.currentTime).toBe(3.5);
    await act(async () => { audios[0]!.end(); await Promise.resolve(); });
    await tick(499);
    expect(nodeId()).toBe("ch1-020");
    await tick(1);
    expect(nodeId()).toBe("ch1-021");
  });

  it("pauses typewriter text and resumes without revealing the rest or restarting", async () => {
    seed("ch1-020", { textSpeedMs: 60, muted: true });
    const view = render(ui());
    await tick(60);
    await tick(60);
    const before = visibleText();
    expect(before.length).toBeGreaterThan(0);
    view.rerender(ui(true));
    await tick(2000);
    expect(visibleText()).toBe(before);
    view.rerender(ui(false));
    await tick(60);
    expect(visibleText().length).toBe(before.length + 1);
    expect(audios).toHaveLength(0);
  });

  it("honors an explicit reading pause while muted until the reader resumes", async () => {
    seed("ch1-020", { textSpeedMs: 60, muted: true });
    const view = render(ui());
    await tick(60);
    const before = visibleText();
    view.rerender(ui(false, 1));
    await tick(2000);
    expect(visibleText()).toBe(before);
    expect(screen.getByRole("button", { name: "Resume reading" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Resume reading" }));
    await tick(60);
    expect(visibleText().length).toBe(before.length + 1);
    expect(audios).toHaveLength(0);
    view.rerender(ui(false, 2));
    await tick(2000);
    expect(visibleText().length).toBe(before.length + 1);
    expect(nodeId()).toBe("ch1-020");
  });

  it("retains remaining text-reading time across a panel pause without loading muted voices", async () => {
    seed("ch1-020", { muted: true });
    const view = render(ui());
    const node = story.nodes.find((item) => item.id === "ch1-020");
    if (node?.type !== "line") throw new Error("Missing test line");
    const delay = Math.max(1500, node.text.trim().split(/\s+/).length * 230);
    act(() => current.updateSettings({ autoMode: true }));
    await tick(500);
    view.rerender(ui(true));
    await tick(20_000);
    expect(nodeId()).toBe("ch1-020");
    view.rerender(ui(false));
    await tick(delay - 501);
    expect(nodeId()).toBe("ch1-020");
    await tick(1);
    expect(nodeId()).toBe("ch1-021");
    expect(audios).toHaveLength(0);
  });

  it("cancels pending Auto when the reader manually advances", async () => {
    seed("ch1-020", { muted: true });
    render(ui());
    act(() => current.updateSettings({ autoMode: true }));
    await tick(500);
    fireEvent.click(screen.getByRole("button", { name: "Advance dialogue" }));
    expect(nodeId()).toBe("ch1-021");
    expect(current.settings.autoMode).toBe(false);
    await tick(20_000);
    expect(nodeId()).toBe("ch1-021");
  });

  it("freezes the remaining Skip delay while a sheet is open", async () => {
    seed("ch1-020", { muted: true });
    const view = render(ui());
    act(() => current.updateSettings({ skipSeen: true }));
    await tick(50);
    view.rerender(ui(true));
    await tick(2000);
    expect(nodeId()).toBe("ch1-020");
    view.rerender(ui(false));
    await tick(69);
    expect(nodeId()).toBe("ch1-020");
    await tick(1);
    expect(nodeId()).toBe("ch1-021");
    await tick(1000);
    expect(nodeId()).toBe("ch1-021");
  });

  it("does not count the old completed voice after mute then re-enable", async () => {
    seed();
    render(ui());
    await tick(0);
    await act(async () => { audios[0]!.end(); await Promise.resolve(); });
    act(() => current.updateSettings({ muted: true }));
    act(() => current.updateSettings({ muted: false, autoMode: true }));
    await tick(0);
    expect(audios).toHaveLength(2);
    await tick(1000);
    expect(nodeId()).toBe("ch1-020");
    await act(async () => { audios[1]!.end(); await Promise.resolve(); });
    await tick(500);
    expect(nodeId()).toBe("ch1-021");
  });

  it("uses a short stationary dialogue tap to reveal first, then advance", async () => {
    seed("ch1-020", { textSpeedMs: 60, muted: true });
    render(ui());
    const passage = screen.getByLabelText("Passage text");
    fireEvent.pointerDown(passage, { button: 0, clientX: 40, clientY: 50 });
    fireEvent.pointerUp(passage, { button: 0, clientX: 40, clientY: 50 });
    await tick(300);
    expect(nodeId()).toBe("ch1-020");
    expect(screen.getByRole("button", { name: "Advance dialogue" })).toBeEnabled();
    fireEvent.pointerDown(passage, { button: 0, clientX: 40, clientY: 50 });
    fireEvent.pointerUp(passage, { button: 0, clientX: 40, clientY: 50 });
    await tick(300);
    expect(nodeId()).toBe("ch1-021");
  });

  it("cancels the first advance when a second tap selects a word", async () => {
    seed("ch1-020", { muted: true });
    render(ui());
    const passage = screen.getByLabelText("Passage text");
    for (let tap = 0; tap < 2; tap++) {
      fireEvent.pointerDown(passage, { button: 0, clientX: 40, clientY: 50 });
      fireEvent.pointerUp(passage, { button: 0, clientX: 40, clientY: 50 });
      await tick(80);
    }
    await tick(500);
    expect(nodeId()).toBe("ch1-020");
  });

  it("allows a collapsed caret change after a tap but cancels for selected text", async () => {
    seed("ch1-020", { muted: true });
    render(ui());
    const passage = screen.getByLabelText("Passage text");
    const tap = () => {
      fireEvent.pointerDown(passage, { button: 0, clientX: 40, clientY: 50 });
      fireEvent.pointerUp(passage, { button: 0, clientX: 40, clientY: 50 });
    };
    tap();
    const range = document.createRange();
    range.selectNodeContents(passage.querySelector("p[aria-hidden]")!);
    window.getSelection()!.addRange(range);
    act(() => { document.dispatchEvent(new Event("selectionchange")); });
    await tick(300);
    expect(nodeId()).toBe("ch1-020");
    window.getSelection()!.removeAllRanges();
    tap();
    range.collapse(true);
    window.getSelection()!.addRange(range);
    act(() => { document.dispatchEvent(new Event("selectionchange")); });
    await tick(300);
    expect(nodeId()).toBe("ch1-021");
  });

  it("does not advance for selection, scroll, drag, long press or cancelled gestures", async () => {
    seed("ch1-020", { muted: true });
    render(ui());
    const passage = screen.getByLabelText("Passage text");
    const down = () => fireEvent.pointerDown(passage, { button: 0, clientX: 40, clientY: 50 });
    const up = () => fireEvent.pointerUp(passage, { button: 0, clientX: 40, clientY: 50 });
    const range = document.createRange();
    range.selectNodeContents(passage.querySelector("p[aria-hidden]")!);
    window.getSelection()!.addRange(range);
    down(); up();
    expect(nodeId()).toBe("ch1-020");
    window.getSelection()!.removeAllRanges();
    down(); passage.scrollTop = 20; up();
    expect(nodeId()).toBe("ch1-020");
    down(); fireEvent.pointerUp(passage, { button: 0, clientX: 70, clientY: 90 });
    expect(nodeId()).toBe("ch1-020");
    down(); await tick(500); up();
    expect(nodeId()).toBe("ch1-020");
    down(); fireEvent.pointerCancel(passage); up();
    expect(nodeId()).toBe("ch1-020");
    expect(audios).toHaveLength(0);
  });
});
