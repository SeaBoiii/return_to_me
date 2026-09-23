import type { StoryDefinition, StoryNode } from "../engine/types";
import { chapterOneNodes } from "./chapterOne";
import { chapterFiveNodes } from "./chapterFive";
import { nationalServiceNodes } from "./chapterNationalService";
import { universityArrivalNodes } from "./universityArrival";
import { chapterSixNodes } from "./chapterSix";
import { chapterSevenNodes } from "./chapterSeven";
import { chapterEightNodes } from "./chapterEight";
import { chapterNineNodes } from "./chapterNine";
import { chapterTenNodes } from "./chapterTen";
import { chapterElevenNodes } from "./chapterEleven";
import { chapterFourNodes } from "./chapterFour";
import { chapterThreeNodes } from "./chapterThree";
import { chapterTwoNodes } from "./chapterTwo";
import { chapters, speakers, STORY_REVISION } from "./metadata";
import { epilogueNodes } from "./epilogue";
import { prologueNodes } from "./prologue";

export const storyNodes = [
  ...prologueNodes,
  ...chapterOneNodes,
  ...chapterTwoNodes,
  ...chapterThreeNodes,
  ...chapterFourNodes,
  ...chapterFiveNodes,
  ...nationalServiceNodes,
  ...universityArrivalNodes,
  ...chapterSixNodes,
  ...chapterSevenNodes,
  ...chapterEightNodes,
  ...chapterNineNodes,
  ...chapterTenNodes,
  ...chapterElevenNodes,
  ...epilogueNodes,
] as const satisfies readonly StoryNode[];

export const story: StoryDefinition = {
  id: "return-to-me-school-years",
  title: "Return to Me",
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
