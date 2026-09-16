import type { StoryNode } from "../engine/types";
import { ending, line } from "./helpers";
import { umrahStages as stages } from "./umrahStages";

export const epilogueNodes = [
  line(
    "epilogue-001",
    "epilogue",
    stages.introduction,
    "mariam",
    "Aleem, there's someone I work with. A girl I know. I'd like to introduce you to her.",
    "epilogue-002",
  ),
  line(
    "epilogue-002",
    "epilogue",
    stages.introduction,
    "mariam",
    "Her name is Nurulain.",
    "epilogue-end",
  ),
  ending(
    "epilogue-end",
    "epilogue",
    stages.continuation,
    "To be continued",
    "Their story begins in the next chapter.",
  ),
] as const satisfies readonly StoryNode[];
