import {
  DEFAULT_SETTINGS,
  type EngineState,
  type HistoryEntry,
  type SaveV1,
  type SettingsV1,
  type StoryDefinition,
} from "./types";

export const SAVE_STORAGE_KEY = "return-to-me:save:v1";
export const SETTINGS_STORAGE_KEY = "return-to-me:settings:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PersistenceOptions {
  readonly storage?: StorageLike;
  readonly key?: string;
  readonly now?: () => number;
}

export type LoadSaveResult =
  | { readonly status: "ok"; readonly save: SaveV1; readonly migrated: boolean }
  | { readonly status: "empty" }
  | { readonly status: "corrupt"; readonly message: string }
  | { readonly status: "incompatible"; readonly message: string }
  | { readonly status: "unavailable"; readonly message: string };

export type PersistenceWriteResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: "idle" | "unavailable";
      readonly message: string;
    };

export interface LoadSettingsResult {
  readonly settings: SettingsV1;
  readonly status: "ok" | "default" | "migrated" | "corrupt" | "unavailable";
  readonly message?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const browserStorage = (): StorageLike | undefined => {
  try {
    return typeof globalThis.localStorage === "undefined"
      ? undefined
      : globalThis.localStorage;
  } catch {
    return undefined;
  }
};

const resolveStorage = (
  explicitStorage: StorageLike | undefined,
): StorageLike | undefined => explicitStorage ?? browserStorage();

const decodeJson = (
  raw: string,
): { readonly ok: true; readonly value: unknown } | {
  readonly ok: false;
  readonly message: string;
} => {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, message: "Stored data is not valid JSON." };
  }
};

const parseHistory = (value: unknown): readonly HistoryEntry[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const parsed: HistoryEntry[] = [];
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      typeof entry.nodeId !== "string" ||
      (entry.kind !== "line" && entry.kind !== "choice")
    ) {
      return undefined;
    }

    if (entry.kind === "line") {
      parsed.push({ kind: "line", nodeId: entry.nodeId });
      continue;
    }

    if (typeof entry.optionId !== "string") {
      return undefined;
    }
    parsed.push({
      kind: "choice",
      nodeId: entry.nodeId,
      optionId: entry.optionId,
    });
  }
  return parsed;
};

const parseChoiceRecord = (
  value: unknown,
): Readonly<Record<string, string>> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value);
  return entries.every(
    ([nodeId, optionId]) =>
      nodeId.length > 0 && typeof optionId === "string" && optionId.length > 0,
  )
    ? Object.fromEntries(entries) as Readonly<Record<string, string>>
    : undefined;
};

interface ParsedSave {
  readonly save: SaveV1;
  readonly migrated: boolean;
}

/**
 * Version zero was used by early prototypes. It stored line history as node
 * IDs and called remembered choices `choices`. Keeping this migration narrow
 * avoids silently accepting arbitrary malformed objects.
 */
const migrateSaveV0 = (
  value: Record<string, unknown>,
  story: StoryDefinition,
): SaveV1 | undefined => {
  if (
    value.version !== 0 ||
    typeof value.currentNodeId !== "string" ||
    !isStringArray(value.history) ||
    !isStringArray(value.unlockedChapters)
  ) {
    return undefined;
  }

  const choices = parseChoiceRecord(value.choices);
  if (choices === undefined) {
    return undefined;
  }

  const seenNodeIds = isStringArray(value.seenNodeIds)
    ? value.seenNodeIds
    : value.history;
  const timestamp =
    typeof value.timestamp === "number" && Number.isFinite(value.timestamp)
      ? value.timestamp
      : Date.now();

  return {
    version: 1,
    storyId:
      typeof value.storyId === "string" ? value.storyId : story.id,
    storyRevision:
      typeof value.storyRevision === "string"
        ? value.storyRevision
        : story.revision,
    currentNodeId: value.currentNodeId,
    status: value.status === "ended" ? "ended" : "playing",
    history: value.history.map((nodeId) => ({ kind: "line", nodeId })),
    rememberedChoices: choices,
    unlockedChapters: value.unlockedChapters,
    seenNodeIds,
    timestamp,
  };
};

