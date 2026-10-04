import {
  parseSave,
  stateToSave,
  type PersistenceOptions,
  type PersistenceWriteResult,
  type StorageLike,
} from "./persistence";
import { createInitialEngineState, getCurrentNode, reduceStory } from "./reducer";
import type { EngineState, SaveV1, StoryAction, StoryDefinition } from "./types";

export const REPLAY_STORAGE_KEY = "return-to-me:replay:v1";

export interface ReplaySession {
  readonly chapterId: string;
  readonly completed: boolean;
  readonly state: EngineState;
}

/** Replay metadata wraps an unchanged SaveV1; the main save format stays intact. */
export interface ReplaySaveV1 {
  readonly version: 1;
  readonly chapterId: string;
  readonly completed: boolean;
  readonly save: SaveV1;
}

export type LoadReplayResult =
  | { readonly status: "ok"; readonly replay: ReplaySaveV1 }
  | { readonly status: "empty" }
  | { readonly status: "corrupt" | "incompatible" | "unavailable"; readonly message: string };

export function createReplaySession(
  story: StoryDefinition,
  main: EngineState,
  chapterId: string,
): ReplaySession | undefined {
  const chapter = story.chapters.find((candidate) => candidate.id === chapterId);
  if (chapter === undefined || !main.unlockedChapters.includes(chapterId)) return;
  const node = story.nodes.find((candidate) => candidate.id === chapter.startNodeId);
  if (node === undefined) return;
  return {
    chapterId,
    completed: node.type === "end",
    state: {
      status: node.type === "end" ? "ended" : "playing",
      currentNodeId: node.id,
      history: [],
      rememberedChoices: {},
      unlockedChapters: [...main.unlockedChapters],
      seenNodeIds: [...main.seenNodeIds],
    },
  };
}

/** Records the final action but keeps the replay on its own side of a boundary. */
export function reduceReplaySession(
  story: StoryDefinition,
  replay: ReplaySession,
  action: StoryAction,
): ReplaySession {
  if (replay.completed || (action.type !== "ADVANCE" && action.type !== "CHOOSE")) return replay;
  const next = reduceStory(story, replay.state, action);
  if (next === replay.state) return replay;
  const node = getCurrentNode(story, next);
  const crossedBoundary = node?.chapterId !== replay.chapterId;
  return {
    ...replay,
    completed: crossedBoundary || node?.type === "end",
    state: {
      ...next,
      currentNodeId: crossedBoundary ? replay.state.currentNodeId : next.currentNodeId,
      status: crossedBoundary ? "playing" : next.status,
      unlockedChapters: replay.state.unlockedChapters,
    },
  };
}

export function replayToSave(
  story: StoryDefinition,
  replay: ReplaySession,
  timestamp = Date.now(),
): ReplaySaveV1 {
  const save = stateToSave(story, replay.state, timestamp);
  if (save === undefined) throw new Error("An idle session cannot be a replay.");
  return { version: 1, chapterId: replay.chapterId, completed: replay.completed, save };
}

export function restoreReplaySession(story: StoryDefinition, replay: ReplaySaveV1): ReplaySession {
  return {
    chapterId: replay.chapterId,
    completed: replay.completed,
    state: reduceStory(story, createInitialEngineState(story), { type: "LOAD_SAVE", save: replay.save }),
  };
}

const storageFor = (options: PersistenceOptions): StorageLike | undefined => {
  try { return options.storage ?? globalThis.localStorage; } catch { return undefined; }
};

export function parseReplay(
  raw: string,
  story: StoryDefinition,
  unlockedChapters: readonly string[],
): LoadReplayResult {
  const invalid = (): LoadReplayResult => ({ status: "corrupt", message: "The saved chapter replay could not be restored. Your main story is unchanged." });
  let value: unknown;
  try { value = JSON.parse(raw) as unknown; } catch { return invalid(); }
  if (value === null || typeof value !== "object") return invalid();
  const envelope = value as Record<string, unknown>;
  if (envelope.version !== 1 || typeof envelope.chapterId !== "string" || typeof envelope.completed !== "boolean") return invalid();
  // Replays cannot borrow the main story's migrations or grant chapter access.
  const parsed = parseSave(JSON.stringify(envelope.save), story);
  if (parsed.status !== "ok") return {
    status: parsed.status === "incompatible" ? "incompatible" : "corrupt",
    message: "The saved chapter replay is no longer available. Your main story is unchanged.",
  };
  if (!unlockedChapters.includes(envelope.chapterId)) return {
    status: "incompatible", message: "This replay chapter is not unlocked in the main story.",
  };
  const nodes = new Map(story.nodes.map((node) => [node.id, node]));
  const node = nodes.get(parsed.save.currentNodeId);
  if (node?.chapterId !== envelope.chapterId ||
    parsed.save.history.some((entry) => nodes.get(entry.nodeId)?.chapterId !== envelope.chapterId) ||
    Object.keys(parsed.save.rememberedChoices).some((id) => nodes.get(id)?.chapterId !== envelope.chapterId) ||
    parsed.save.unlockedChapters.some((id) => !unlockedChapters.includes(id))) return invalid();
  const last = parsed.save.history.at(-1);
  const nextId = node.type === "line" ? node.next : node.type === "choice" && last?.kind === "choice"
    ? node.choices.find((choice) => choice.id === last.optionId)?.next : undefined;
  const completed = node.type === "end" || (last?.nodeId === node.id &&
    nextId !== undefined && nodes.get(nextId)?.chapterId !== envelope.chapterId);
  if (envelope.completed !== completed) return invalid();
  return { status: "ok", replay: { version: 1, chapterId: envelope.chapterId, completed, save: parsed.save } };
}

export function loadReplay(
  story: StoryDefinition,
  unlockedChapters: readonly string[],
  options: PersistenceOptions = {},
): LoadReplayResult {
  try {
    const storage = storageFor(options);
    if (storage === undefined) throw new Error("Storage unavailable");
    const raw = storage.getItem(options.key ?? REPLAY_STORAGE_KEY);
    return raw === null ? { status: "empty" } : parseReplay(raw, story, unlockedChapters);
  } catch {
    return { status: "unavailable", message: "The chapter replay could not be read from browser storage." };
  }
}

export function saveReplay(replay: ReplaySaveV1, options: PersistenceOptions = {}): PersistenceWriteResult {
  try {
    const storage = storageFor(options);
    if (storage === undefined) throw new Error("Storage unavailable");
    storage.setItem(options.key ?? REPLAY_STORAGE_KEY, JSON.stringify(replay));
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable", message: "The chapter replay could not be saved. Your main story is unchanged." };
  }
}

export function clearReplay(options: PersistenceOptions = {}): PersistenceWriteResult {
  try {
    const storage = storageFor(options);
    if (storage === undefined) throw new Error("Storage unavailable");
    storage.removeItem(options.key ?? REPLAY_STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable", message: "The chapter replay could not be removed from browser storage." };
  }
}
