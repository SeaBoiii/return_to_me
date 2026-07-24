import type { NodeId, VoiceEntry, VoiceId } from "./types";

export interface AudioElementLike {
  currentTime: number;
  volume: number;
  muted: boolean;
  preload: string;
  play(): void | Promise<void>;
  pause(): void;
  addEventListener(type: "ended" | "error", listener: () => void): void;
  removeEventListener(type: "ended" | "error", listener: () => void): void;
}

export type AudioElementFactory = (url: string) => AudioElementLike;

export type AudioPlaybackStatus =
  | "ended"
  | "stopped"
  | "missing"
  | "blocked"
  | "error";

export interface AudioPlaybackResult {
  readonly status: AudioPlaybackStatus;
  readonly lineId: NodeId;
  readonly voiceId?: VoiceId;
  readonly message?: string;
}

interface ActivePlayback {
  readonly entry: VoiceEntry;
  readonly audio: AudioElementLike;
  readonly settle: (result: AudioPlaybackResult) => void;
  readonly onEnded: () => void;
  readonly onError: () => void;
}

const defaultFactory: AudioElementFactory = (url) => {
  if (typeof Audio === "undefined") {
    throw new Error("HTMLAudioElement is unavailable in this environment.");
  }
  const element = new Audio(url);
  return element;
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Voice playback failed.";

const isAutoplayBlock = (error: unknown): boolean =>
  typeof DOMException !== "undefined" &&
  error instanceof DOMException && error.name === "NotAllowedError";

const clampVolume = (value: number): number =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 1));

/**
 * A small imperative boundary around HTMLAudioElement. Story state stays pure;
 * the UI can await `playLine` for auto mode while manual navigation simply
 * calls `stop` before advancing.
 */
export class AudioManager {
  readonly #voicesByLine: ReadonlyMap<NodeId, VoiceEntry>;
  readonly #factory: AudioElementFactory;
  #active: ActivePlayback | undefined;
  #lastEntry: VoiceEntry | undefined;
  #volume: number;
  #muted: boolean;

  public constructor(
    voices: readonly VoiceEntry[],
    options: {
      readonly factory?: AudioElementFactory;
      readonly volume?: number;
      readonly muted?: boolean;
    } = {},
  ) {
    this.#voicesByLine = new Map(
      voices.map((entry) => [entry.lineId, entry]),
    );
    this.#factory = options.factory ?? defaultFactory;
    this.#volume = clampVolume(options.volume ?? 1);
    this.#muted = options.muted ?? false;
  }

  public get volume(): number {
    return this.#volume;
  }

  public get muted(): boolean {
    return this.#muted;
  }

  public get currentLineId(): NodeId | undefined {
    return this.#active?.entry.lineId;
  }

  public get isPlaying(): boolean {
    return this.#active !== undefined;
  }

  public hasVoice(lineId: NodeId): boolean {
    return this.#voicesByLine.has(lineId);
  }

  public setVolume(volume: number): void {
    this.#volume = clampVolume(volume);
    if (this.#active !== undefined) {
      this.#active.audio.volume = this.#volume;
    }
  }

  public setMuted(muted: boolean): void {
    this.#muted = muted;
    if (this.#active !== undefined) {
      this.#active.audio.muted = muted;
    }
  }

  public playLine(lineId: NodeId): Promise<AudioPlaybackResult> {
    const entry = this.#voicesByLine.get(lineId);
    if (entry === undefined) {
      this.stop();
      return Promise.resolve({
        status: "missing",
        lineId,
        message: "No voice clip is available for this line.",
      });
    }
    return this.#playEntry(entry);
  }

  public replay(): Promise<AudioPlaybackResult> {
    if (this.#lastEntry === undefined) {
      return Promise.resolve({
        status: "missing",
        lineId: "",
        message: "There is no previous voice clip to replay.",
      });
    }
    return this.#playEntry(this.#lastEntry);
  }

  public stop(): void {
    const active = this.#active;
    if (active === undefined) {
      return;
    }

    this.#active = undefined;
    this.#detach(active);
    try {
      active.audio.pause();
      active.audio.currentTime = 0;
    } catch {
      // A detached or partially constructed element is still safely stopped.
    }
    active.settle({
      status: "stopped",
      lineId: active.entry.lineId,
      voiceId: active.entry.id,
    });
  }

  public dispose(): void {
    this.stop();
    this.#lastEntry = undefined;
  }

  async #playEntry(entry: VoiceEntry): Promise<AudioPlaybackResult> {
    this.stop();
    this.#lastEntry = entry;

    let audio: AudioElementLike;
    try {
      audio = this.#factory(entry.url);
      audio.preload = "auto";
      audio.volume = this.#volume;
      audio.muted = this.#muted;
    } catch (error) {
      return {
        status: "error",
        lineId: entry.lineId,
        voiceId: entry.id,
        message: errorMessage(error),
      };
    }

    let settle!: (result: AudioPlaybackResult) => void;
    const completion = new Promise<AudioPlaybackResult>((resolve) => {
      settle = resolve;
    });

    const finish = (result: AudioPlaybackResult): void => {
      const active = this.#active;
      if (active?.audio !== audio) {
        return;
      }
      this.#active = undefined;
      this.#detach(active);
      active.settle(result);
    };
    const onEnded = (): void => {
      finish({
        status: "ended",
        lineId: entry.lineId,
        voiceId: entry.id,
      });
    };
    const onError = (): void => {
      finish({
        status: "error",
        lineId: entry.lineId,
        voiceId: entry.id,
        message: "The voice clip could not be decoded or loaded.",
      });
    };

    const active: ActivePlayback = {
      entry,
      audio,
      settle,
      onEnded,
      onError,
    };
    this.#active = active;
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    try {
      await audio.play();
    } catch (error) {
      finish({
        status: isAutoplayBlock(error) ? "blocked" : "error",
        lineId: entry.lineId,
        voiceId: entry.id,
        message: errorMessage(error),
      });
    }

    return completion;
  }

  #detach(active: ActivePlayback): void {
    active.audio.removeEventListener("ended", active.onEnded);
    active.audio.removeEventListener("error", active.onError);
  }
}
