import type {
  SaveRevisionMigration,
  SaveRevisionMigrationRegistry,
  SaveV1,
} from "../engine";

export const SCHOOL_YEARS_V1_REVISION = "school-years-1.0.0";
export const SCHOOL_YEARS_V2_REVISION = "school-years-2.0.0";
export const SCHOOL_YEARS_V3_REVISION = "school-years-3.0.0";
export const BEFORE_NURUL_V3_REVISION = "before-nurul-3.0.0";
export const SCHOOL_YEARS_V4_REVISION = "school-years-4.0.0";
export const SCHOOL_YEARS_V5_REVISION = "school-years-5.0.0";
export const SCHOOL_YEARS_V6_REVISION = "school-years-6.0.0";

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

const hasNodeProgress = (
  save: SaveV1,
  matches: (nodeId: string) => boolean,
): boolean =>
  matches(save.currentNodeId) ||
  save.history.some((entry) => matches(entry.nodeId)) ||
  save.seenNodeIds.some(matches) ||
  Object.keys(save.rememberedChoices).some(matches);

/** The school-years ending now opens the first missing chapter: National Service. */
export const migrateSchoolYearsV2ToV4: SaveRevisionMigration = (save) => {
  if (save.storyRevision !== SCHOOL_YEARS_V2_REVISION) return undefined;

  const endingReached =
    save.unlockedChapters.includes("epilogue") ||
    hasNodeProgress(save, isOldEpilogueNode);
  const redirect = isOldEpilogueNode(save.currentNodeId);
  const unlockedChapters = save.unlockedChapters.filter((id) => id !== "epilogue");
  if (endingReached && !unlockedChapters.includes("chapter-ns")) {
    unlockedChapters.push("chapter-ns");
  }

  return {
    ...save,
    storyRevision: SCHOOL_YEARS_V4_REVISION,
    currentNodeId: redirect ? "ns-001" : save.currentNodeId,
    status: redirect ? "playing" : save.status,
    history: save.history.filter((entry) => !isOldEpilogueNode(entry.nodeId)),
    rememberedChoices: Object.fromEntries(
      Object.entries(save.rememberedChoices).filter(([id]) => !isOldEpilogueNode(id)),
    ),
    unlockedChapters,
    seenNodeIds: save.seenNodeIds.filter((id) => !isOldEpilogueNode(id)),
  };
};

/** Adulthood readers keep their exact position and gain access to the inserted chapter. */
export const migrateSchoolYearsV3ToV4: SaveRevisionMigration = (save) => {
  if (save.storyRevision !== SCHOOL_YEARS_V3_REVISION) return undefined;

  const adulthoodReached =
    save.unlockedChapters.some((id) =>
      ["chapter-6", "chapter-7", "chapter-8", "epilogue"].includes(id),
    ) || hasNodeProgress(save, (id) => /^(ch[678]-|epilogue-)/u.test(id));
  const unlockedChapters = [...save.unlockedChapters];
  if (adulthoodReached && !unlockedChapters.includes("chapter-ns")) {
    unlockedChapters.push("chapter-ns");
  }
  return { ...save, storyRevision: SCHOOL_YEARS_V4_REVISION, unlockedChapters };
};

const mapBeforeNurulNode = (nodeId: string): string => {
  if (nodeId.startsWith("ch6-")) return nodeId.replace(/^ch6-/u, "ns-");
  if (nodeId.startsWith("epilogue-")) {
    return nodeId.replace(/^epilogue-/u, "uni-arrival-");
  }
  return nodeId;
};

