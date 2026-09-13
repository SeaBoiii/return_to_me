import type { StoryNode } from "../engine/types";
import { ending, line } from "./helpers";
import { adulthoodStages as stages } from "./adulthoodStages";

export const epilogueNodes = [
  line(
    "epilogue-001",
    "epilogue",
    stages.arrival,
    "adult-aleem",
    "For a moment, I stood still and let the fact of being here reach me. Nothing inside me had been neatly resolved. Yet I wanted to take the next step.",
    "epilogue-002",
  ),
  line(
    "epilogue-002",
    "epilogue",
    stages.continuation,
    "adult-aleem",
    "Imran shifted his bag and waited for me. I picked up mine. There was more ahead than I could see from the doorway.",
    "epilogue-end",
  ),
  ending(
    "epilogue-end",
    "epilogue",
    stages.continuation,
    "To be continued",
    "The journey in the holy land begins in the next chapter.",
  ),
] as const satisfies readonly StoryNode[];