const parseSaveShape = (
  value: unknown,
  story: StoryDefinition,
): ParsedSave | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.version === 0) {
    const migrated = migrateSaveV0(value, story);
    return migrated === undefined ? undefined : { save: migrated, migrated: true };
  }

  if (
    value.version !== 1 ||
    typeof value.storyId !== "string" ||
    typeof value.storyRevision !== "string" ||
    typeof value.currentNodeId !== "string" ||
    (value.status !== "playing" && value.status !== "ended") ||
    !isStringArray(value.unlockedChapters) ||
    !isStringArray(value.seenNodeIds) ||
    typeof value.timestamp !== "number" ||
    !Number.isFinite(value.timestamp)
  ) {
    return undefined;
  }

  const history = parseHistory(value.history);
  const rememberedChoices = parseChoiceRecord(value.rememberedChoices);
  if (history === undefined || rememberedChoices === undefined) {
    return undefined;
  }

  return {
    migrated: false,
    save: {
      version: 1,
      storyId: value.storyId,
      storyRevision: value.storyRevision,
      currentNodeId: value.currentNodeId,
      status: value.status,
      history,
      rememberedChoices,
      unlockedChapters: value.unlockedChapters,
      seenNodeIds: value.seenNodeIds,
      timestamp: value.timestamp,
    },
  };
};

const validateSaveReferences = (
  save: SaveV1,
  story: StoryDefinition,
): string | undefined => {
  const nodes = new Map(story.nodes.map((node) => [node.id, node]));
  const chapters = new Set(story.chapters.map((chapter) => chapter.id));
  const currentNode = nodes.get(save.currentNodeId);

  if (currentNode === undefined) {
    return `Save points to unknown node "${save.currentNodeId}".`;
  }

  if (save.status === "ended" && currentNode.type !== "end") {
    return "Save status does not match its current story node.";
  }

  if (save.unlockedChapters.some((id) => !chapters.has(id))) {
    return "Save contains an unknown chapter.";
  }

  if (save.seenNodeIds.some((id) => !nodes.has(id))) {
    return "Save contains an unknown seen node.";
  }

  for (const entry of save.history) {
    const node = nodes.get(entry.nodeId);
    if (
      (entry.kind === "line" && node?.type !== "line") ||
      (entry.kind === "choice" &&
        (node?.type !== "choice" ||
          !node.choices.some((option) => option.id === entry.optionId)))
    ) {
      return "Save contains invalid dialogue history.";
    }
  }

  for (const [nodeId, optionId] of Object.entries(save.rememberedChoices)) {
    const node = nodes.get(nodeId);
    if (
      node?.type !== "choice" ||
      !node.choices.some((option) => option.id === optionId)
    ) {
      return "Save contains an invalid remembered choice.";
    }
  }

  return undefined;
};

export const parseSave = (
  raw: string,
  story: StoryDefinition,
): LoadSaveResult => {
  const decoded = decodeJson(raw);
  if (!decoded.ok) {
    return { status: "corrupt", message: decoded.message };
  }

  const parsed = parseSaveShape(decoded.value, story);
  if (parsed === undefined) {
    return {
      status: "corrupt",
      message: "Stored progress has an unrecognised or invalid shape.",
    };
  }

  if (
    parsed.save.storyId !== story.id ||
    parsed.save.storyRevision !== story.revision
  ) {
    return {
      status: "incompatible",
      message:
        "Stored progress belongs to a different story revision and was not loaded.",
    };
  }

  const referenceError = validateSaveReferences(parsed.save, story);
  return referenceError === undefined
    ? { status: "ok", save: parsed.save, migrated: parsed.migrated }
    : { status: "corrupt", message: referenceError };
};

export const loadSave = (
  story: StoryDefinition,
  options: PersistenceOptions = {},
): LoadSaveResult => {
  const storage = resolveStorage(options.storage);
  if (storage === undefined) {
    return {
      status: "unavailable",
      message: "Browser storage is not available.",
    };
  }

  try {
    const raw = storage.getItem(options.key ?? SAVE_STORAGE_KEY);
    return raw === null ? { status: "empty" } : parseSave(raw, story);
  } catch {
    return {
      status: "unavailable",
      message: "Browser storage could not be read.",
    };
  }
};

export const stateToSave = (
  story: StoryDefinition,
  state: EngineState,
  timestamp = Date.now(),
): SaveV1 | undefined => {
  if (state.status === "idle") {
    return undefined;
  }

  return {
    version: 1,
    storyId: story.id,
    storyRevision: story.revision,
    currentNodeId: state.currentNodeId,
    status: state.status,
    history: state.history,
    rememberedChoices: state.rememberedChoices,
    unlockedChapters: state.unlockedChapters,
    seenNodeIds: state.seenNodeIds,
    timestamp,
  };
};

export const saveEngineState = (
  story: StoryDefinition,
  state: EngineState,
  options: PersistenceOptions = {},
): PersistenceWriteResult => {
  const save = stateToSave(
    story,
    state,
    (options.now ?? Date.now)(),
  );
  if (save === undefined) {
    return {
      ok: false,
      reason: "idle",
      message: "Progress is not saved before a game has started.",
    };
  }

  const storage = resolveStorage(options.storage);
  if (storage === undefined) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Browser storage is not available.",
    };
  }

  try {
    storage.setItem(options.key ?? SAVE_STORAGE_KEY, JSON.stringify(save));
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "unavailable",
      message: "Progress could not be written to browser storage.",
    };
  }
};

