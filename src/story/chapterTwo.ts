import type { StoryNode } from "../engine/types";
import { chapterTwoANodes } from "./chapterTwoA";
import { chapterTwoBNodes } from "./chapterTwoB";

export const chapterTwoNodes = [
  ...chapterTwoANodes,
  ...chapterTwoBNodes,
] as const satisfies readonly StoryNode[];

