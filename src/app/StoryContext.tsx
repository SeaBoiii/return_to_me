import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  clearSave,
  createInitialEngineState,
  createStoryReducer,
  loadSave,
  loadSettings,
  saveEngineState,
  saveSettings,
  stateToSave,
  type EngineState,
  type LoadSaveResult,
  type SettingsV1,
  type StoryAction,
} from "../engine";
import { story } from "../story";

interface StoryContextValue {
  readonly state: EngineState;
  readonly settings: SettingsV1;
  readonly savedProgress: LoadSaveResult;
  readonly storageMessage?: string;
  readonly dispatch: Dispatch<StoryAction>;
  readonly startNew: () => void;
  readonly continueGame: () => boolean;
  readonly resetProgress: () => void;
  readonly updateSettings: (patch: Partial<Omit<SettingsV1, "version">>) => void;
}

const StoryContext = createContext<StoryContextValue | undefined>(undefined);

const initialSave = (): LoadSaveResult => loadSave(story);

export function StoryProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    createStoryReducer(story),
    story,
    createInitialEngineState,
  );
  const [savedProgress, setSavedProgress] =
    useState<LoadSaveResult>(initialSave);
  const settingsResult = useMemo(() => loadSettings(), []);
  const [settings, setSettings] = useState<SettingsV1>(
    settingsResult.settings,
  );
  const [storageMessage, setStorageMessage] = useState<string | undefined>(
    savedProgress.status === "corrupt" ||
      savedProgress.status === "incompatible" ||
      savedProgress.status === "unavailable"
      ? savedProgress.message
      : settingsResult.message,
  );

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }

    const result = saveEngineState(story, state);
    if (!result.ok) {
      queueMicrotask(() => setStorageMessage(result.message));
      return;
    }

    const save = stateToSave(story, state);
    if (save !== undefined) {
      queueMicrotask(() =>
        setSavedProgress({ status: "ok", save, migrated: false }),
      );
    }
  }, [state]);

  const startNew = useCallback(() => {
    if (savedProgress.status === "ok") {
      dispatch({ type: "LOAD_SAVE", save: savedProgress.save });
    }
    dispatch({ type: "START_NEW" });
  }, [savedProgress]);

  const continueGame = useCallback((): boolean => {
    if (savedProgress.status !== "ok") {
      return false;
    }
    dispatch({ type: "LOAD_SAVE", save: savedProgress.save });
    return true;
  }, [savedProgress]);

  const resetProgress = useCallback(() => {
    const result = clearSave();
    dispatch({ type: "RESET" });
    setSavedProgress({ status: "empty" });
    if (!result.ok) {
      queueMicrotask(() => setStorageMessage(result.message));
    }
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<Omit<SettingsV1, "version">>) => {
      setSettings((current) => {
        const next = { ...current, ...patch, version: 1 } as const;
        const result = saveSettings(next);
        if (!result.ok) {
          queueMicrotask(() => setStorageMessage(result.message));
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo<StoryContextValue>(
    () => ({
      state,
      settings,
      savedProgress,
      ...(storageMessage === undefined ? {} : { storageMessage }),
      dispatch,
      startNew,
      continueGame,
      resetProgress,
      updateSettings,
    }),
    [
      continueGame,
      resetProgress,
      savedProgress,
      settings,
      startNew,
      state,
      storageMessage,
      updateSettings,
    ],
  );

  return (
    <StoryContext.Provider value={value}>{children}</StoryContext.Provider>
  );
}

// The hook intentionally shares this module with its provider so both close
// over the same private context instance.
// eslint-disable-next-line react-refresh/only-export-components
export function useStory(): StoryContextValue {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error("useStory must be used inside StoryProvider.");
  }
  return context;
}

