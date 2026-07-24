import type {
  ChapterId,
  ChoiceId,
  EngineState,
  HistoryEntry,
  NodeId,
  SaveV1,
  StoryAction,
  StoryDefinition,
  StoryNode,
} from "./types";

type StoryReducer = (state: EngineState, action: StoryAction) => EngineState;

const appendUnique = <T extends string>(
  values: readonly T[],
  value: T,
): readonly T[] => (values.includes(value) ? values : [...values, value]);

const unique = <T extends string>(values: readonly T[]): readonly T[] => [
  ...new Set(values),
];

const nodeIndex = (story: StoryDefinition): ReadonlyMap<NodeId, StoryNode> =>
  new Map(story.nodes.map((node) => [node.id, node]));

const chapterOrder = (
  story: StoryDefinition,
  chapterIds: readonly ChapterId[],
): readonly ChapterId[] => {
  const wanted = new Set(chapterIds);
  return story.chapters
    .map((chapter) => chapter.id)
    .filter((chapterId) => wanted.has(chapterId));
};

const initialUnlockedChapters = (
  story: StoryDefinition,
): readonly ChapterId[] => {
  const startNode = nodeIndex(story).get(story.startNodeId);
  const firstChapter = story.chapters.at(0)?.id;
  const initial = startNode?.chapterId ?? firstChapter;
  return initial === undefined ? [] : [initial];
};

const enterNode = (
  story: StoryDefinition,
  state: EngineState,
  nodeId: NodeId,
): EngineState => {
  const node = nodeIndex(story).get(nodeId);
  if (node === undefined) {
    return state;
  }

  return {
    ...state,
    currentNodeId: nodeId,
    status: node.type === "end" ? "ended" : "playing",
    unlockedChapters: chapterOrder(
      story,
      appendUnique(state.unlockedChapters, node.chapterId),
    ),
  };
};

export const createInitialEngineState = (
  story: StoryDefinition,
): EngineState => ({
  status: "idle",
  currentNodeId: story.startNodeId,
  history: [],
  rememberedChoices: {},
  unlockedChapters: initialUnlockedChapters(story),
  seenNodeIds: [],
});

export const getCurrentNode = (
  story: StoryDefinition,
  state: EngineState,
): StoryNode | undefined =>
  story.nodes.find((node) => node.id === state.currentNodeId);

export const canAdvance = (
  story: StoryDefinition,
  state: EngineState,
): boolean =>
  state.status === "playing" &&
  getCurrentNode(story, state)?.type === "line";

export const getRememberedChoice = (
  state: EngineState,
  choiceNodeId: NodeId,
): ChoiceId | undefined => state.rememberedChoices[choiceNodeId];

export const isNodeSeen = (
  state: EngineState,
  nodeId: NodeId,
): boolean => state.seenNodeIds.includes(nodeId);

const restoreSave = (
  story: StoryDefinition,
  state: EngineState,
  save: SaveV1,
): EngineState => {
  if (
    save.storyId !== story.id ||
    save.storyRevision !== story.revision ||
    !nodeIndex(story).has(save.currentNodeId)
  ) {
    return state;
  }

  const knownNodes = new Set(story.nodes.map((node) => node.id));
  const knownChapters = new Set(
    story.chapters.map((chapter) => chapter.id),
  );
  const history = save.history.filter((entry) => knownNodes.has(entry.nodeId));
  const rememberedChoices = Object.fromEntries(
    Object.entries(save.rememberedChoices).filter(([nodeId]) =>
      knownNodes.has(nodeId),
    ),
  );
  const currentNode = nodeIndex(story).get(save.currentNodeId);
  const unlocked = save.unlockedChapters.filter((chapterId) =>
    knownChapters.has(chapterId),
  );

  if (currentNode !== undefined) {
    unlocked.push(currentNode.chapterId);
  }

  return {
    status: currentNode?.type === "end" ? "ended" : "playing",
    currentNodeId: save.currentNodeId,
    history,
    rememberedChoices,
    unlockedChapters: chapterOrder(story, unique(unlocked)),
    seenNodeIds: unique(
      save.seenNodeIds.filter((nodeId) => knownNodes.has(nodeId)),
    ),
  };
};