/** Namespace the other v3 edition's IDs without confusing its NS scenes with Almost Us. */
export const migrateBeforeNurulV3ToV4: SaveRevisionMigration = (save) => {
  if (save.storyRevision !== BEFORE_NURUL_V3_REVISION) return undefined;

  const completed = hasNodeProgress(save, (id) => id === "epilogue-end");
  const redirect = save.currentNodeId === "epilogue-end";
  const unlockedChapters = [...new Set(save.unlockedChapters.map((id) =>
    id === "chapter-6" || id === "epilogue" ? "chapter-ns" : id,
  ))];
  if (completed && !unlockedChapters.includes("chapter-6")) {
    unlockedChapters.push("chapter-6");
  }
  return {
    ...save,
    storyRevision: SCHOOL_YEARS_V4_REVISION,
    currentNodeId: redirect ? "ch6-001" : mapBeforeNurulNode(save.currentNodeId),
    status: redirect ? "playing" : save.status,
    history: save.history
      .filter((entry) => entry.nodeId !== "epilogue-end")
      .map((entry) => ({
        ...entry,
        nodeId: mapBeforeNurulNode(entry.nodeId),
      })),
    rememberedChoices: Object.fromEntries(
      Object.entries(save.rememberedChoices).map(([id, option]) => [mapBeforeNurulNode(id), option]),
    ),
    unlockedChapters,
    // The old card is now a new transition line; it must remain unread.
    seenNodeIds: save.seenNodeIds
      .filter((id) => id !== "epilogue-end")
      .map(mapBeforeNurulNode),
  };
};

/** Expand the arrival ending only after older editions have mapped their own endings. */
export const migrateSchoolYearsV4ToV5: SaveRevisionMigration = (save) => {
  if (save.storyRevision !== SCHOOL_YEARS_V4_REVISION) return undefined;

  const arrivalReached = save.unlockedChapters.includes("epilogue") ||
    hasNodeProgress(save, isOldEpilogueNode);
  const redirect = isOldEpilogueNode(save.currentNodeId);
  const unlockedChapters = save.unlockedChapters.filter((id) => id !== "epilogue");
  if (arrivalReached && !unlockedChapters.includes("chapter-9")) {
    unlockedChapters.push("chapter-9");
  }

  return {
    ...save,
    storyRevision: SCHOOL_YEARS_V5_REVISION,
    currentNodeId: redirect ? "ch9-001" : save.currentNodeId,
    status: redirect ? "playing" : save.status,
    history: save.history.filter((entry) => !isOldEpilogueNode(entry.nodeId)),
    rememberedChoices: Object.fromEntries(
      Object.entries(save.rememberedChoices).filter(([id]) => !isOldEpilogueNode(id)),
    ),
    unlockedChapters,
    seenNodeIds: save.seenNodeIds.filter((id) => !isOldEpilogueNode(id)),
  };
};

/** Replace the old name-reveal card with access to Aleem and Nurul's story. */
export const migrateSchoolYearsV5ToV6: SaveRevisionMigration = (save) => {
  if (save.storyRevision !== SCHOOL_YEARS_V5_REVISION) return undefined;

  const introductionReached = save.unlockedChapters.includes("epilogue") ||
    hasNodeProgress(save, isOldEpilogueNode);
  const redirect = isOldEpilogueNode(save.currentNodeId);
  const unlockedChapters = save.unlockedChapters.filter((id) => id !== "epilogue");
  if (introductionReached && !unlockedChapters.includes("chapter-11")) {
    unlockedChapters.push("chapter-11");
  }

  return {
    ...save,
    storyRevision: SCHOOL_YEARS_V6_REVISION,
    currentNodeId: redirect ? "ch11-001" : save.currentNodeId,
    status: redirect ? "playing" : save.status,
    history: save.history.filter((entry) => !isOldEpilogueNode(entry.nodeId)),
    rememberedChoices: Object.fromEntries(
      Object.entries(save.rememberedChoices).filter(([id]) => !isOldEpilogueNode(id)),
    ),
    unlockedChapters,
    seenNodeIds: save.seenNodeIds.filter((id) => !isOldEpilogueNode(id)),
  };
};

export const schoolYearsSaveMigrations = {
  [SCHOOL_YEARS_V1_REVISION]: migrateSchoolYearsV1ToV2,
  [SCHOOL_YEARS_V2_REVISION]: migrateSchoolYearsV2ToV4,
  [SCHOOL_YEARS_V3_REVISION]: migrateSchoolYearsV3ToV4,
  [BEFORE_NURUL_V3_REVISION]: migrateBeforeNurulV3ToV4,
  [SCHOOL_YEARS_V4_REVISION]: migrateSchoolYearsV4ToV5,
  [SCHOOL_YEARS_V5_REVISION]: migrateSchoolYearsV5ToV6,
} as const satisfies SaveRevisionMigrationRegistry;
