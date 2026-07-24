import type { StageSnapshot } from "../engine/types";

type Sprite = StageSnapshot["sprites"][number];
type Overlay = NonNullable<StageSnapshot["overlay"]>;

const sprite = (
  id: string,
  assetId: string,
  characterId: string,
  position: Sprite["position"],
  expression: string,
  facing: NonNullable<Sprite["facing"]> = "right",
  layer = 1,
): Sprite => ({
  id,
  assetId,
  characterId,
  position,
  expression,
  facing,
  layer,
});

const snapshot = (
  backgroundId: string,
  sprites: readonly Sprite[],
  mood: string,
  transition: StageSnapshot["transition"] = "dissolve",
  overlay?: Overlay,
): StageSnapshot => ({
  backgroundId,
  sprites,
  transition,
  mood,
  ...(overlay ? { overlay } : {}),
});

export const stages = {
  prologue: snapshot("bg-dawn-window", [], "quiet, reflective dawn", "fade"),

  primaryClassroom: snapshot(
    "bg-primary-classroom",
    [
      sprite("aleem", "aleem-p6-neutral", "aleem-p6", "left", "neutral"),
      sprite("alya", "alya-neutral", "alya", "right", "neutral", "left"),
    ],
    "warm primary-school nostalgia",
  ),
  primaryClassroomHappy: snapshot(
    "bg-primary-classroom",
    [
      sprite("aleem", "aleem-p6-smile", "aleem-p6", "left", "smile"),
      sprite("alya", "alya-smile", "alya", "right", "smile", "left"),
    ],
    "bright and playful",
    "none",
  ),
  primaryClassroomPlayful: snapshot(
    "bg-primary-classroom",
    [
      sprite("aleem", "aleem-p6-surprised", "aleem-p6", "left", "surprised"),
      sprite("alya", "alya-playful", "alya", "right", "playful", "left"),
    ],
    "awkward young affection",
    "none",
  ),
  primaryCorridorAleem: snapshot(
    "bg-primary-corridor",
    [sprite("aleem", "aleem-p6-reflective", "aleem-p6", "center", "reflective")],
    "sunlit anticipation",
  ),
  primaryCorridorTogether: snapshot(
    "bg-primary-corridor",
    [
      sprite("aleem", "aleem-p6-smile", "aleem-p6", "left", "smile"),
      sprite("alya", "alya-smile", "alya", "right", "smile", "left"),
    ],
    "gentle first love",
    "none",
  ),
  graduation: snapshot(
    "bg-graduation-gate",
    [
      sprite("aleem", "aleem-p6-reflective", "aleem-p6", "left", "reflective"),
      sprite("alya", "alya-neutral", "alya", "right", "neutral", "left"),
    ],
    "golden, bittersweet farewell",
    "fade",
  ),
  graduationSmile: snapshot(
    "bg-graduation-gate",
    [
      sprite("aleem", "aleem-p6-smile", "aleem-p6", "left", "smile"),
      sprite("alya", "alya-smile", "alya", "right", "smile", "left"),
    ],
    "hopeful farewell",
    "none",
  ),
  busStop: snapshot("bg-bus-stop", [], "two lives beginning to diverge", "fade"),
  bedroom2009: snapshot(
    "bg-bedroom-2009",
    [sprite("aleem", "aleem-p6-reflective", "aleem-p6", "center", "reflective")],
    "cool evening phone light",
  ),
  bedroom2009Smile: snapshot(
    "bg-bedroom-2009",
    [sprite("aleem", "aleem-p6-smile", "aleem-p6", "center", "smile")],
    "small comforts across distance",
    "none",
  ),
  wrongMessage: snapshot(
    "cg-wrong-message",
    [],
    "shock in cold phone light",
    "cut",
    {
      kind: "sms",
      label: "SMS conversation",
      title: "Alya",
      lines: [
        "Do you think he likes me?",
        "How should I talk to him without making it obvious?",
      ],
    },
  ),
  wrongMessageQuestion: snapshot(
    "cg-wrong-message",
    [],
    "hurt and disbelief",
    "none",
    {
      kind: "sms",
      label: "SMS conversation",
      title: "Alya",
      lines: [
        "Do you think he likes me?",
        "How should I talk to him without making it obvious?",
      ],
    },
  ),
  alyaApology: snapshot(
    "bg-bedroom-2009",
    [sprite("alya", "alya-startled", "alya", "right", "startled", "left")],
    "sudden realization",
    "cut",
    {
      kind: "sms",
      label: "SMS conversation",
      title: "Alya",
      lines: ["Wait—Aleem?", "I sent that to the wrong person.", "I am so sorry."],
    },
  ),
  alyaApologetic: snapshot(
    "bg-bedroom-2009",
    [sprite("alya", "alya-apologetic", "alya", "right", "apologetic", "left")],
    "remorse without easy answers",
    "none",
  ),
  primaryHurt: snapshot(
    "bg-bedroom-2009",
    [sprite("aleem", "aleem-p6-hurt", "aleem-p6", "center", "hurt")],
    "quiet first heartbreak",
    "fade",
  ),

  boysClassroom: snapshot(
    "bg-boys-classroom",
    [sprite("aleem", "aleem-sec-neutral", "aleem-sec", "center", "neutral")],
    "plain secondary-school routine",
    "fade",
  ),
  languageEstablishing: snapshot("bg-language-classroom", [], "bright unfamiliar possibility", "fade"),
  languageAleem: snapshot(
    "bg-language-classroom",
    [sprite("aleem", "aleem-sec-nervous", "aleem-sec", "left", "nervous")],
    "self-conscious curiosity",
  ),
  languageHana: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-neutral", "aleem-sec", "left", "neutral"),
      sprite("hana", "hana-curious", "hana", "right", "curious", "left"),
    ],
    "new attention across a classroom",
    "none",
  ),
  languageSmile: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-smile", "aleem-sec", "left", "smile"),
      sprite("hana", "hana-smile", "hana", "right", "smile", "left"),
    ],
    "easy conversation",
    "none",
  ),
  courtyardFaris: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-nervous", "aleem-sec", "left", "nervous"),
      sprite("faris", "faris-encouraging", "faris", "right", "encouraging", "left"),
    ],
    "conspiratorial after-class energy",
    "fade",
  ),
  courtyardFarisConfident: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-confused", "aleem-sec", "left", "confused"),
      sprite("faris", "faris-confident", "faris", "right", "confident", "left"),
    ],
    "a wingman with a plan",
    "none",
  ),
  courtyardHana: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-nervous", "aleem-sec", "left", "nervous"),
      sprite("hana", "hana-shy", "hana", "right", "shy", "left"),
    ],
    "tentative mutual affection",
    "dissolve",
  ),
  courtyardHappy: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-smile", "aleem-sec", "left", "smile"),
      sprite("hana", "hana-smile", "hana", "right", "smile", "left"),
    ],
    "young happiness in afternoon light",
    "none",
  ),
  bedroomPcDay: snapshot(
    "bg-bedroom-pc-day",
    [sprite("aleem", "aleem-home-focused", "aleem-home", "center", "focused")],
    "creative focus and possibility",
    "fade",
  ),
  serverProud: snapshot(
    "bg-bedroom-pc-day",
    [sprite("aleem", "aleem-home-proud", "aleem-home", "right", "proud", "left", 2)],
    "earned pride, electric momentum",
    "none",
    {
      kind: "server",
      label: "Block-inspired server dashboard",
      title: "Server online",
      lines: ["Players are joining", "The community is growing", "Support received"],
    },
  ),
  bedroomPcNight: snapshot(
    "bg-bedroom-pc-night",
    [sprite("aleem", "aleem-home-focused", "aleem-home", "center", "focused")],
    "late-night electric blue",
    "fade",
  ),
  serverCrisis: snapshot(
    "cg-server-night",
    [],
    "urgent digital noise",
    "cut",
    {
      kind: "server",
      label: "Block-inspired server alerts",
      title: "Administrator queue",
      lines: ["Connection unstable", "Players need help", "New reports waiting"],
    },
  ),
  hanaConcerned: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-guilty", "aleem-sec", "left", "guilty"),
      sprite("hana", "hana-disappointed", "hana", "right", "disappointed", "left"),
    ],
    "distance entering the conversation",
    "fade",
  ),
  hanaDistant: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-confused", "aleem-sec", "left", "confused"),
      sprite("hana", "hana-distant", "hana", "right", "distant", "left"),
    ],
    "words arriving too late",
    "dissolve",
  ),
  mutualFriend: snapshot(
    "bg-language-courtyard",
    [sprite("aleem", "aleem-sec-confused", "aleem-sec", "center", "confused")],
    "unwelcome news after class",
    "cut",
    {
      kind: "caption",
      label: "A message from a mutual friend",
      title: "Mutual friend",
      lines: ["I thought you should hear it from someone.", "Hana has moved on."],
    },
  ),
  mutualFriendHurt: snapshot(
    "bg-language-courtyard",
    [sprite("aleem", "aleem-sec-devastated", "aleem-sec", "center", "devastated")],
    "shock beneath an ordinary afternoon",
    "none",
  ),
  aloneGuilty: snapshot(
    "bg-bedroom-pc-night",
    [sprite("aleem", "aleem-home-numb", "aleem-home", "center", "numb")],
    "guilt in monitor light",
    "fade",
  ),
  boysClassroomTired: snapshot(
    "bg-boys-classroom",
    [sprite("aleem", "aleem-sec-tired", "aleem-sec", "center", "tired")],
    "exhaustion and mounting consequences",
    "dissolve",
  ),
  examHall: snapshot(
    "bg-exam-hall",
    [sprite("aleem", "aleem-sec-tired", "aleem-sec", "center", "tired")],
    "airless exam tension",
    "fade",
  ),
  resultsHall: snapshot(
    "bg-results-hall",
    [sprite("aleem", "aleem-sec-neutral", "aleem-sec", "center", "neutral")],
    "muted results-day apprehension",
    "fade",
  ),
  resultsReveal: snapshot(
    "cg-results",
    [],
    "desaturated shock",
    "cut",
    {
      kind: "results",
      label: "O-Level results slip",
      title: "2013 examination results",
      lines: ["The outcome is below Aleem's hopes.", "Exact grades are not shown."],
    },
  ),
  darkBedroom: snapshot(
    "bg-dark-bedroom",
    [sprite("aleem", "aleem-home-numb", "aleem-home", "center", "numb")],
    "withdrawn, heavy stillness",
    "fade",
  ),
  dawn: snapshot("bg-dawn-window", [], "dawn after a difficult night", "fade"),
} as const satisfies Record<string, StageSnapshot>;