export const reduceStory = (
  story: StoryDefinition,
  state: EngineState,
  action: StoryAction,
): EngineState => {
  switch (action.type) {
    case "START_NEW": {
      const reset: EngineState = {
        status: "playing",
        currentNodeId: story.startNodeId,
        history: [],
        rememberedChoices: {},
        // Starting over does not erase previously earned chapter access.
        unlockedChapters: chapterOrder(
          story,
          unique([
            ...state.unlockedChapters,
            ...initialUnlockedChapters(story),
          ]),
        ),
        // Seen-text skip remains useful on a replay.
        seenNodeIds: state.seenNodeIds,
      };
      return enterNode(story, reset, story.startNodeId);
    }

    case "ADVANCE": {
      if (state.status !== "playing") {
        return state;
      }

      const node = getCurrentNode(story, state);
      if (node?.type !== "line") {
        return state;
      }

      const progressed: EngineState = {
        ...state,
        history: [
          ...state.history,
          { kind: "line", nodeId: node.id } satisfies HistoryEntry,
        ],
        seenNodeIds: appendUnique(state.seenNodeIds, node.id),
      };
      return enterNode(story, progressed, node.next);
    }

    case "CHOOSE": {
      if (state.status !== "playing") {
        return state;
      }

      const node = getCurrentNode(story, state);
      if (node?.type !== "choice") {
        return state;
      }

      const option = node.choices.find(
        (candidate) => candidate.id === action.optionId,
      );
      if (option === undefined) {
        return state;
      }

      const progressed: EngineState = {
        ...state,
        history: [
          ...state.history,
          {
            kind: "choice",
            nodeId: node.id,
            optionId: option.id,
          } satisfies HistoryEntry,
        ],
        rememberedChoices: {
          ...state.rememberedChoices,
          [node.id]: option.id,
        },
        seenNodeIds: appendUnique(state.seenNodeIds, node.id),
      };
      return enterNode(story, progressed, option.next);
    }

    case "JUMP_TO_CHAPTER": {
      if (!state.unlockedChapters.includes(action.chapterId)) {
        return state;
      }

      const chapter = story.chapters.find(
        (candidate) => candidate.id === action.chapterId,
      );
      if (chapter === undefined) {
        return state;
      }

      return enterNode(
        story,
        {
          ...state,
          status: "playing",
          history: [],
        },
        chapter.startNodeId,
      );
    }

    case "LOAD_SAVE":
      return restoreSave(story, state, action.save);

    case "RESET":
      return createInitialEngineState(story);

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
};

export const createStoryReducer =
  (story: StoryDefinition): StoryReducer =>
  (state, action) =>
    reduceStory(story, state, action);

export interface DialogueHistoryItem {
  readonly id: string;
  readonly kind: "line" | "choice";
  readonly speaker?: string;
  readonly text: string;
}

/**
 * Resolves compact persisted history into strings suitable for the history
 * dialog. Invalid entries are skipped so an old/corrupt record cannot crash UI.
 */
export const getDialogueHistory = (
  story: StoryDefinition,
  history: readonly HistoryEntry[],
): readonly DialogueHistoryItem[] => {
  const nodes = nodeIndex(story);
  const speakers = new Map(
    story.speakers.map((speaker) => [speaker.id, speaker.name]),
  );

  return history.flatMap((entry, index): readonly DialogueHistoryItem[] => {
    const node = nodes.get(entry.nodeId);
    if (entry.kind === "line" && node?.type === "line") {
      const speaker =
        node.speakerId === null ? undefined : speakers.get(node.speakerId);
      return [
        {
          id: `${entry.nodeId}:${index}`,
          kind: "line",
          ...(speaker === undefined ? {} : { speaker }),
          text: node.text,
        },
      ];
    }

    if (entry.kind === "choice" && node?.type === "choice") {
      const option = node.choices.find(
        (candidate) => candidate.id === entry.optionId,
      );
      return option === undefined
        ? []
        : [
            {
              id: `${entry.nodeId}:${entry.optionId}:${index}`,
              kind: "choice",
              text: option.label,
            },
          ];
    }

    return [];
  });
};
