import { describe, expect, it } from "vitest";

import {
  AudioManager,
  type AudioElementFactory,
  type AudioElementLike,
} from "./audio";
import { testVoices } from "./testFixtures";

class FakeAudio implements AudioElementLike {
  currentTime = 0;
  volume = 1;
  muted = false;
  preload = "";
  paused = false;
  readonly listeners = new Map<"ended" | "error", Set<() => void>>();

  play(): Promise<void> {
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  addEventListener(type: "ended" | "error", listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: "ended" | "error", listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: "ended" | "error"): void {
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
});
