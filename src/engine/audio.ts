import type { NodeId, VoiceEntry, VoiceId } from "./types";

import { canResolveCachedVoice, resolveCachedVoice } from "../pwa/cachedVoice";

export type AudioEvent = "ended" | "error" | "playing" | "waiting" | "stalled";
export interface AudioElementLike {
  currentTime: number;
  volume: number;
  muted: boolean;
  preload: string;
  play(): void | Promise<void>;
  pause(): void;
  setAttribute?(name: string, value: string): void;
  addEventListener(type: AudioEvent, listener: () => void): void;
  removeEventListener(type: AudioEvent, listener: () => void): void;
}
export type AudioElementFactory = (url: string) => AudioElementLike;
export type AudioPlaybackStatus = "ended" | "stopped" | "missing" | "blocked" | "error";
export type AudioPlaybackState = "idle" | "loading" | "playing" | "paused" | "blocked" | "error";
export interface AudioPlaybackResult {
  readonly status: AudioPlaybackStatus;
  readonly lineId: NodeId;
  readonly voiceId?: VoiceId;
  readonly message?: string;
}
interface ActivePlayback {
  readonly entry: VoiceEntry;
  audio: AudioElementLike | undefined;
  sourceReady: Promise<void> | undefined;
  releaseSource: (() => void) | undefined;
  readonly settle: (result: AudioPlaybackResult) => void;
  readonly listeners: Readonly<Record<AudioEvent, () => void>>;
  attachedListeners: Readonly<Record<AudioEvent, () => void>> | undefined;
  paused: boolean;
  attempt: number;
  endedWhilePaused: boolean;
}
const defaultFactory: AudioElementFactory = (url) => {
  if (typeof Audio === "undefined") throw new Error("HTMLAudioElement is unavailable in this environment.");
  return new Audio(url);
};
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : "Voice playback failed.";
const isAutoplayBlock = (error: unknown): boolean => typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "NotAllowedError";
const clampVolume = (value: number): number => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 1));

/** One active voice. Pausing preserves both position and the completion promise. */
export class AudioManager {
  readonly #voicesByLine: ReadonlyMap<NodeId, VoiceEntry>;
  readonly #factory: AudioElementFactory;
  readonly #listeners = new Set<(state: AudioPlaybackState) => void>();
  #active: ActivePlayback | undefined;
  #lastEntry: VoiceEntry | undefined;
  #volume: number;
  #muted: boolean;
  #state: AudioPlaybackState = "idle";