export const clearSave = (
  options: PersistenceOptions = {},
): PersistenceWriteResult => {
  const storage = resolveStorage(options.storage);
  if (storage === undefined) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Browser storage is not available.",
    };
  }

  try {
    storage.removeItem(options.key ?? SAVE_STORAGE_KEY);
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "unavailable",
      message: "Progress could not be removed from browser storage.",
    };
  }
};

const legacyTextSpeed = (value: unknown): number | undefined => {
  switch (value) {
    case "instant":
      return 0;
    case "fast":
      return 12;
    case "normal":
      return DEFAULT_SETTINGS.textSpeedMs;
    case "slow":
      return 42;
    default:
      return undefined;
  }
};

const sanitiseSettings = (
  value: Record<string, unknown>,
): SettingsV1 | undefined => {
  if (
    typeof value.textSpeedMs !== "number" ||
    !Number.isFinite(value.textSpeedMs) ||
    value.textSpeedMs < 0 ||
    value.textSpeedMs > 200 ||
    typeof value.autoMode !== "boolean" ||
    typeof value.skipSeen !== "boolean" ||
    typeof value.volume !== "number" ||
    !Number.isFinite(value.volume) ||
    value.volume < 0 ||
    value.volume > 1 ||
    typeof value.muted !== "boolean" ||
    typeof value.reducedMotion !== "boolean"
  ) {
    return undefined;
  }

  return {
    version: 1,
    textSpeedMs: value.textSpeedMs,
    autoMode: value.autoMode,
    skipSeen: value.skipSeen,
    volume: value.volume,
    muted: value.muted,
    reducedMotion: value.reducedMotion,
  };
};

const parseSettings = (
  raw: string,
): { readonly settings: SettingsV1; readonly migrated: boolean } | undefined => {
  const decoded = decodeJson(raw);
  if (!decoded.ok || !isRecord(decoded.value)) {
    return undefined;
  }

  if (decoded.value.version === 1) {
    const settings = sanitiseSettings(decoded.value);
    return settings === undefined ? undefined : { settings, migrated: false };
  }

  if (decoded.value.version !== 0) {
    return undefined;
  }

  const speed = legacyTextSpeed(decoded.value.textSpeed);
  const candidate: Record<string, unknown> = {
    textSpeedMs: speed ?? DEFAULT_SETTINGS.textSpeedMs,
    autoMode:
      typeof decoded.value.auto === "boolean"
        ? decoded.value.auto
        : DEFAULT_SETTINGS.autoMode,
    skipSeen:
      typeof decoded.value.skip === "boolean"
        ? decoded.value.skip
        : DEFAULT_SETTINGS.skipSeen,
    volume: decoded.value.volume ?? DEFAULT_SETTINGS.volume,
    muted: decoded.value.muted ?? DEFAULT_SETTINGS.muted,
    reducedMotion:
      decoded.value.reducedMotion ?? DEFAULT_SETTINGS.reducedMotion,
  };
  const settings = sanitiseSettings(candidate);
  return settings === undefined ? undefined : { settings, migrated: true };
};

export const loadSettings = (
  options: PersistenceOptions = {},
): LoadSettingsResult => {
  const storage = resolveStorage(options.storage);
  if (storage === undefined) {
    return {
      settings: DEFAULT_SETTINGS,
      status: "unavailable",
      message: "Browser storage is not available.",
    };
  }

  try {
    const raw = storage.getItem(options.key ?? SETTINGS_STORAGE_KEY);
    if (raw === null) {
      return { settings: DEFAULT_SETTINGS, status: "default" };
    }
    const parsed = parseSettings(raw);
    return parsed === undefined
      ? {
          settings: DEFAULT_SETTINGS,
          status: "corrupt",
          message: "Stored settings were invalid, so defaults were restored.",
        }
      : {
          settings: parsed.settings,
          status: parsed.migrated ? "migrated" : "ok",
        };
  } catch {
    return {
      settings: DEFAULT_SETTINGS,
      status: "unavailable",
      message: "Browser settings could not be read.",
    };
  }
};

export const saveSettings = (
  settings: SettingsV1,
  options: PersistenceOptions = {},
): PersistenceWriteResult => {
  const storage = resolveStorage(options.storage);
  if (storage === undefined) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Browser storage is not available.",
    };
  }

  const sanitised = sanitiseSettings(settings as unknown as Record<string, unknown>);
  if (sanitised === undefined) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Settings were outside their supported ranges.",
    };
  }

  try {
    storage.setItem(
      options.key ?? SETTINGS_STORAGE_KEY,
      JSON.stringify(sanitised),
    );
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "unavailable",
      message: "Settings could not be written to browser storage.",
    };
  }
};
