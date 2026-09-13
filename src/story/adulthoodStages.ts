import type { StageSnapshot } from "../engine/types";

type Sprite = StageSnapshot["sprites"][number];

const person = (
  assetId: string,
  characterId: string,
  position: Sprite["position"] = "left",
): Sprite => ({
  id: characterId,
  assetId,
  characterId,
  position,
  expression: assetId.slice(assetId.lastIndexOf("-") + 1),
  facing: position === "right" ? "left" : "right",
  layer: 1,
});

const scene = (
  backgroundId: string,
  mood: string,
  sprites: readonly Sprite[] = [],
  transition: StageSnapshot["transition"] = "dissolve",
): StageSnapshot => ({ backgroundId, sprites, transition, mood });

const uni = (expression: string) => person(`aleem-uni-${expression}`, "aleem-adult");
const work = (expression: string) => person(`aleem-work-${expression}`, "aleem-adult");
const travel = (expression: string) => person(`aleem-travel-${expression}`, "aleem-adult");
const jia = (expression: string) => person(`jia-wen-${expression}`, "jia-wen", "right");
const claire = (expression: string) => person(`claire-${expression}`, "claire", "right");
const imran = (expression: string) => person(`imran-${expression}`, "imran", "right");

/** Every node receives a complete snapshot, including restored choice branches. */
export const adulthoodStages = {
  orientation: scene("bg-uni-orientation", "a busy new beginning", [uni("neutral")], "fade"),
  orientationMeet: scene("bg-uni-orientation", "immediate, unexpected ease", [uni("smile"), jia("neutral")]),
  orientationTeasing: scene("bg-uni-orientation", "playful first impressions", [uni("amused"), jia("amused")], "none"),
  studyTogether: scene("bg-uni-study", "comfortable everyday company", [uni("neutral"), jia("smile")]),
  studyLaughing: scene("bg-uni-study", "a private joke in a public room", [uni("smile"), jia("amused")], "none"),
  studySilence: scene("bg-uni-study", "hope left unspoken", [uni("nervous"), jia("neutral")]),
  studyJealous: scene("bg-uni-study", "quiet possessiveness", [uni("jealous"), jia("neutral")]),
  studyQuestioned: scene("bg-uni-study", "an uncomfortable interruption", [uni("nervous"), jia("surprised")], "none"),
  dorm: scene("bg-uni-dorm", "the closeness of ordinary evenings", [uni("neutral"), jia("neutral")]),
  dormWarm: scene("bg-uni-dorm", "unguarded friendship", [uni("smile"), jia("smile")], "none"),
  dropoff: scene("bg-uni-dropoff", "reluctant goodbyes after a long day", [uni("smile"), jia("neutral")]),
  uniPlanning: scene("bg-adult-bedroom", "nervous anticipation", [uni("nervous")], "fade"),
  uniDiscovery: scene("bg-uni-study", "dread beneath a familiar routine", [uni("hurt")], "cut"),
  boyfriend: scene("cg-jia-wen-boyfriend", "the sudden end of a private certainty", [], "cut"),
  uniAlone: scene("bg-adult-bedroom", "hurt without an audience", [uni("hurt")], "fade"),
  ussArrival: scene("bg-uss-evening", "festive lights and hidden dread", [uni("nervous"), jia("smile")], "fade"),
  ussTogether: scene("bg-uss-evening", "one more afternoon of familiar laughter", [uni("amused"), jia("amused")]),
  ussQuiet: scene("bg-uss-evening", "the moment before honesty", [uni("nervous"), jia("neutral")]),
  confession: scene("cg-uss-confession", "long-delayed words beneath the lights", [], "dissolve"),
  ussQuestion: scene("bg-uss-evening", "an answer that opens another question", [uni("hurt"), jia("surprised")]),
  ussFarewell: scene("bg-uss-evening", "care and distance in the same goodbye", [uni("hurt"), jia("concerned")]),
  officeArrival: scene("bg-office-pantry", "an unfamiliar working routine", [work("neutral")], "fade"),
  officeTogether: scene("bg-office-pantry", "small kindnesses between tasks", [work("neutral"), claire("neutral")]),
  officeWarm: scene("bg-office-pantry", "easy company in the middle of a workday", [work("smile"), claire("smile")]),
  officeTeasing: scene("bg-office-pantry", "a joke that carries through the afternoon", [work("smile"), claire("amused")], "none"),
  cafeTogether: scene("bg-city-cafe", "friendship growing outside the office", [work("smile"), claire("smile")]),
  workPreparing: scene("bg-adult-bedroom", "trying to choose honesty", [work("nervous")], "fade"),
  valentine: scene("bg-waterfront-night", "a hopeful question asked plainly", [work("nervous"), claire("neutral")]),
  claireClear: scene("bg-waterfront-night", "a gentle, definite boundary", [work("hurt"), claire("firm")]),
  claireReflection: scene("bg-waterfront-night", "making room for a difficult answer", [work("hurt"), claire("reflective")]),
  cafeFriends: scene("bg-city-cafe", "company with an agreed name", [work("neutral"), claire("amused")]),
  waterfrontFriends: scene("bg-waterfront-night", "a beautiful evening and an old hope", [work("smile"), claire("reflective")]),
  claireNews: scene("bg-city-cafe", "the friendship finding a different shape", [work("hurt"), claire("reflective")]),
  workAlone: scene("bg-adult-bedroom", "exhaustion after everyone has gone home", [work("drained")], "fade"),
  journeyPrompt: scene("bg-adult-bedroom", "a quiet inward prompting", [travel("tired")], "fade"),
  journeyBooking: scene("bg-adult-bedroom", "a different reason to make plans", [travel("tentative"), imran("neutral")]),
  departure: scene("bg-airport-departure", "friendship at the beginning of a journey", [travel("tentative"), imran("encouraging")], "fade"),
  arrival: scene("bg-holy-land-arrival", "tentative hope on unfamiliar ground", [travel("hopeful"), imran("neutral")], "fade"),
  continuation: scene("bg-holy-land-arrival", "the journey has only just begun", [], "dissolve"),
} as const;
