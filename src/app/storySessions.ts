import {
  createInitialEngineState, createReplaySession, reduceReplaySession, reduceStory,
  replayToSave, restoreReplaySession, stateToSave,
  type EngineState, type LoadReplayResult, type LoadSaveResult, type ReplaySaveV1,
  type ReplaySession, type SaveV1, type StoryAction, type StoryDefinition,
} from "../engine";

export interface StorySessions {
  readonly mode: "main" | "replay";
  readonly main: EngineState;
  readonly mainProgress: LoadSaveResult;
  readonly replay?: ReplaySession;
  readonly replayProgress: LoadReplayResult;
  /** Commit identities change only on progress, never on mode switches. */
  readonly mainCommit?: SaveV1;
  readonly replayCommit?: ReplaySaveV1;
}

export type SessionAction =
  | { readonly type: "story"; readonly action: StoryAction; readonly now: number }
  | { readonly type: "start-replay"; readonly chapterId: string; readonly now: number }
  | { readonly type: "resume-replay" }
  | { readonly type: "continue-main" }
  | { readonly type: "new-main"; readonly now: number }
  | { readonly type: "reset" };

export function createStorySessions(story: StoryDefinition, mainProgress: LoadSaveResult, replayProgress: LoadReplayResult): StorySessions {
  const initial = createInitialEngineState(story);
  return {
    mode: "main",
    main: mainProgress.status === "ok" ? reduceStory(story, initial, { type: "LOAD_SAVE", save: mainProgress.save }) : initial,
    mainProgress, replayProgress,
    ...(replayProgress.status === "ok" ? { replay: restoreReplaySession(story, replayProgress.replay) } : {}),
  };
}

const commitMain = (story: StoryDefinition, sessions: StorySessions, main: EngineState, now: number): StorySessions => {
  const save = stateToSave(story, main, now);
  return save === undefined ? sessions : {
    ...sessions, mode: "main", main,
    mainProgress: { status: "ok", save, migrated: false }, mainCommit: save,
  };
};

const commitReplay = (story: StoryDefinition, sessions: StorySessions, replay: ReplaySession, now: number): StorySessions => {
  const save = replayToSave(story, replay, now);
  return { ...sessions, mode: "replay", replay, replayProgress: { status: "ok", replay: save }, replayCommit: save };
};

export function reduceStorySessions(story: StoryDefinition, sessions: StorySessions, action: SessionAction): StorySessions {
  switch (action.type) {
    case "reset": return createStorySessions(story, { status: "empty" }, { status: "empty" });
    case "continue-main":
      if (sessions.mainProgress.status !== "ok") return sessions;
      // Accept a legacy migration on main Continue; ordinary navigation never
      // rewrites a current-revision bookmark or borrows replay progress.
      return sessions.mainProgress.migrated
        ? commitMain(story, sessions, sessions.main, sessions.mainProgress.save.timestamp)
        : { ...sessions, mode: "main" };
    case "resume-replay":
      return sessions.replay !== undefined && !sessions.replay.completed && sessions.main.unlockedChapters.includes(sessions.replay.chapterId)
        ? { ...sessions, mode: "replay" } : sessions;
    case "start-replay": {
      const replay = createReplaySession(story, sessions.main, action.chapterId);
      return replay === undefined ? sessions : commitReplay(story, sessions, replay, action.now);
    }
    case "new-main":
      return commitMain(story, sessions, reduceStory(story, sessions.main, { type: "START_NEW" }), action.now);
    case "story": {
      if (action.action.type === "RESET") return reduceStorySessions(story, sessions, { type: "reset" });
      if (action.action.type === "START_NEW") return reduceStorySessions(story, sessions, { type: "new-main", now: action.now });
      if (action.action.type === "JUMP_TO_CHAPTER") return reduceStorySessions(story, sessions, { type: "start-replay", chapterId: action.action.chapterId, now: action.now });
      if (sessions.mode === "replay") {
        if (sessions.replay === undefined) return sessions;
        const replay = reduceReplaySession(story, sessions.replay, action.action);
        return replay === sessions.replay ? sessions : commitReplay(story, sessions, replay, action.now);
      }
      const main = reduceStory(story, sessions.main, action.action);
      if (main === sessions.main) return sessions;
      // Loading is navigation, not progress: preserve stored bytes/timestamp.
      if (action.action.type === "LOAD_SAVE") return {
        ...sessions, main,
        mainProgress: { status: "ok", save: action.action.save, migrated: false },
      };
      return commitMain(story, sessions, main, action.now);
    }
  }
}
