import { afterEach, describe, expect, it, vi } from "vitest";
import * as cachedVoice from "../pwa/cachedVoice";

import {
  AudioManager,
  type AudioElementFactory,
  type AudioElementLike,
  type AudioEvent,
  type AudioPlaybackSnapshot,
} from "./audio";
import { testVoices } from "./testFixtures";

afterEach(() => vi.restoreAllMocks());

class FakeAudio implements AudioElementLike {
  currentTime = 0;
  duration = Number.NaN;
  volume = 1;
  muted = false;
  preload = "";
  paused = false;
  readonly listeners = new Map<AudioEvent, Set<() => void>>();

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  addEventListener(type: AudioEvent, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: AudioEvent, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: AudioEvent): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

describe("AudioManager", () => {
  it("applies settings and resolves when a clip ends", async () => {
    const created: FakeAudio[] = [];
    const factory: AudioElementFactory = () => {
      const audio = new FakeAudio();
      created.push(audio);
      return audio;
    };
    const manager = new AudioManager(testVoices, {
      factory,
      volume: 0.4,
      muted: true,
    });

    const completion = manager.playLine("line-1");
    expect(created[0]).toMatchObject({
      preload: "auto",
      volume: 0.4,
      muted: true,
    });
    created[0]?.emit("ended");

    await expect(completion).resolves.toMatchObject({
      status: "ended",
      lineId: "line-1",
    });
    expect(manager.isPlaying).toBe(false);
  });

  it("stops a previous voice when another line starts", async () => {
    const created: FakeAudio[] = [];
    const manager = new AudioManager(testVoices, {
      factory: () => {
        const audio = new FakeAudio();
        created.push(audio);
        return audio;
      },
    });

    const first = manager.playLine("line-1");
    const second = manager.playLine("line-2");
    await expect(first).resolves.toMatchObject({ status: "stopped" });
    expect(created[0]?.paused).toBe(true);
    created[1]?.emit("ended");
    await expect(second).resolves.toMatchObject({
      status: "ended",
      lineId: "line-2",
    });
  });

  it("falls back cleanly for an unvoiced line", async () => {
    const manager = new AudioManager(testVoices, {
      factory: () => new FakeAudio(),
    });
    await expect(manager.playLine("missing-line")).resolves.toMatchObject({
      status: "missing",
      lineId: "missing-line",
    });
  });

  it("replays the last available clip", async () => {
    const created: FakeAudio[] = [];
    const manager = new AudioManager(testVoices, {
      factory: () => {
        const audio = new FakeAudio();
        created.push(audio);
        return audio;
      },
    });

    const first = manager.playLine("line-1");
    created[0]?.emit("ended");
    await first;

    const replay = manager.replay();
    expect(created).toHaveLength(2);
    created[1]?.emit("ended");
    await expect(replay).resolves.toMatchObject({
      status: "ended",
      lineId: "line-1",
    });
  });

  it("pauses at the current position without settling, and resumes the same element", async () => {
    const audio = new FakeAudio();
    const factory = vi.fn(() => audio);
    const manager = new AudioManager(testVoices, { factory });
    const states: string[] = [];
    const unsubscribe = manager.subscribe((state) => states.push(state));
    const settled = vi.fn();
    const completion = manager.playLine("line-1");
    void completion.then(settled);
    expect(manager.state).toBe("loading");
    expect(manager.isPlaying).toBe(false);
    await Promise.resolve();
    expect(manager.isPlaying).toBe(true);
    audio.currentTime = 4.25;
    manager.pause();
    await Promise.resolve();
    expect(manager.state).toBe("paused");
    expect(manager.currentLineId).toBe("line-1");
    expect(audio.currentTime).toBe(4.25);
    expect(settled).not.toHaveBeenCalled();
    await manager.resume();
    expect(manager.state).toBe("playing");
    expect(audio.currentTime).toBe(4.25);
    expect(factory).toHaveBeenCalledTimes(1);
    audio.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
    expect(states).toEqual(["idle", "loading", "playing", "paused", "loading", "playing", "idle"]);
    unsubscribe();
    void manager.playLine("line-2");
    expect(states.at(-1)).toBe("idle");
    manager.dispose();
  });

  it("ignores the interrupted pending play rejection and keeps its completion through resume", async () => {
    const audio = new FakeAudio();
    let rejectPlay!: (error: Error) => void;
    vi.spyOn(audio, "play").mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectPlay = reject; }));
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const settled = vi.fn();
    const completion = manager.playLine("line-1");
    void completion.then(settled);
    manager.pause();
    rejectPlay(new DOMException("Interrupted by pause", "AbortError"));
    await Promise.resolve();
    expect(manager.state).toBe("paused");
    expect(settled).not.toHaveBeenCalled();
    await manager.resume();
    audio.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
  });

  it("does not let a stale play promise or events affect a newer line", async () => {
    const first = new FakeAudio(), second = new FakeAudio();
    let resolvePlay!: () => void;
    vi.spyOn(first, "play").mockImplementation(() => new Promise<void>((resolve) => { resolvePlay = resolve; }));
    const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const manager = new AudioManager(testVoices, { factory });
    const completion = manager.playLine("line-1");
    const next = manager.playLine("line-2");
    await expect(completion).resolves.toMatchObject({ status: "stopped" });
    resolvePlay();
    first.emit("ended");
    first.emit("error");
    await Promise.resolve();
    expect(first.paused).toBe(true);
    expect(manager.currentLineId).toBe("line-2");
    expect(manager.state).toBe("playing");
    second.emit("ended");
    await expect(next).resolves.toMatchObject({ status: "ended" });
  });

  it("defers an ended event already queued when paused until explicit resume", async () => {
    const audio = new FakeAudio();
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const completion = manager.playLine("line-1"), settled = vi.fn();
    void completion.then(settled);
    await Promise.resolve();
    manager.pause();
    audio.emit("ended");
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    expect(manager.state).toBe("paused");
    await manager.resume();
    await expect(completion).resolves.toMatchObject({ status: "ended" });
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it.each(["NotAllowedError", "NotSupportedError"])("settles a failed resume (%s) once with observable feedback", async (name) => {
    const audio = new FakeAudio();
    const play = vi.spyOn(audio, "play");
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const completion = manager.playLine("line-1");
    await Promise.resolve();
    manager.pause();
    play.mockRejectedValueOnce(new DOMException("Cannot resume", name));
    await manager.resume();
    const status = name === "NotAllowedError" ? "blocked" : "error";
    await expect(completion).resolves.toMatchObject({ status });
    expect(manager.state).toBe(status);
    expect(manager.isPlaying).toBe(false);
    expect(manager.currentLineId).toBeUndefined();
    expect([...audio.listeners.values()].every((listeners) => listeners.size === 0)).toBe(true);
  });

  it("reports buffering without resuming an intentional pause and stops paused voices", async () => {
    const audio = new FakeAudio();
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const completion = manager.playLine("line-1");
    await Promise.resolve();
    audio.emit("waiting");
    expect(manager.state).toBe("loading");
    audio.emit("playing");
    expect(manager.isPlaying).toBe(true);
    manager.pause();
    audio.emit("stalled");
    audio.emit("playing");
    expect(manager.state).toBe("paused");
    expect(audio.paused).toBe(true);
    manager.stop();
    await expect(completion).resolves.toMatchObject({ status: "stopped" });
    await manager.resume();
    expect(manager.state).toBe("idle");
  });

  it("keeps cache-source loading paused without settling and releases the Blob only after completion", async () => {
    vi.spyOn(cachedVoice, "canResolveCachedVoice").mockReturnValue(true);
    let resolveSource!: (source: { url: string; release: () => void }) => void;
    vi.spyOn(cachedVoice, "resolveCachedVoice").mockImplementation(() => new Promise(resolve => { resolveSource = resolve; }));
    const audio = new FakeAudio(), factory = vi.fn(() => audio), release = vi.fn(), settled = vi.fn();
    const manager = new AudioManager(testVoices, { factory });
    const completion = manager.playLine("line-1");
    void completion.then(settled);
    expect(manager.state).toBe("loading");
    expect(manager.currentLineId).toBe("line-1");
    manager.pause();
    resolveSource({ url: "blob:cached-line", release });
    await Promise.resolve();
    expect(factory).toHaveBeenCalledWith("blob:cached-line");
    expect(audio.paused).toBe(true);
    expect(manager.state).toBe("paused");
    expect(settled).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
    await manager.resume();
    expect(manager.state).toBe("playing");
    audio.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
    expect(release).toHaveBeenCalledTimes(1);
    manager.dispose();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("releases a stale cached source without creating audio or affecting the newer clip", async () => {
    vi.spyOn(cachedVoice, "canResolveCachedVoice").mockReturnValue(true);
    let resolveOld!: (source: { url: string; release: () => void }) => void;
    const oldRelease = vi.fn(), newRelease = vi.fn();
    vi.spyOn(cachedVoice, "resolveCachedVoice")
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ url: "blob:current", release: newRelease });
    const audio = new FakeAudio(), factory = vi.fn(() => audio);
    const manager = new AudioManager(testVoices, { factory });
    const first = manager.playLine("line-1"), second = manager.playLine("line-2");
    await expect(first).resolves.toMatchObject({ status: "stopped" });
    resolveOld({ url: "blob:stale", release: oldRelease });
    await Promise.resolve();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith("blob:current");
    expect(oldRelease).toHaveBeenCalledTimes(1);
    expect(manager.currentLineId).toBe("line-2");
    manager.stop();
    await expect(second).resolves.toMatchObject({ status: "stopped" });
    expect(newRelease).toHaveBeenCalledTimes(1);
  });

  it.each(["error", "dispose"])("releases cached audio on %s without leaking its completion", async terminal => {
    vi.spyOn(cachedVoice, "canResolveCachedVoice").mockReturnValue(true);
    const release = vi.fn(), audio = new FakeAudio(), fallback = new FakeAudio();
    vi.spyOn(cachedVoice, "resolveCachedVoice").mockResolvedValue({ url: "blob:cached", release });
    const manager = new AudioManager(testVoices, { factory: vi.fn().mockReturnValueOnce(audio).mockReturnValueOnce(fallback) });
    const completion = manager.playLine("line-1");
    await Promise.resolve();
    if (terminal === "error") { audio.emit("error"); fallback.emit("error"); } else manager.dispose();
    await expect(completion).resolves.toMatchObject({ status: terminal === "error" ? "error" : "stopped" });
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("retries a rejected Blob using the original URL once without replacing the completion", async () => {
    vi.spyOn(cachedVoice, "canResolveCachedVoice").mockReturnValue(true);
    const release = vi.fn(), blobAudio = new FakeAudio(), originalAudio = new FakeAudio();
    vi.spyOn(cachedVoice, "resolveCachedVoice").mockResolvedValue({ url: "blob:cached", release });
    vi.spyOn(blobAudio, "play").mockRejectedValue(new DOMException("Unsupported Blob", "NotSupportedError"));
    const factory = vi.fn().mockReturnValueOnce(blobAudio).mockReturnValueOnce(originalAudio);
    const manager = new AudioManager(testVoices, { factory });
    const completion = manager.playLine("line-1");
    await vi.waitFor(() => expect(manager.state).toBe("playing"));
    expect(factory).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenNthCalledWith(1, "blob:cached");
    expect(factory).toHaveBeenNthCalledWith(2, testVoices[0]!.url);
    expect(release).toHaveBeenCalledTimes(1);
    expect(blobAudio.paused).toBe(true);
    blobAudio.emit("ended"); blobAudio.emit("error");
    expect(manager.currentLineId).toBe("line-1");
    originalAudio.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("preserves intentional pause and ignores failed-element callbacks through source fallback", async () => {
    vi.spyOn(cachedVoice, "canResolveCachedVoice").mockReturnValue(true);
    const release = vi.fn(), first = new FakeAudio(), second = new FakeAudio();
    vi.spyOn(cachedVoice, "resolveCachedVoice").mockResolvedValue({ url: "blob:cached", release });
    const play = vi.spyOn(second, "play");
    const manager = new AudioManager(testVoices, { factory: vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second) });
    const completion = manager.playLine("line-1");
    await Promise.resolve();
    const queuedOldEnded = [...first.listeners.get("ended")!][0]!;
    manager.pause(); first.emit("error"); queuedOldEnded();
    expect(manager.state).toBe("paused");
    expect(play).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    await manager.resume();
    expect(play).toHaveBeenCalledTimes(1);
    second.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
  });

  it("does not retry a Blob autoplay restriction as a network request", async () => {
    vi.spyOn(cachedVoice, "canResolveCachedVoice").mockReturnValue(true);
    const release = vi.fn(), audio = new FakeAudio(), factory = vi.fn(() => audio);
    vi.spyOn(cachedVoice, "resolveCachedVoice").mockResolvedValue({ url: "blob:cached", release });
    vi.spyOn(audio, "play").mockRejectedValue(new DOMException("Gesture required", "NotAllowedError"));
    const manager = new AudioManager(testVoices, { factory });
    await expect(manager.playLine("line-1")).resolves.toMatchObject({ status: "blocked" });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });
});

describe("AudioManager playback clock", () => {
  it("keeps the clock playing through a stalled download without requiring another playing event", async () => {
    const audio = new FakeAudio(); audio.duration = 10;
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const completion = manager.playLine("line-1");
    audio.emit("stalled");
    expect(manager.snapshot.state).toBe("loading");
    await Promise.resolve();
    audio.emit("playing");
    audio.currentTime = 1; audio.emit("stalled");
    expect(manager.isPlaying).toBe(true);
    expect(manager.snapshot).toMatchObject({ state: "playing", currentTime: 1 });
    audio.currentTime = 1.6; audio.emit("timeupdate");
    expect(manager.snapshot).toMatchObject({ state: "playing", currentTime: 1.6 });
    audio.currentTime = 2;
    expect(manager.currentTime).toBe(2);
    expect(manager.state).toBe("playing");
    audio.emit("waiting");
    expect(manager.snapshot).toMatchObject({ state: "loading", currentTime: 2 });
    manager.stop();
    await expect(completion).resolves.toMatchObject({ status: "stopped" });
  });

  it("publishes stable metadata/time snapshots while exposing live time for animation frames", async () => {
    const audio = new FakeAudio();
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const observed = vi.fn();
    const unsubscribe = manager.subscribeSnapshot(observed);
    const empty = manager.snapshot;
    expect(observed).toHaveBeenCalledWith(empty);
    expect(manager.snapshot).toBe(empty);
    expect(Object.isFrozen(empty)).toBe(true);
    void manager.playLine("line-1");
    await Promise.resolve();
    expect(manager.snapshot).toMatchObject({ nodeId: "line-1", currentTime: 0, duration: undefined, state: "playing", ended: false });
    audio.duration = 9.5;
    audio.emit("loadedmetadata");
    expect(manager.duration).toBe(9.5);
    expect(manager.snapshot.duration).toBe(9.5);
    const beforeTick = manager.snapshot;
    audio.currentTime = 1.25;
    expect(manager.currentTime).toBe(1.25);
    expect(manager.snapshot).toBe(beforeTick);
    audio.emit("timeupdate");
    expect(manager.snapshot.currentTime).toBe(1.25);
    const tick = manager.snapshot, calls = observed.mock.calls.length;
    audio.emit("timeupdate"); audio.emit("durationchange");
    expect(manager.snapshot).toBe(tick);
    expect(observed).toHaveBeenCalledTimes(calls);
    unsubscribe();
    audio.currentTime = 2; audio.emit("timeupdate");
    expect(observed).toHaveBeenCalledTimes(calls);
    manager.dispose();
  });

  it("reports seeks while paused, retains final duration on end, and clears an idle terminal clock on stop", async () => {
    const audio = new FakeAudio(); audio.duration = 12;
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const completion = manager.playLine("line-1");
    await Promise.resolve();
    audio.currentTime = 7; manager.pause();
    expect(manager.snapshot).toMatchObject({ currentTime: 7, duration: 12, state: "paused", ended: false });
    audio.currentTime = 2; audio.emit("seeking"); audio.emit("seeked");
    expect(manager.snapshot).toMatchObject({ currentTime: 2, state: "paused" });
    await manager.resume();
    expect(manager.snapshot).toMatchObject({ currentTime: 2, state: "playing" });
    audio.currentTime = 11.9; audio.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
    expect(manager.currentLineId).toBeUndefined();
    expect(manager.snapshot).toMatchObject({ nodeId: "line-1", currentTime: 12, duration: 12, state: "idle", ended: true });
    expect(manager.currentTime).toBe(12);
    const ended = manager.snapshot;
    manager.stop();
    expect(manager.snapshot).not.toBe(ended);
    expect(manager.snapshot).toMatchObject({ nodeId: undefined, currentTime: 0, duration: undefined, ended: false, state: "idle" });
  });

  it("sanitizes unknown/non-finite media values and signals end even without duration metadata", async () => {
    const audio = new FakeAudio();
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const completion = manager.playLine("line-1");
    await Promise.resolve();
    audio.duration = Infinity; audio.currentTime = Number.NaN; audio.emit("durationchange");
    expect(manager.snapshot).toMatchObject({ currentTime: 0, duration: undefined });
    expect(manager.currentTime).toBe(0);
    audio.duration = 5; audio.currentTime = 8; audio.emit("timeupdate");
    expect(manager.snapshot.currentTime).toBe(5);
    audio.currentTime = -2; audio.emit("seeked");
    expect(manager.snapshot.currentTime).toBe(0);
    audio.duration = Number.NaN; audio.currentTime = 4.2; audio.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
    expect(manager.snapshot).toMatchObject({ currentTime: 4.2, duration: undefined, ended: true });
  });

  it("does not expose a deferred end as completed until explicit resume", async () => {
    const audio = new FakeAudio(); audio.duration = 8;
    const manager = new AudioManager(testVoices, { factory: () => audio });
    const completion = manager.playLine("line-1");
    await Promise.resolve();
    audio.currentTime = 7.8; manager.pause();
    audio.currentTime = 8; audio.emit("ended");
    expect(manager.snapshot).toMatchObject({ nodeId: "line-1", currentTime: 7.8, ended: false, state: "paused" });
    await manager.resume();
    await expect(completion).resolves.toMatchObject({ status: "ended" });
    expect(manager.snapshot).toMatchObject({ currentTime: 8, ended: true, state: "idle" });
  });

  it("changes playback identity for same-line replay and ignores old queued media events", async () => {
    const first = new FakeAudio(), second = new FakeAudio();
    const manager = new AudioManager(testVoices, { factory: vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second) });
    const firstCompletion = manager.playLine("line-1");
    await Promise.resolve();
    first.duration = 10; first.currentTime = 6; first.emit("timeupdate");
    const oldId = manager.snapshot.playbackId;
    const staleTick = [...first.listeners.get("timeupdate")!][0]!;
    const staleMetadata = [...first.listeners.get("loadedmetadata")!][0]!;
    const secondCompletion = manager.replay();
    await expect(firstCompletion).resolves.toMatchObject({ status: "stopped" });
    expect(manager.snapshot.playbackId).toBeGreaterThan(oldId);
    expect(manager.snapshot).toMatchObject({ nodeId: "line-1", currentTime: 0, duration: undefined, ended: false });
    const current = manager.snapshot;
    first.currentTime = 9; staleTick(); staleMetadata();
    expect(manager.snapshot).toBe(current);
    manager.stop();
    await expect(secondCompletion).resolves.toMatchObject({ status: "stopped" });
    staleTick(); expect(manager.snapshot.nodeId).toBeUndefined();
  });

  it("resets a failed cached-source clock without changing the playback identity or intentional pause", async () => {
    vi.spyOn(cachedVoice, "canResolveCachedVoice").mockReturnValue(true);
    const cached = new FakeAudio(), original = new FakeAudio(), release = vi.fn();
    vi.spyOn(cachedVoice, "resolveCachedVoice").mockResolvedValue({ url: "blob:cached", release });
    const manager = new AudioManager(testVoices, { factory: vi.fn().mockReturnValueOnce(cached).mockReturnValueOnce(original) });
    const snapshots: AudioPlaybackSnapshot[] = [];
    manager.subscribeSnapshot(value => snapshots.push(value));
    const completion = manager.playLine("line-1");
    expect(manager.snapshot).toMatchObject({ nodeId: "line-1", currentTime: 0, duration: undefined, state: "loading" });
    await Promise.resolve();
    cached.duration = 20; cached.currentTime = 4; cached.emit("timeupdate");
    manager.pause();
    const id = manager.snapshot.playbackId;
    const staleTick = [...cached.listeners.get("timeupdate")!][0]!;
    cached.emit("error");
    expect(release).toHaveBeenCalledTimes(1);
    expect(manager.snapshot).toMatchObject({ nodeId: "line-1", playbackId: id, currentTime: 0, duration: undefined, state: "paused", ended: false });
    expect(snapshots.some(snapshot => snapshot.playbackId === id && snapshot.state === "paused" && snapshot.currentTime === 0)).toBe(true);
    cached.currentTime = 19; staleTick();
    expect(manager.snapshot.currentTime).toBe(0);
    original.duration = 20; original.emit("loadedmetadata");
    expect(manager.snapshot.duration).toBe(20);
    await manager.resume();
    original.emit("ended");
    await expect(completion).resolves.toMatchObject({ status: "ended" });
  });

  it("allows synchronous snapshot subscribers to pause or stop loading before audio starts", async () => {
    const audio = new FakeAudio(), play = vi.spyOn(audio, "play"), factory = vi.fn(() => audio);
    const manager = new AudioManager(testVoices, { factory });
    const unsubscribe = manager.subscribeSnapshot(value => { if (value.state === "loading") manager.pause(); });
    const first = manager.playLine("line-1");
    expect(manager.snapshot.state).toBe("paused");
    expect(play).not.toHaveBeenCalled();
    unsubscribe(); manager.stop();
    await expect(first).resolves.toMatchObject({ status: "stopped" });
    factory.mockClear();
    manager.subscribeSnapshot(value => { if (value.state === "loading") manager.stop(); });
    await expect(manager.playLine("line-2")).resolves.toMatchObject({ status: "stopped" });
    expect(factory).not.toHaveBeenCalled();
    expect(manager.snapshot).toMatchObject({ nodeId: undefined, state: "idle" });
  });

  it("lets a newer request from an idle notification supersede an interrupted play request", async () => {
    const created: FakeAudio[] = [];
    const manager = new AudioManager(testVoices, { factory: () => { const audio = new FakeAudio(); created.push(audio); return audio; } });
    const first = manager.playLine("line-1");
    await Promise.resolve();
    let nested: Promise<unknown> | undefined;
    const unsubscribe = manager.subscribeSnapshot(value => {
      if (value.state === "idle" && value.nodeId === undefined && nested === undefined) nested = manager.playLine("line-2");
    });
    const interrupted = manager.playLine("line-1");
    await expect(first).resolves.toMatchObject({ status: "stopped" });
    await expect(interrupted).resolves.toMatchObject({ status: "stopped" });
    expect(created).toHaveLength(2);
    expect(created[0]?.paused).toBe(true);
    expect(manager.snapshot.nodeId).toBe("line-2");
    unsubscribe(); manager.stop();
    await expect(nested).resolves.toMatchObject({ status: "stopped" });
  });
});
