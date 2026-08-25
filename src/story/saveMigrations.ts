import type {
  SaveRevisionMigration,
  SaveRevisionMigrationRegistry,
  SaveV1,
} from "../engine";

export const SCHOOL_YEARS_V1_REVISION = "school-years-1.0.0";
export const SCHOOL_YEARS_V2_REVISION = "school-years-2.0.0";

const OLD_EPILOGUE_CHAPTER_ID = "epilogue";
const CHAPTER_THREE_ID = "chapter-3";
const CHAPTER_THREE_START_NODE_ID = "ch3-001";

const isOldEpilogueNode = (nodeId: string): boolean =>
  nodeId.startsWith("epilogue-");

/**
 * Expands a finished or in-progress School Years v1 save into the JC-years
 * edition. Earlier replay positions stay where the player left them, while
 * obsolete epilogue progress is replaced by access to Chapter 3.
 */
export const migrateSchoolYearsV1ToV2: SaveRevisionMigration = (
  save,
): SaveV1 | undefined => {
  if (save.storyRevision !== SCHOOL_YEARS_V1_REVISION) {
    return undefined;
  }

  const oldEpilogueReached =
    save.currentNodeId === "epilogue-end" ||
    isOldEpilogueNode(save.currentNodeId) ||
    save.unlockedChapters.includes(OLD_EPILOGUE_CHAPTER_ID) ||
    save.history.some((entry) => isOldEpilogueNode(entry.nodeId)) ||
    save.seenNodeIds.some(isOldEpilogueNode) ||
    Object.keys(save.rememberedChoices).some(isOldEpilogueNode);
  const redirectToChapterThree = isOldEpilogueNode(save.currentNodeId);

  const unlockedChapters = save.unlockedChapters.filter(
    (chapterId) => chapterId !== OLD_EPILOGUE_CHAPTER_ID,
  );
  if (
    oldEpilogueReached &&
    !unlockedChapters.includes(CHAPTER_THREE_ID)
  ) {
    unlockedChapters.push(CHAPTER_THREE_ID);
  }

  return {
    ...save,
    storyRevision: SCHOOL_YEARS_V2_REVISION,
    currentNodeId: redirectToChapterThree
      ? CHAPTER_THREE_START_NODE_ID
      : save.currentNodeId,
    status: redirectToChapterThree ? "playing" : save.status,
    history: save.history.filter(
      (entry) => !isOldEpilogueNode(entry.nodeId),
    ),
    rememberedChoices: Object.fromEntries(
      Object.entries(save.rememberedChoices).filter(
        ([nodeId]) => !isOldEpilogueNode(nodeId),
      ),
    ),
    unlockedChapters,
    seenNodeIds: save.seenNodeIds.filter(
      (nodeId) => !isOldEpilogueNode(nodeId),
    ),
  };
};

export const schoolYearsSaveMigrations = {
  [SCHOOL_YEARS_V1_REVISION]: migrateSchoolYearsV1ToV2,
} as const satisfies SaveRevisionMigrationRegistry;
