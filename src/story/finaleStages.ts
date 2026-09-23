import type { StageSnapshot } from "../engine/types";
import { umrahStages } from "./umrahStages";

type Sprite = StageSnapshot["sprites"][number];

const person = (
  assetId: string,
  characterId: string,
  position: Sprite["position"],
): Sprite => ({
  id: characterId,
  assetId,
  characterId,
  position,
  expression: assetId.slice(assetId.lastIndexOf("-") + 1),
  facing: position === "right" ? "left" : "right",
  layer: 1,
});

const aleem = (expression: string) => person(`aleem-umrah-${expression}`, "aleem-adult", "left");
const work = (expression: string) => person(`aleem-work-${expression}`, "aleem-adult", "left");
const nurul = (expression: string) => person(`nurulain-${expression}`, "nurulain", "right");

const scene = (
  backgroundId: string,
  mood: string,
  sprites: readonly Sprite[] = [],
  transition: StageSnapshot["transition"] = "dissolve",
): StageSnapshot => ({ backgroundId, sprites, transition, mood });

/** Every passage and reflective branch carries its complete, replayable stage. */
export const finaleStages = {
  introduction: umrahStages.introduction,
  firstMessage: scene("bg-adult-bedroom", "the small courage of sending the first message", [aleem("reflective")], "fade"),
  messages: scene("bg-adult-bedroom", "an uneven conversation finding another day", [aleem("neutral")]),
  invitation: scene("bg-adult-bedroom", "someone making room to meet him", [aleem("warm")]),
  yakiniku: scene("bg-yakiniku-date", "a first conversation across the grill", [aleem("neutral"), nurul("neutral")], "fade"),
  yakinikuCurious: scene("bg-yakiniku-date", "finding the person beyond her messages", [aleem("warm"), nurul("curious")]),
  yakinikuAmused: scene("bg-yakiniku-date", "the ease of hearing each other laugh", [aleem("warm"), nurul("amused")]),
  yakinikuWarm: scene("bg-yakiniku-date", "a small greeting that means a great deal", [aleem("warm"), nurul("warm")]),
  meetings: scene("bg-city-cafe", "making time for another conversation", [aleem("warm"), nurul("curious")], "fade"),
  distance: scene("bg-waterfront-night", "companionship with space still between them", [aleem("reflective"), nurul("guarded")]),
  question: scene("bg-adult-bedroom", "a question about where they are going", [aleem("reflective")], "fade"),
  herPerspective: scene("bg-city-cafe", "understanding later how his proposal first felt", [nurul("anxious")]),
  patience: scene("bg-adult-bedroom", "learning to leave room for her own pace", [aleem("resolved")]),
  departure: scene("bg-airport-departure", "a journey with a conversation still open", [aleem("neutral")], "fade"),
  kazakhstan: scene("bg-kazakhstan-stay", "curiosity crossing the distance between them", [aleem("warm")], "fade"),
  kazakhstanQuiet: scene("bg-kazakhstan-stay", "wanting to hear the rest of her day", [aleem("reflective")]),
  return: scene("bg-airport-departure", "coming home with something to look forward to", [aleem("resolved")], "fade"),
  parentsArrival: scene("bg-parents-restaurant", "a sincere beginning at a family table", [work("neutral"), nurul("anxious")], "fade"),
  parentsDinner: scene("cg-parents-meeting", "four people beginning to know one another", [], "dissolve"),
  parentsAfter: scene("bg-parents-restaurant", "his intention becoming easier for her to feel", [work("smile"), nurul("warm")]),
  pier: scene("bg-kallang-pier-sunset", "the following weekend beside the Kallang River", [aleem("warm"), nurul("neutral")], "fade"),
  pierListening: scene("bg-kallang-pier-sunset", "being heard without needing to hide the past", [aleem("reflective"), nurul("curious")]),
  pierMoved: scene("bg-kallang-pier-sunset", "surprise at how much he can finally share", [aleem("relieved"), nurul("moved")]),
  pierWarm: scene("bg-kallang-pier-sunset", "finding words for what has grown between them", [aleem("warm"), nurul("warm")]),
  confession: scene("cg-kallang-confession", "two people saying that they love each other", [], "dissolve"),
  planning: scene("cg-wedding-planning", "engaged, with a wedding still ahead", [], "fade"),
  together: scene("bg-city-cafe", "the ordinary work of choosing a life together", [aleem("warm"), nurul("amused")]),
  ending: scene("cg-wedding-planning", "a shared future still being written", [], "dissolve"),
} as const;