  public constructor(voices: readonly VoiceEntry[], options: {
    readonly factory?: AudioElementFactory;
    readonly volume?: number;
    readonly muted?: boolean;
  } = {}) {
    this.#voicesByLine = new Map(voices.map((entry) => [entry.lineId, entry]));
    this.#factory = options.factory ?? defaultFactory;
    this.#volume = clampVolume(options.volume ?? 1);
    this.#muted = options.muted ?? false;
  }
  public get volume(): number { return this.#volume; }
  public get muted(): boolean { return this.#muted; }
  public get state(): AudioPlaybackState { return this.#state; }
  public get currentLineId(): NodeId | undefined { return this.#active?.entry.lineId; }
  public get isPlaying(): boolean { return this.#state === "playing"; }

  public subscribe(listener: (state: AudioPlaybackState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => { this.#listeners.delete(listener); };
  }
  public hasVoice(lineId: NodeId): boolean { return this.#voicesByLine.has(lineId); }
  public setVolume(volume: number): void {
    this.#volume = clampVolume(volume);
    if (this.#active?.audio !== undefined) this.#active.audio.volume = this.#volume;
  }
  public setMuted(muted: boolean): void {
    this.#muted = muted;
    if (this.#active?.audio !== undefined) this.#active.audio.muted = muted;
  }
  public playLine(lineId: NodeId): Promise<AudioPlaybackResult> {
    const entry = this.#voicesByLine.get(lineId);
    if (entry === undefined) {
      this.stop();
      return Promise.resolve({ status: "missing", lineId, message: "No voice clip is available for this line." });
    }
    return this.#playEntry(entry);
  }
  public replay(): Promise<AudioPlaybackResult> {
    return this.#lastEntry === undefined
      ? Promise.resolve({ status: "missing", lineId: "", message: "There is no previous voice clip to replay." })
      : this.#playEntry(this.#lastEntry);
  }
  public pause(): void {
    const active = this.#active;
    if (active === undefined || active.paused) return;
    active.paused = true;
    active.attempt += 1; // Invalidates a pending play promise, including its AbortError.
    active.audio?.pause();
    this.#setState("paused");
  }
  public async resume(): Promise<void> {
    const active = this.#active;
    if (active === undefined || !active.paused) return;
    active.paused = false;
    if (active.endedWhilePaused) {
      this.#finish(active, "ended");
      return;
    }
    if (active.audio === undefined) {
      this.#setState("loading");
      await active.sourceReady;
      return;
    }
    await this.#attemptPlay(active);
  }
  public stop(): void {
    const active = this.#active;
    if (active !== undefined) {
      active.attempt += 1;
      this.#active = undefined;
      this.#detach(active);
      try { if (active.audio) { active.audio.pause(); active.audio.currentTime = 0; } } catch { /* Detached audio can already be unavailable. */ }
      this.#release(active);
      active.settle({ status: "stopped", lineId: active.entry.lineId, voiceId: active.entry.id });
    }
    this.#setState("idle");
  }
  public dispose(): void {
    this.stop();
    this.#lastEntry = undefined;
    this.#listeners.clear();
  }
  #setState(state: AudioPlaybackState): void {
    if (this.#state === state) return;
    this.#state = state;
    this.#listeners.forEach((listener) => listener(state));
  }
  #finish(active: ActivePlayback, status: "ended" | "error" | "blocked", message?: string): void {
    if (this.#active !== active) return;
    this.#active = undefined;
    active.attempt += 1;
    this.#detach(active);
    if (status !== "ended") active.audio?.pause();
    this.#release(active);
    this.#setState(status === "ended" ? "idle" : status);
    active.settle({ status, lineId: active.entry.lineId, voiceId: active.entry.id, ...(message === undefined ? {} : { message }) });
  }
  async #fail(active: ActivePlayback, status: "error" | "blocked", message: string): Promise<void> {
    if (this.#active !== active) return;
    // Some native media stacks cannot decode an otherwise valid cached Blob.
    // Retry its original URL once; autoplay restrictions must remain explicit.
    if (status === "error" && active.releaseSource !== undefined) {
      active.attempt += 1;
      this.#detach(active);
      const previous = active.audio;
      active.audio = undefined;
      previous?.pause();
      this.#release(active);
      active.sourceReady = this.#prepare(active, { url: active.entry.url });
      await active.sourceReady;
    } else this.#finish(active, status, message);
  }
  async #attemptPlay(active: ActivePlayback): Promise<void> {
    const audio = active.audio;
    if (audio === undefined) return;
    const attempt = ++active.attempt;
    this.#setState("loading");
    if (this.#active !== active || active.paused || active.attempt !== attempt) return;
    try {
      await audio.play();
      if (this.#active !== active) { audio.pause(); return; }
      if (active.attempt !== attempt) return;
      if (active.paused) audio.pause();
      else this.#setState("playing");
    } catch (error) {
      if (this.#active !== active || active.attempt !== attempt || active.paused) return;
      await this.#fail(active, isAutoplayBlock(error) ? "blocked" : "error", errorMessage(error));
    }
  }
  #playEntry(entry: VoiceEntry): Promise<AudioPlaybackResult> {
    this.stop();
    this.#lastEntry = entry;
    let settle!: (result: AudioPlaybackResult) => void;
    const completion = new Promise<AudioPlaybackResult>((resolve) => { settle = resolve; });
    const active: ActivePlayback = {
      entry, audio: undefined, sourceReady: undefined, releaseSource: undefined, attachedListeners: undefined,
      settle, paused: false, attempt: 0, endedWhilePaused: false,
      listeners: {
        ended: () => {
          if (active.paused) active.endedWhilePaused = true;
          else this.#finish(active, "ended");
        },
        error: () => { void this.#fail(active, "error", "The voice clip could not be decoded or loaded."); },
        playing: () => {
          if (this.#active !== active) return;
          if (active.paused) active.audio?.pause();
          else this.#setState("playing");
        },
        waiting: () => { if (this.#active === active && !active.paused) this.#setState("loading"); },
        stalled: () => { if (this.#active === active && !active.paused) this.#setState("loading"); },
      },
    };
    this.#active = active;
    if (canResolveCachedVoice()) {
      this.#setState("loading");
      active.sourceReady = resolveCachedVoice(entry.url).then(source => this.#prepare(active, source));
    } else active.sourceReady = this.#prepare(active, { url: entry.url });
    return completion;
  }
  async #prepare(active: ActivePlayback, source: { url: string; release?: () => void }): Promise<void> {
    if (this.#active !== active) { source.release?.(); return; }
    active.releaseSource = source.release;
    try {
      const audio = this.#factory(source.url);
      active.audio = audio;
      audio.preload = "auto";
      audio.volume = this.#volume;
      audio.muted = this.#muted;
      audio.setAttribute?.("data-voice-url", active.entry.url);
      active.attachedListeners = Object.fromEntries(Object.entries(active.listeners).map(([event, listener]) =>
        [event, () => { if (active.audio === audio) listener(); }])) as Record<AudioEvent, () => void>;
      for (const [event, listener] of Object.entries(active.attachedListeners)) audio.addEventListener(event as AudioEvent, listener);
    } catch (error) {
      await this.#fail(active, "error", errorMessage(error));
      return;
    }
    if (active.paused) active.audio.pause();
    else await this.#attemptPlay(active);
  }
  #detach(active: ActivePlayback): void {
    for (const [event, listener] of Object.entries(active.attachedListeners ?? {})) active.audio?.removeEventListener(event as AudioEvent, listener);
    active.attachedListeners = undefined;
  }
  #release(active: ActivePlayback): void {
    active.releaseSource?.();
    active.releaseSource = undefined;
  }
}
