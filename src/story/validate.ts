import type { StoryDefinition, StoryNode } from "../engine/types";
import { storyAssetIds } from "./assets";

export interface StoryValidationOptions {
  readonly voicedLineIds?: ReadonlySet<string>;
  readonly requireCompleteVoice?: boolean;
}

const outgoingIds = (node: StoryNode): readonly string[] => {
  if (node.type === "line") {
    return [node.next];
  }

  if (node.type === "choice") {
    return node.choices.map((option) => option.next);
  }

  return [];
};

export const validateStory = (
  definition: StoryDefinition,
  options: StoryValidationOptions = {},
): readonly string[] => {
  const errors: string[] = [];
  const nodeById = new Map<string, StoryNode>();
  const chapterIds = new Set(definition.chapters.map((chapter) => chapter.id));
  const speakerIds = new Set(definition.speakers.map((speaker) => speaker.id));
  const knownAssets = new Set<string>(storyAssetIds);

  for (const node of definition.nodes) {
    if (nodeById.has(node.id)) {
      errors.push(`Duplicate story node id: ${node.id}`);
      continue;
    }

    nodeById.set(node.id, node);

    if (!chapterIds.has(node.chapterId)) {
      errors.push(`${node.id} references unknown chapter: ${node.chapterId}`);
    }

    if (!node.stage.backgroundId) {
      errors.push(`${node.id} has no background asset`);
    } else if (!knownAssets.has(node.stage.backgroundId)) {
      errors.push(
        `${node.id} references unknown background asset: ${node.stage.backgroundId}`,
      );
    }

    if (!node.stage.mood.trim()) {
      errors.push(`${node.id} has no stage mood`);
    }

    for (const stageSprite of node.stage.sprites) {
      if (!knownAssets.has(stageSprite.assetId)) {
        errors.push(
          `${node.id} references unknown sprite asset: ${stageSprite.assetId}`,
        );
      }
    }

    if (
      node.type === "line" &&
      node.speakerId !== null &&
      !speakerIds.has(node.speakerId)
    ) {
      errors.push(`${node.id} references unknown speaker: ${node.speakerId}`);
    }

    if (
      node.type === "line" &&
      options.requireCompleteVoice &&
      node.speakerId !== null &&
      !options.voicedLineIds?.has(node.id)
    ) {
      errors.push(`${node.id} has no production voice entry`);
    }

    if (node.type === "choice") {
      const optionIds = new Set<string>();
      if (node.choices.length < 2) {
        errors.push(`${node.id} must offer at least two choices`);
      }

      for (const option of node.choices) {
        if (optionIds.has(option.id)) {
          errors.push(`${node.id} has duplicate choice id: ${option.id}`);
        }
        optionIds.add(option.id);
      }
    }
  }

  if (!nodeById.has(definition.startNodeId)) {
    errors.push(`Unknown story start node: ${definition.startNodeId}`);
  }

  for (const chapter of definition.chapters) {
    const chapterStart = nodeById.get(chapter.startNodeId);
    if (!chapterStart) {
      errors.push(
        `Chapter ${chapter.id} has unknown start node: ${chapter.startNodeId}`,
      );
    } else if (chapterStart.chapterId !== chapter.id) {
      errors.push(
        `Chapter ${chapter.id} starts in chapter ${chapterStart.chapterId}`,
      );
    }
  }

  for (const node of definition.nodes) {
    for (const targetId of outgoingIds(node)) {
      if (!nodeById.has(targetId)) {
        errors.push(`${node.id} links to unknown node: ${targetId}`);
      }
    }
  }

  const reachable = new Set<string>();
  const activePath = new Set<string>();
  const completed = new Set<string>();

  const visit = (nodeId: string): void => {
    if (activePath.has(nodeId)) {
      errors.push(`Illegal story cycle reaches node: ${nodeId}`);
      return;
    }
    if (completed.has(nodeId)) {
      reachable.add(nodeId);
      return;
    }

    const node = nodeById.get(nodeId);
    if (!node) {
      return;
    }

    reachable.add(nodeId);
    activePath.add(nodeId);
    for (const targetId of outgoingIds(node)) {
      visit(targetId);
    }
    activePath.delete(nodeId);
    completed.add(nodeId);
  };

  visit(definition.startNodeId);

  for (const node of definition.nodes) {
    if (!reachable.has(node.id)) {
      errors.push(`Unreachable story node: ${node.id}`);
    }
  }

  return errors;
};

export const assertValidStory = (
  definition: StoryDefinition,
  options?: StoryValidationOptions,
): void => {
  const errors = validateStory(definition, options);
  if (errors.length > 0) {
    throw new Error(`Story validation failed:\n- ${errors.join("\n- ")}`);
  }
};

