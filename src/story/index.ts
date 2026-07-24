import type { StoryDefinition, StoryNode } from "../engine/types";
import { chapterOneNodes } from "./chapterOne";
import { chapterTwoNodes } from "./chapterTwo";
import { chapters, speakers, STORY_REVISION } from "./metadata";
import { epilogueNodes } from "./epilogue";
import { prologueNodes } from "./prologue";

export const storyNodes = [
  ...prologueNodes,
  ...chapterOneNodes,
  ...chapterTwoNodes,
  ...epilogueNodes,
] as const satisfies readonly StoryNode[];

export const story = {
  id: "return-to-me-school-years",
  title: "Return to Me",
  subtitle: "The School Years",
  revision: STORY_REVISION,
  startNodeId: "prologue-001",
  chapters,
  speakers,
  nodes: storyNodes,
} as const satisfies StoryDefinition;

export { chapters, speakers, STORY_REVISION } from "./metadata";
export {
  storyAssetIds,
  storyBackgroundIds,
  storySpriteAssetIds,
} from "./assets";
export { assertValidStory, validateStory } from "./validate";
export type { StoryValidationOptions } from "./validate";

