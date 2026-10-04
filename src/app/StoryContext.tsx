import {
  createContext, type Dispatch, type PropsWithChildren, useCallback, useContext,
  useEffect, useMemo, useReducer, useState,
} from "react";
import {
  clearReplay, clearSave, createInitialEngineState, loadReplay, loadSave, loadSettings,
  saveEngineState, saveReplay, saveSettings,
  type EngineState, type LoadReplayResult, type LoadSaveResult, type SettingsV1, type StoryAction,
} from "../engine";
import { story } from "../story";
import { schoolYearsSaveMigrations } from "../story/saveMigrations";
import { createStorySessions, reduceStorySessions, type SessionAction } from "./storySessions";

interface StoryContextValue {
  readonly state: EngineState;
  readonly settings: SettingsV1;
  readonly savedProgress: LoadSaveResult;
  readonly replayProgress: LoadReplayResult;
  readonly sessionMode: "main" | "replay";
  readonly replayChapterId?: string;
  readonly replayComplete: boolean;
  readonly storageMessage?: string;
  readonly dispatch: Dispatch<StoryAction>;
  readonly startNew: () => void;
  readonly continueGame: () => boolean;
  readonly returnToMain: () => boolean;
  readonly startReplay: (chapterId: string) => boolean;
  readonly resumeReplay: () => boolean;
  readonly resetProgress: () => void;
  readonly updateSettings: (patch: Partial<Omit<SettingsV1, "version">>) => void;
}

const StoryContext = createContext<StoryContextValue | undefined>(undefined);
const initialise = () => {
  const main = loadSave(story, { migrations: schoolYearsSaveMigrations });
  const unlocked = main.status === "ok" ? main.save.unlockedChapters : createInitialEngineState(story).unlockedChapters;
  return createStorySessions(story, main, loadReplay(story, unlocked));
};
const sessionReducer = (state: ReturnType<typeof initialise>, action: SessionAction) => reduceStorySessions(story, state, action);

export function StoryProvider({ children }: PropsWithChildren) {
  const [sessions, sessionDispatch] = useReducer(sessionReducer, undefined, initialise);
  const settingsResult = useMemo(() => loadSettings(), []);
  const [settings, setSettings] = useState<SettingsV1>({ ...settingsResult.settings, autoMode: false, skipSeen: false });
  const [storageMessage, setStorageMessage] = useState<string | undefined>(() => {
    const progress = sessions.mainProgress;
    return "message" in progress ? progress.message : settingsResult.message;
  });

  const mainCommit = sessions.mainCommit;
  useEffect(() => {
    if (mainCommit === undefined) return;
    const result = saveEngineState(story, mainCommit, { now: () => mainCommit.timestamp });
    if (!result.ok) queueMicrotask(() => setStorageMessage(result.message));
  }, [mainCommit]);

  const replayCommit = sessions.replayCommit;
  useEffect(() => {
    if (replayCommit === undefined) return;
    const result = saveReplay(replayCommit);
    if (!result.ok) queueMicrotask(() => setStorageMessage(result.message));
  }, [replayCommit]);

  const resetPlaybackModes = useCallback(() => {
    setSettings((current) => current.autoMode || current.skipSeen ? { ...current, autoMode: false, skipSeen: false } : current);
  }, []);

  const startNew = useCallback(() => {
    resetPlaybackModes();
    sessionDispatch({ type: "new-main", now: Date.now() });
  }, [resetPlaybackModes]);

  const continueGame = useCallback(() => {
    if (sessions.mainProgress.status !== "ok") return false;
    resetPlaybackModes();
    sessionDispatch({ type: "continue-main" });
    return true;
  }, [sessions.mainProgress.status, resetPlaybackModes]);

  const startReplay = useCallback((chapterId: string) => {
    if (!sessions.main.unlockedChapters.includes(chapterId) || !story.chapters.some((chapter) => chapter.id === chapterId)) return false;
    resetPlaybackModes();
    sessionDispatch({ type: "start-replay", chapterId, now: Date.now() });
    return true;
  }, [sessions.main.unlockedChapters, resetPlaybackModes]);

  const resumeReplay = useCallback(() => {
    if (sessions.replay === undefined || sessions.replay.completed || !sessions.main.unlockedChapters.includes(sessions.replay.chapterId)) return false;
    resetPlaybackModes();
    sessionDispatch({ type: "resume-replay" });
    return true;
  }, [sessions.replay, sessions.main.unlockedChapters, resetPlaybackModes]);

  const resetProgress = useCallback(() => {
    const results = [clearSave(), clearReplay()];
    resetPlaybackModes();
    sessionDispatch({ type: "reset" });
    const failed = results.find((result) => !result.ok);
    setStorageMessage(failed !== undefined && !failed.ok ? failed.message : undefined);
  }, [resetPlaybackModes]);

  const dispatch = useCallback<Dispatch<StoryAction>>((action) => {
    if (action.type === "RESET") { resetProgress(); return; }
    if (action.type === "START_NEW" || action.type === "JUMP_TO_CHAPTER" || action.type === "LOAD_SAVE") resetPlaybackModes();
    sessionDispatch({ type: "story", action, now: Date.now() });
  }, [resetPlaybackModes, resetProgress]);

  const updateSettings = useCallback((patch: Partial<Omit<SettingsV1, "version">>) => {
    setSettings((current) => {
      const next = { ...current, ...patch, version: 1 } as const;
      const result = saveSettings(next);
      if (!result.ok) queueMicrotask(() => setStorageMessage(result.message));
      return next;
    });
  }, []);

  const value = useMemo<StoryContextValue>(() => ({
    state: sessions.mode === "replay" && sessions.replay !== undefined ? sessions.replay.state : sessions.main,
    settings,
    savedProgress: sessions.mainProgress,
    replayProgress: sessions.replayProgress,
    sessionMode: sessions.mode,
    ...(sessions.mode === "replay" && sessions.replay !== undefined ? { replayChapterId: sessions.replay.chapterId } : {}),
    replayComplete: sessions.mode === "replay" && sessions.replay?.completed === true,
    ...(storageMessage === undefined ? {} : { storageMessage }),
    dispatch, startNew, continueGame, returnToMain: continueGame,
    startReplay, resumeReplay, resetProgress, updateSettings,
  }), [sessions, settings, storageMessage, dispatch, startNew, continueGame, startReplay, resumeReplay, resetProgress, updateSettings]);

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

// Both exports must close over the same private context instance.
// eslint-disable-next-line react-refresh/only-export-components
export function useStory(): StoryContextValue {
  const context = useContext(StoryContext);
  if (context === undefined) throw new Error("useStory must be used inside StoryProvider.");
  return context;
}
