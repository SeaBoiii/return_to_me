import type { NodeId, VoiceEntry, VoiceId } from "./types";

import { canResolveCachedVoice, resolveCachedVoice } from "../pwa/cachedVoice";

export type AudioEvent = "ended" | "error" | "playing" | "waiting" | "stalled"
  | "loadedmetadata" | "durationchange" | "timeupdate" | "seeking" | "seeked";
export interface AudioElementLike {
  currentTime: number;
  readonly duration?: number;
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
/** Times are seconds. Unknown/non-finite media duration is represented by undefined. */
export interface AudioPlaybackSnapshot {
  readonly nodeId: NodeId | undefined;
  readonly currentTime: number;
  readonly duration: number | undefined;
  readonly state: AudioPlaybackState;
  readonly ended: boolean;
  /** A new identity for each started play/replay, including the same story line. */
  readonly playbackId: number;
}
type AudioClock = Omit<AudioPlaybackSnapshot, "state">;
export interface AudioPlaybackResult {
  readonly status: AudioPlaybackStatus;
  readonly lineId: NodeId;
  readonly voiceId?: VoiceId;
  readonly message?: string;
}
interface ActivePlayback {
  readonly entry: VoiceEntry;
  readonly playbackId: number;
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
const mediaDuration = (value: number | undefined): number | undefined => value !== undefined && Number.isFinite(value) && value >= 0 ? value : undefined;
const mediaTime = (value: number | undefined, duration: number | undefined): number =>
  Math.min(duration ?? Infinity, value !== undefined && Number.isFinite(value) ? Math.max(0, value) : 0);

/** One active voice. Pausing preserves both position and the completion promise. */
export class AudioManager {
  readonly #voicesByLine: ReadonlyMap<NodeId, VoiceEntry>;
  readonly #factory: AudioElementFactory;
  readonly #listeners = new Set<(state: AudioPlaybackState) => void>();
  readonly #snapshotListeners = new Set<(snapshot: AudioPlaybackSnapshot) => void>();
  #active: ActivePlayback | undefined;
  #lastEntry: VoiceEntry | undefined;
  #volume: number;
  #muted: boolean;
  #state: AudioPlaybackState = "idle";
  #playbackId = 0;
  #requestId = 0;
  #snapshot: AudioPlaybackSnapshot = Object.freeze({
    nodeId: undefined, currentTime: 0, duration: undefined, state: "idle", ended: false, playbackId: 0,
  });

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
  /** Stable between notifications, suitable for an external-store snapshot getter. */
  public get snapshot(): AudioPlaybackSnapshot { return this.#snapshot; }
  /** Live media position for animation-frame sampling between native timeupdate events. */
  public get currentTime(): number {
    return this.#active ? mediaTime(this.#active.audio?.currentTime, this.duration) : this.#snapshot.currentTime;
  }
  public get duration(): number | undefined {
    return this.#active ? mediaDuration(this.#active.audio?.duration) : this.#snapshot.duration;
  }

  public subscribe(listener: (state: AudioPlaybackState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => { this.#listeners.delete(listener); };
  }
  public subscribeSnapshot(listener: (snapshot: AudioPlaybackSnapshot) => void): () => void {
    this.#snapshotListeners.add(listener);
    listener(this.#snapshot);
    return () => { this.#snapshotListeners.delete(listener); };
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
    this.#requestId += 1;
    this.#stopActive();
  }
  #stopActive(): void {
    const active = this.#active;
    if (active !== undefined) {
      active.attempt += 1;
      this.#active = undefined;
      this.#detach(active);
      try { if (active.audio) { active.audio.pause(); active.audio.currentTime = 0; } } catch { /* Detached audio can already be unavailable. */ }
      this.#release(active);
      active.settle({ status: "stopped", lineId: active.entry.lineId, voiceId: active.entry.id });
    }
    this.#setState("idle", { nodeId: undefined, currentTime: 0, duration: undefined, ended: false, playbackId: this.#playbackId });
  }
  public dispose(): void {
    this.#listeners.clear();
    this.#snapshotListeners.clear();
    this.stop();
    this.#lastEntry = undefined;
  }
  #clock(active: ActivePlayback, ended = false): AudioClock {
    const duration = mediaDuration(active.audio?.duration);
    return { nodeId: active.entry.lineId, playbackId: active.playbackId, duration, ended,
      currentTime: ended && duration !== undefined ? duration : mediaTime(active.audio?.currentTime, duration) };
  }
  #publishSnapshot(clock?: AudioClock): void {
    const next = { ...(clock ?? (this.#active ? this.#clock(this.#active) : this.#snapshot)), state: this.#state };
    const previous = this.#snapshot;
    if (next.nodeId === previous.nodeId && next.playbackId === previous.playbackId && next.currentTime === previous.currentTime
      && next.duration === previous.duration && next.state === previous.state && next.ended === previous.ended) return;
    const snapshot = Object.freeze(next);
    this.#snapshot = snapshot;
    for (const listener of [...this.#snapshotListeners]) {
      if (this.#snapshot !== snapshot) break; // A listener may synchronously replace or stop this playback.
      if (this.#snapshotListeners.has(listener)) listener(snapshot);
    }
  }
  #setState(state: AudioPlaybackState, clock?: AudioClock): void {
    const changed = this.#state !== state;
    this.#state = state;
    this.#publishSnapshot(clock);
    if (changed) for (const listener of [...this.#listeners]) {
      if (this.#state !== state) break;
      if (this.#listeners.has(listener)) listener(state);
    }
  }
  #finish(active: ActivePlayback, status: "ended" | "error" | "blocked", message?: string): void {
    if (this.#active !== active) return;
    const clock = this.#clock(active, status === "ended");
    this.#active = undefined;
    active.attempt += 1;
    this.#detach(active);
    if (status !== "ended") active.audio?.pause();
    this.#release(active);
    this.#setState(status === "ended" ? "idle" : status, clock);
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
      this.#setState(active.paused ? "paused" : "loading");
      if (this.#active !== active) return;
      active.sourceReady = this.#prepare(active, { url: active.entry.url });
      await active.sourceReady;
    } else this.#finish(active, status, message);
  }
  async #attemptPlay(active: ActivePlayback): Promise<void> {
    if (this.#active !== active) return;
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
    const requestId = ++this.#requestId;
    this.#stopActive();
    if (this.#requestId !== requestId) return Promise.resolve({ status: "stopped", lineId: entry.lineId, voiceId: entry.id });
    this.#lastEntry = entry;
    let settle!: (result: AudioPlaybackResult) => void;
    const completion = new Promise<AudioPlaybackResult>((resolve) => { settle = resolve; });
    const active: ActivePlayback = {
      entry, playbackId: ++this.#playbackId, audio: undefined, sourceReady: undefined, releaseSource: undefined, attachedListeners: undefined,
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
        // A stalled download can still have buffered audio playing. Only
        // waiting signals a playback interruption that should suspend the clock.
        stalled: () => this.#publishSnapshot(),
        loadedmetadata: () => this.#publishSnapshot(),
        durationchange: () => this.#publishSnapshot(),
        timeupdate: () => this.#publishSnapshot(),
        seeking: () => this.#publishSnapshot(),
        seeked: () => this.#publishSnapshot(),
      },
    };
    this.#active = active;
    this.#setState("loading");
    if (this.#active !== active) return completion;
    if (canResolveCachedVoice()) {
      active.sourceReady = resolveCachedVoice(entry.url).then(source => this.#prepare(active, source));
    } else active.sourceReady = this.#prepare(active, { url: entry.url });
    return completion;
  }
  async #prepare(active: ActivePlayback, source: { url: string; release?: () => void }): Promise<void> {
    if (this.#active !== active) { source.release?.(); return; }
    active.releaseSource = source.release;
    try {
      const audio = this.#factory(source.url);
      if (this.#active !== active) { audio.pause(); return; }
      active.audio = audio;
      audio.preload = "auto";
      audio.volume = this.#volume;
      audio.muted = this.#muted;
      audio.setAttribute?.("data-voice-url", active.entry.url);
      active.attachedListeners = Object.fromEntries(Object.entries(active.listeners).map(([event, listener]) =>
        [event, () => { if (this.#active === active && active.audio === audio) listener(); }])) as Record<AudioEvent, () => void>;
      for (const [event, listener] of Object.entries(active.attachedListeners)) audio.addEventListener(event as AudioEvent, listener);
    } catch (error) {
      await this.#fail(active, "error", errorMessage(error));
      return;
    }
    if (active.paused) { active.audio.pause(); this.#publishSnapshot(); }
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
