import { afterEach, describe, expect, it, vi } from "vitest";
import * as cachedVoice from "../pwa/cachedVoice";

import {
  AudioManager,
  type AudioElementFactory,
  type AudioElementLike,
  type AudioEvent,
} from "./audio";
import { testVoices } from "./testFixtures";

afterEach(() => vi.restoreAllMocks());

class FakeAudio implements AudioElementLike {
  currentTime = 0;
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
