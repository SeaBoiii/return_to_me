import type { StoryNode } from "../engine/types";
import { ending, line } from "./helpers";
import { finaleStages as stages } from "./finaleStages";

export const epilogueNodes = [
  line("epilogue-001", "epilogue", stages.planning, "adult-aleem",
    "We got engaged. Now we are preparing for our wedding, with things to arrange, decisions to make, and a future that keeps appearing inside ordinary conversations. I used to wonder whether anyone would want to plan a life with me. These days, I find myself discussing the next thing we need to do with Nurul.", "epilogue-002"),
  line("epilogue-002", "epilogue", stages.planning, "adult-aleem",
    "The wedding is still ahead of us. So is the marriage we hope to build. There are things we are still learning about each other, and moments when we have to slow down and explain ourselves better. I can be quiet when I need to speak. She can need time when I am ready with an answer.", "epilogue-003"),
  line("epilogue-003", "epilogue", stages.together, "adult-aleem",
    "But we can return to the conversation. I can ask about her day and stay curious about the answer. She can tell me when something feels too much. There is still that bright smile, and the warmth of a greeting I have learned to appreciate. I hope I never let those small things become invisible through familiarity.", "epilogue-004"),
  line("epilogue-004", "epilogue", stages.planning, "adult-aleem",
    "When I think of the boy at the beginning of this story, I feel tenderness for him. He wanted love so badly and had so much to learn about giving it. I am still learning. I wish I could let him sit with this ordinary happiness for a moment: being included in someone's plans, and making room for hers.", "epilogue-005"),
  line("epilogue-005", "epilogue", stages.ending, "adult-aleem",
    "This is where I will leave the telling, while we are engaged and getting ready for what comes next. Nurul and I have more life ahead than I can put on these pages. I am grateful we get to step towards it together, trusting Him with what we cannot see. And inshallah, it will be a happily ever after.", "epilogue-end"),
  ending("epilogue-end", "epilogue", stages.ending,
    "The End", "The story ends here. Our journey continues. Inshallah, a happily ever after."),
] as const satisfies readonly StoryNode[];
