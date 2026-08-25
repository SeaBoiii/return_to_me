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
    "bg-alya-bedroom-2010",
    [
      sprite(
        "alya",
        "alya-young-home-startled",
        "alya",
        "right",
        "startled",
        "left",
      ),
    ],
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
    "bg-alya-bedroom-2010",
    [
      sprite(
        "alya",
        "alya-young-home-apologetic",
        "alya",
        "right",
        "apologetic",
        "left",
      ),
    ],
    "remorse without easy answers",
    "none",
  ),
  primaryHurt: snapshot(
    "bg-bedroom-2009",
    [
      sprite(
        "aleem",
        "aleem-young-home-hurt",
        "aleem-p6",
        "center",
        "hurt",
      ),
    ],
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
    [sprite("aleem", "aleem-home-focused", "aleem-sec", "center", "focused")],
    "creative focus and possibility",
    "fade",
  ),
  serverProud: snapshot(
    "bg-bedroom-pc-day",
    [sprite("aleem", "aleem-home-proud", "aleem-sec", "right", "proud", "left", 2)],
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
    [sprite("aleem", "aleem-home-focused", "aleem-sec", "center", "focused")],
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
    [sprite("aleem", "aleem-home-numb", "aleem-sec", "center", "numb")],
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
    [sprite("aleem", "aleem-home-numb", "aleem-sec", "center", "numb")],
    "withdrawn, heavy stillness",
    "fade",
  ),
  dawn: snapshot("bg-dawn-window", [], "dawn after a difficult night", "fade"),

  // Chapters 1 and 2 use a richer set of complete snapshots so the early
  // story has the same visual rhythm as the later JC chapters. These remain
  // separate from the legacy snapshots above until the refreshed art is
  // promoted, which also keeps staging changes independent from asset import.
  ch1PrimaryEstablishing: snapshot(
    "bg-primary-classroom",
    [],
    "warm primary-school morning before the memory fills in",
    "fade",
  ),
  ch1PrimaryNeutral: snapshot(
    "bg-primary-classroom",
    [
      sprite("aleem", "aleem-p6-neutral", "aleem-p6", "left", "neutral"),
      sprite("alya", "alya-neutral", "alya", "right", "neutral", "left"),
    ],
    "warm primary-school nostalgia",
  ),
  ch1PrimaryPlayful: snapshot(
    "bg-primary-classroom",
    [
      sprite("aleem", "aleem-p6-surprised", "aleem-p6", "left", "surprised"),
      sprite("alya", "alya-playful", "alya", "right", "playful", "left"),
    ],
    "playful classroom teasing",
    "none",
  ),
  ch1PrimaryCheerful: snapshot(
    "bg-primary-classroom",
    [
      sprite("aleem", "aleem-p6-cheerful", "aleem-p6", "left", "cheerful"),
      sprite("alya", "alya-smile", "alya", "right", "smile", "left"),
    ],
    "bright laughter between lessons",
    "none",
  ),
  ch1PrimaryHopeful: snapshot(
    "bg-primary-classroom",
    [
      sprite(
        "aleem",
        "aleem-p6-reflective",
        "aleem-p6",
        "left",
        "reflective",
      ),
      sprite("alya", "alya-hopeful", "alya", "right", "hopeful", "left"),
    ],
    "a future that still sounds harmless",
    "dissolve",
  ),
  ch1CorridorNervous: snapshot(
    "bg-primary-corridor",
    [sprite("aleem", "aleem-p6-nervous", "aleem-p6", "center", "nervous")],
    "sunlit anticipation and playground rumours",
    "fade",
  ),
  ch1CorridorShy: snapshot(
    "bg-primary-corridor",
    [
      sprite("aleem", "aleem-p6-nervous", "aleem-p6", "left", "nervous"),
      sprite("alya", "alya-shy", "alya", "right", "shy", "left"),
    ],
    "two shy answers in a quiet corridor",
  ),
  ch1FirstConfession: snapshot(
    "cg-first-confession",
    [],
    "a small, sincere first confession",
    "dissolve",
  ),
  ch1CanteenHappy: snapshot(
    "bg-primary-canteen",
    [
      sprite("aleem", "aleem-p6-cheerful", "aleem-p6", "left", "cheerful"),
      sprite("alya", "alya-smile", "alya", "right", "smile", "left"),
    ],
    "shared snacks in nostalgic afternoon gold",
    "fade",
  ),
  ch1CanteenPlayful: snapshot(
    "bg-primary-canteen",
    [
      sprite("aleem", "aleem-p6-smile", "aleem-p6", "left", "smile"),
      sprite("alya", "alya-playful", "alya", "right", "playful", "left"),
    ],
    "an ordinary joke made important by company",
    "none",
  ),
  ch1GraduationEstablishing: snapshot(
    "bg-graduation-gate",
    [],
    "graduation celebration edged with farewell",
    "fade",
  ),
  ch1GraduationPromise: snapshot(
    "cg-graduation-promise",
    [],
    "a promise sincerely made at graduation",
    "dissolve",
  ),
  ch1GraduationPromiseSealed: snapshot(
    "cg-graduation-promise",
    [],
    "hope held inside a promise neither child doubts",
    "none",
  ),
  ch1BusStop: snapshot(
    "bg-bus-stop",
    [],
    "two lives beginning to follow different routes",
    "fade",
  ),
  ch1BedroomWarmSmile: snapshot(
    "bg-bedroom-2009-warm",
    [sprite("aleem", "aleem-young-home-smile", "aleem-p6", "center", "smile")],
    "warm messages keeping old routines alive",
    "fade",
  ),
  ch1BedroomWarmNeutral: snapshot(
    "bg-bedroom-2009-warm",
    [
      sprite(
        "aleem",
        "aleem-young-home-neutral",
        "aleem-p6",
        "center",
        "neutral",
      ),
    ],
    "a familiar room as replies begin to thin",
    "dissolve",
  ),
  ch1BedroomCoolWaiting: snapshot(
    "bg-bedroom-2009",
    [
      sprite(
        "aleem",
        "aleem-young-home-waiting",
        "aleem-p6",
        "center",
        "waiting",
      ),
    ],
    "cool phone light and longer silences",
    "fade",
  ),
  ch1BedroomCoolStartled: snapshot(
    "bg-bedroom-2009",
    [
      sprite(
        "aleem",
        "aleem-young-home-startled",
        "aleem-p6",
        "center",
        "startled",
      ),
    ],
    "a welcome vibration before its meaning is known",
    "none",
  ),
  ch1BedroomCoolSmile: snapshot(
    "bg-bedroom-2009",
    [sprite("aleem", "aleem-young-home-smile", "aleem-p6", "center", "smile")],
    "a familiar name glowing on a cooler screen",
    "none",
  ),
  ch1BedroomCoolHurt: snapshot(
    "bg-bedroom-2009",
    [sprite("aleem", "aleem-young-home-hurt", "aleem-p6", "center", "hurt")],
    "hurt held alone in cool phone light",
    "fade",
  ),
  ch1BedroomCoolReflective: snapshot(
    "bg-bedroom-2009",
    [
      sprite(
        "aleem",
        "aleem-young-home-hurt",
        "aleem-p6",
        "center",
        "hurt",
      ),
    ],
    "a young mind searching for a clean explanation",
    "none",
  ),
  ch1WrongMessage: snapshot(
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
  ch1WrongMessageQuestion: snapshot(
    "cg-wrong-message",
    [],
    "hurt and disbelief after reading twice",
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
  ch1SmsAsk: snapshot(
    "bg-bedroom-2009",
    [
      sprite(
        "aleem",
        "aleem-young-home-startled",
        "aleem-p6",
        "center",
        "startled",
      ),
    ],
    "a careful question typed through shock",
    "cut",
  ),
  ch1SmsDirect: snapshot(
    "bg-bedroom-2009",
    [sprite("aleem", "aleem-young-home-hurt", "aleem-p6", "center", "hurt")],
    "frightened directness on a small screen",
    "cut",
  ),
  ch1SmsWait: snapshot(
    "bg-bedroom-2009",
    [
      sprite(
        "aleem",
        "aleem-young-home-waiting",
        "aleem-p6",
        "center",
        "waiting",
      ),
    ],
    "silence measured by a typing indicator",
    "cut",
  ),
  ch1AlyaStartled: snapshot(
    "bg-alya-bedroom-2010",
    [
      sprite(
        "alya",
        "alya-young-home-startled",
        "alya",
        "center",
        "startled",
        "left",
      ),
    ],
    "sudden realization in another home",
    "cut",
    {
      kind: "sms",
      label: "SMS conversation",
      title: "Alya",
      lines: ["Wait—Aleem?", "I sent that to the wrong person.", "I am so sorry."],
    },
  ),
  ch1AlyaApologetic: snapshot(
    "bg-alya-bedroom-2010",
    [
      sprite(
        "alya",
        "alya-young-home-apologetic",
        "alya",
        "center",
        "apologetic",
        "left",
      ),
    ],
    "remorse without an easy explanation",
    "dissolve",
  ),
  ch1AlyaSad: snapshot(
    "bg-alya-bedroom-2010",
    [sprite("alya", "alya-young-home-sad", "alya", "center", "sad", "left")],
    "a difficult truth finally spoken",
    "none",
  ),

  ch2BoysEstablishing: snapshot(
    "bg-boys-classroom",
    [],
    "a plain boys-school classroom before Aleem enters the frame",
    "fade",
  ),
  ch2BoysClassroomNeutral: snapshot(
    "bg-boys-classroom",
    [sprite("aleem", "aleem-sec-neutral", "aleem-sec", "center", "neutral")],
    "a familiar secondary-school routine",
  ),
  ch2BoysCorridor: snapshot(
    "bg-boys-school-corridor",
    [sprite("aleem", "aleem-sec-neutral", "aleem-sec", "center", "neutral")],
    "movement between one school and an unfamiliar classroom",
    "dissolve",
  ),
  ch2LanguageEstablishing: snapshot(
    "bg-language-classroom",
    [],
    "bright unfamiliar possibility",
    "fade",
  ),
  ch2LanguageAleemNervous: snapshot(
    "bg-language-classroom",
    [sprite("aleem", "aleem-sec-nervous", "aleem-sec", "left", "nervous")],
    "self-conscious curiosity in a mixed classroom",
  ),
  ch2LanguageHanaCurious: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-neutral", "aleem-sec", "left", "neutral"),
      sprite("hana", "hana-curious", "hana", "right", "curious", "left"),
    ],
    "new attention across a classroom",
    "none",
  ),
  ch2LanguageHanaNeutral: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-neutral", "aleem-sec", "left", "neutral"),
      sprite("hana", "hana-neutral", "hana", "right", "neutral", "left"),
    ],
    "a first clear look across the external classroom",
    "dissolve",
  ),
  ch2LanguageAleemEmbarrassed: snapshot(
    "bg-language-classroom",
    [
      sprite(
        "aleem",
        "aleem-sec-embarrassed",
        "aleem-sec",
        "left",
        "embarrassed",
      ),
      sprite("hana", "hana-curious", "hana", "right", "curious", "left"),
    ],
    "an incorrect page becoming a private joke",
    "none",
  ),
  ch2LanguageHanaSmile: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-embarrassed", "aleem-sec", "left", "embarrassed"),
      sprite("hana", "hana-smile", "hana", "right", "smile", "left"),
    ],
    "embarrassment softened by kindness",
    "none",
  ),
  ch2LanguageSharedSmile: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-smile", "aleem-sec", "left", "smile"),
      sprite("hana", "hana-smile", "hana", "right", "smile", "left"),
    ],
    "easy conversation between lessons",
    "dissolve",
  ),
  ch2LanguageHanaSupportive: snapshot(
    "bg-language-classroom",
    [
      sprite("aleem", "aleem-sec-smile", "aleem-sec", "left", "smile"),
      sprite(
        "hana",
        "hana-supportive",
        "hana",
        "right",
        "supportive",
        "left",
      ),
    ],
    "attention that makes an interest feel worth sharing",
    "none",
  ),
  ch2FarisTeasing: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-embarrassed", "aleem-sec", "left", "embarrassed"),
      sprite("faris", "faris-teasing", "faris", "right", "teasing", "left"),
    ],
    "friendly teasing after class",
    "fade",
  ),
  ch2FarisNeutral: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-nervous", "aleem-sec", "left", "nervous"),
      sprite("faris", "faris-neutral", "faris", "right", "neutral", "left"),
    ],
    "Faris noticing what Aleem has not admitted aloud",
    "fade",
  ),
  ch2FarisEncouraging: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-nervous", "aleem-sec", "left", "nervous"),
      sprite(
        "faris",
        "faris-encouraging",
        "faris",
        "right",
        "encouraging",
        "left",
      ),
    ],
    "a wingman making courage feel possible",
    "none",
  ),
  ch2FarisConfident: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-confused", "aleem-sec", "left", "confused"),
      sprite("faris", "faris-confident", "faris", "right", "confident", "left"),
    ],
    "a wingman entirely certain of his plan",
    "none",
  ),
  ch2FarisWingman: snapshot(
    "cg-faris-wingman",
    [],
    "Faris opens the conversation without making a spectacle",
    "cut",
  ),
  ch2CourtyardNervous: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-nervous", "aleem-sec", "left", "nervous"),
      sprite("hana", "hana-shy", "hana", "right", "shy", "left"),
    ],
    "tentative mutual affection",
    "dissolve",
  ),
  ch2CourtyardEmbarrassed: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-embarrassed", "aleem-sec", "left", "embarrassed"),
      sprite("hana", "hana-smile", "hana", "right", "smile", "left"),
    ],
    "awkward honesty met with warmth",
    "none",
  ),
  ch2CourtyardHappy: snapshot(
    "bg-language-courtyard",
    [
      sprite("aleem", "aleem-sec-smile", "aleem-sec", "left", "smile"),
      sprite("hana", "hana-smile", "hana", "right", "smile", "left"),
    ],
    "young happiness in afternoon light",
    "none",
  ),
  ch2PcFocused: snapshot(
    "bg-bedroom-pc-day",
    [sprite("aleem", "aleem-home-focused", "aleem-sec", "center", "focused")],
    "creative focus and technical possibility",
    "fade",
  ),
  ch2PcProud: snapshot(
    "bg-bedroom-pc-day",
    [sprite("aleem", "aleem-home-proud", "aleem-sec", "right", "proud", "left", 2)],
    "earned pride in something built from nothing",
    "none",
  ),
  ch2ServerProud: snapshot(
    "bg-bedroom-pc-day",
    [sprite("aleem", "aleem-home-proud", "aleem-sec", "right", "proud", "left", 2)],
    "earned pride and electric momentum",
    "none",
    {
      kind: "server",
      label: "Block-inspired server dashboard",
      title: "Server online",
      lines: ["Players are joining", "The community is growing", "Support received"],
    },
  ),
  ch2ServerCall: snapshot(
    "bg-bedroom-pc-day",
    [sprite("aleem", "aleem-home-proud", "aleem-sec", "right", "proud", "left", 2)],
    "pride shared during a phone call",
    "none",
    {
      kind: "caption",
      label: "A phone call with Hana",
      title: "Hana is listening from home",
      lines: ["Aleem describes the server he built", "No caller is shown onstage"],
    },
  ),
  ch2PcDistracted: snapshot(
    "bg-bedroom-pc-night",
    [
      sprite(
        "aleem",
        "aleem-home-distracted",
        "aleem-sec",
        "center",
        "distracted",
      ),
    ],
    "attention split by late-night demands",
    "fade",
  ),
  ch2PcOverwhelmed: snapshot(
    "bg-bedroom-pc-night",
    [
      sprite(
        "aleem",
        "aleem-home-overwhelmed",
        "aleem-sec",
        "center",
        "overwhelmed",
      ),
    ],
    "too many urgent tasks and no margin",
    "none",
  ),
  ch2ServerCrisis: snapshot(
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
  ch2ServerAftermath: snapshot(
    "cg-server-night",
    [],
    "the server stabilised after another costly night",
    "dissolve",
    {
      kind: "server",
      label: "Block-inspired server alerts",
      title: "Administrator queue",
      lines: ["Connection stable", "Reports processed", "Morning approaching"],
    },
  ),
  ch2LanguageLateSupportive: snapshot(
    "bg-language-classroom-late",
    [
      sprite("aleem", "aleem-sec-guilty", "aleem-sec", "left", "guilty"),
      sprite(
        "hana",
        "hana-supportive",
        "hana",
        "right",
        "supportive",
        "left",
      ),
    ],
    "care continuing after another missed promise",
    "fade",
  ),
  ch2LanguageLateConcerned: snapshot(
    "bg-language-classroom-late",
    [
      sprite("aleem", "aleem-sec-guilty", "aleem-sec", "left", "guilty"),
      sprite("hana", "hana-concerned", "hana", "right", "concerned", "left"),
    ],
    "concern becoming harder to dismiss",
    "none",
  ),
  ch2LanguageLateDefensive: snapshot(
    "bg-language-classroom-late",
    [
      sprite("aleem", "aleem-sec-defensive", "aleem-sec", "left", "defensive"),
      sprite(
        "hana",
        "hana-disappointed",
        "hana",
        "right",
        "disappointed",
        "left",
      ),
    ],
    "pride raising its defences against loneliness",
    "dissolve",
  ),
  ch2LanguageLateGuilty: snapshot(
    "bg-language-classroom-late",
    [
      sprite("aleem", "aleem-sec-guilty", "aleem-sec", "left", "guilty"),
      sprite(
        "hana",
        "hana-disappointed",
        "hana",
        "right",
        "disappointed",
        "left",
      ),
    ],
    "an apology arriving after patience has thinned",
    "none",
  ),
  ch2LanguageLateDistant: snapshot(
    "bg-language-classroom-late",
    [
      sprite("aleem", "aleem-sec-confused", "aleem-sec", "left", "confused"),
      sprite("hana", "hana-distant", "hana", "right", "distant", "left"),
    ],
    "words arriving after the easy rhythm has gone",
    "dissolve",
  ),
  ch2LanguageLateEmpty: snapshot(
    "bg-language-classroom-late",
    [],
    "an external classroom after the conversation has emptied out",
    "fade",
  ),
  ch2HomeRegretful: snapshot(
    "bg-bedroom-pc-night",
    [
      sprite(
        "aleem",
        "aleem-home-regretful",
        "aleem-sec",
        "center",
        "regretful",
      ),
    ],
    "regret beside the still-open dashboard",
    "fade",
  ),
  ch2HomeNumb: snapshot(
    "bg-bedroom-pc-night",
    [sprite("aleem", "aleem-home-numb", "aleem-sec", "center", "numb")],
    "monitor light no longer feeling triumphant",
    "dissolve",
  ),
  ch2BoysOvercastTired: snapshot(
    "bg-boys-classroom-overcast",
    [sprite("aleem", "aleem-sec-tired", "aleem-sec", "center", "tired")],
    "exhaustion beneath an overcast school day",
    "fade",
  ),
  ch2BoysOvercastGuilty: snapshot(
    "bg-boys-classroom-overcast",
    [sprite("aleem", "aleem-sec-guilty", "aleem-sec", "center", "guilty")],
    "warnings accumulating faster than foundations can be rebuilt",
    "none",
  ),
  ch2MutualFriend: snapshot(
    "bg-language-corridor-rain",
    [sprite("aleem", "aleem-sec-confused", "aleem-sec", "center", "confused")],
    "unwelcome news in a rain-muted corridor",
    "cut",
    {
      kind: "caption",
      label: "A message from a mutual friend",
      title: "Mutual friend, offscreen",
      lines: ["I thought you should hear it from someone.", "Hana has moved on."],
    },
  ),
  ch2MutualFriendHurt: snapshot(
    "bg-language-corridor-rain",
    [
      sprite(
        "aleem",
        "aleem-sec-devastated",
        "aleem-sec",
        "center",
        "devastated",
      ),
    ],
    "shock beneath the sound of rain",
    "none",
  ),
  ch2MutualFriendReply: snapshot(
    "bg-language-corridor-rain",
    [
      sprite(
        "aleem",
        "aleem-sec-defensive",
        "aleem-sec",
        "center",
        "defensive",
      ),
    ],
    "hurt trying to decide whether to ask or retreat",
    "none",
  ),
  ch2HanaBreakup: snapshot(
    "cg-hana-breakup",
    [],
    "two difficult truths held in the same conversation",
    "cut",
  ),
  ch2HanaBreakupReflection: snapshot(
    "cg-hana-breakup",
    [],
    "responsibility without turning either person into a villain",
    "dissolve",
  ),
  ch2HanaApologetic: snapshot(
    "bg-language-classroom-late",
    [
      sprite("aleem", "aleem-sec-guilty", "aleem-sec", "left", "guilty"),
      sprite(
        "hana",
        "hana-apologetic",
        "hana",
        "right",
        "apologetic",
        "left",
      ),
    ],
    "a direct apology after silence",
    "dissolve",
  ),
  ch2HanaDisappointed: snapshot(
    "bg-language-classroom-late",
    [
      sprite("aleem", "aleem-sec-guilty", "aleem-sec", "left", "guilty"),
      sprite(
        "hana",
        "hana-disappointed",
        "hana",
        "right",
        "disappointed",
        "left",
      ),
    ],
    "care acknowledged after it could no longer carry the relationship",
    "none",
  ),
  ch2ExamEstablishing: snapshot(
    "bg-exam-hall",
    [],
    "rows of desks and airless examination stillness",
    "fade",
  ),
  ch2ExamCg: snapshot(
    "cg-o-level-exam",
    [],
    "continuing through an examination without enough foundation",
    "cut",
  ),
  ch2ResultsEstablishing: snapshot(
    "bg-results-hall",
    [],
    "fluorescent results-day apprehension",
    "fade",
  ),
  ch2ResultsWaiting: snapshot(
    "bg-results-hall",
    [sprite("aleem", "aleem-sec-nervous", "aleem-sec", "center", "nervous")],
    "a folded result held before it is opened",
    "dissolve",
  ),
  ch2ResultsReveal: snapshot(
    "cg-results",
    [],
    "desaturated shock without displaying exact grades",
    "cut",
    {
      kind: "results",
      label: "O-Level results slip",
      title: "2013 examination results",
      lines: ["The outcome is below Aleem's hopes.", "Exact grades are not shown."],
    },
  ),
  ch2DarkRegretful: snapshot(
    "bg-dark-bedroom",
    [
      sprite(
        "aleem",
        "aleem-home-regretful",
        "aleem-sec",
        "center",
        "regretful",
      ),
    ],
    "responsibility settling into a darkened room",
    "fade",
  ),
  ch2DarkNumb: snapshot(
    "bg-dark-bedroom",
    [sprite("aleem", "aleem-home-numb", "aleem-sec", "center", "numb")],
    "withdrawn, heavy stillness",
    "none",
  ),
  ch2DarkOverwhelmed: snapshot(
    "bg-dark-bedroom",
    [
      sprite(
        "aleem",
        "aleem-home-overwhelmed",
        "aleem-sec",
        "center",
        "overwhelmed",
      ),
    ],
    "shame trying to combine separate failures into one identity",
    "dissolve",
  ),

  // The JC chapters use complete snapshots so chapter jumps and save restores
  // never depend on visual state inherited from an earlier scene.
  jcFamilyPressure: snapshot(
    "bg-hdb-dining",
    [],
    "family expectations pressing into a quiet room",
    "fade",
  ),
  jcArrival: snapshot(
    "bg-jc-walkway",
    [sprite("aleem", "aleem-jc-neutral", "aleem-sec", "center", "neutral")],
    "a cautious beginning on an unfamiliar campus",
    "fade",
  ),
  jcClassroom: snapshot(
    "bg-jc-classroom",
    [sprite("aleem", "aleem-jc-neutral", "aleem-sec", "center", "neutral")],
    "a new classroom and a second academic chance",
  ),
  jcSyafiqaClassroom: snapshot(
    "bg-jc-classroom",
    [
      sprite("aleem", "aleem-jc-neutral", "aleem-sec", "left", "neutral"),
      sprite("syafiqa", "syafiqa-neutral", "syafiqa", "right", "neutral", "left"),
    ],
    "two familiar classmates discovering another coincidence",
    "dissolve",
  ),
  jcSyafiqaWarm: snapshot(
    "bg-jc-walkway",
    [
      sprite("aleem", "aleem-jc-smile", "aleem-sec", "left", "smile"),
      sprite("syafiqa", "syafiqa-amused", "syafiqa", "right", "amused", "left"),
    ],
    "the warmth of a familiar classmate",
    "dissolve",
  ),
  chineseClassRecall: snapshot(
    "bg-language-classroom",
    [],
    "a brief memory of Chinese class",
    "dissolve",
  ),
  busStopWaiting: snapshot(
    "bg-bus-stop",
    [
      sprite("aleem", "aleem-jc-smile", "aleem-sec", "left", "smile"),
      sprite("syafiqa", "syafiqa-smile", "syafiqa", "right", "smile", "left"),
    ],
    "anticipation measured in departing buses",
    "fade",
  ),
  busMorningTogether: snapshot(
    "bg-bus-interior-morning",
    [
      sprite("aleem", "aleem-jc-smile", "aleem-sec", "left", "smile"),
      sprite("syafiqa", "syafiqa-sleepy", "syafiqa", "right", "sleepy", "left"),
    ],
    "soft morning companionship",
  ),
  busEarpiece: snapshot(
    "cg-shared-earpiece",
    [],
    "music shared through one wired earpiece",
    "dissolve",
    {
      kind: "caption",
      label: "Morning bus ride",
      title: "One earpiece each",
      lines: ["A shared playlist", "No song titles or lyrics are shown"],
    },
  ),
  busEveningAleem: snapshot(
    "bg-bus-interior-evening",
    [sprite("aleem", "aleem-jc-uncertain", "aleem-sec", "center", "uncertain")],
    "cool evening uncertainty",
    "fade",
  ),
  jcConfession: snapshot(
    "bg-jc-walkway",
    [
      sprite("aleem", "aleem-jc-nervous", "aleem-sec", "left", "nervous"),
      sprite(
        "syafiqa",
        "syafiqa-attentive",
        "syafiqa",
        "right",
        "attentive",
        "left",
      ),
    ],
    "quiet courage after school",
    "dissolve",
  ),
  jcSyafiqaFirm: snapshot(
    "bg-jc-walkway",
    [
      sprite("aleem", "aleem-jc-hurt", "aleem-sec", "left", "hurt"),
      sprite(
        "syafiqa",
        "syafiqa-gentle-firm",
        "syafiqa",
        "right",
        "gentle-firm",
        "left",
      ),
    ],
    "a gentle but firm rejection",
  ),
  syafiqaOtherBoy: snapshot(
    "cg-syafiqa-sighting",
    [],
    "a familiar walkway suddenly made distant",
    "cut",
  ),
  jcAleemHurt: snapshot(
    "bg-dark-bedroom",
    [sprite("aleem", "aleem-jc-hurt", "aleem-sec", "center", "hurt")],
    "hurt hardening into a defensive story",
    "fade",
  ),
  confessionMontage: snapshot(
    "bg-jc-walkway",
    [sprite("aleem", "aleem-jc-uncertain", "aleem-sec", "center", "uncertain")],
    "repeated questions seeking the wrong kind of answer",
    "dissolve",
    {
      kind: "caption",
      label: "A compressed memory",
      title: "Three separate confessions",
      lines: ["Three honest boundaries", "No relationship followed"],
    },
  ),
  jcMeiLin: snapshot(
    "bg-jc-classroom",
    [
      sprite("aleem", "aleem-jc-neutral", "aleem-sec", "left", "neutral"),
      sprite(
        "mei-lin",
        "mei-lin-jc-neutral",
        "mei-lin",
        "right",
        "neutral",
        "left",
      ),
    ],
    "a friendship becoming easier to rely on",
    "dissolve",
  ),
  jcMeiLinAmused: snapshot(
    "bg-jc-classroom",
    [
      sprite("aleem", "aleem-jc-smile", "aleem-sec", "left", "smile"),
      sprite(
        "mei-lin",
        "mei-lin-jc-amused",
        "mei-lin",
        "right",
        "amused",
        "left",
      ),
    ],
    "quiet humour making the classroom easier",
    "none",
  ),
  jcStudyTogether: snapshot(
    "bg-jc-study-area",
    [
      sprite("aleem", "aleem-jc-focused", "aleem-sec", "left", "focused"),
      sprite(
        "mei-lin",
        "mei-lin-jc-focused",
        "mei-lin",
        "right",
        "focused",
        "left",
      ),
    ],
    "steady work and reciprocal support",
  ),
  jcStudySupportive: snapshot(
    "bg-jc-study-area",
    [
      sprite("aleem", "aleem-jc-uncertain", "aleem-sec", "left", "uncertain"),
      sprite(
        "mei-lin",
        "mei-lin-jc-supportive",
        "mei-lin",
        "right",
        "supportive",
        "left",
      ),
    ],
    "support moving in both directions",
    "none",
  ),
  aLevelExam: snapshot(
    "bg-exam-hall",
    [sprite("aleem", "aleem-jc-focused", "aleem-sec", "center", "focused")],
    "focused national-examination stillness",
    "fade",
  ),
  aLevelExamTired: snapshot(
    "bg-exam-hall",
    [sprite("aleem", "aleem-jc-tired", "aleem-sec", "center", "tired")],
    "effort holding steady through uncertainty",
    "none",
  ),
  aLevelResults: snapshot(
    "bg-a-level-results",
    [sprite("aleem", "aleem-jc-relieved", "aleem-sec", "center", "relieved")],
    "earned relief beside somebody else's disappointment",
    "fade",
    {
      kind: "results",
      label: "A-Level results",
      title: "2016 examination results",
      lines: [
        "Aleem receives an outcome he is proud of.",
        "Mei Lin's outcome is below her hopes.",
        "Exact grades are not shown.",
      ],
    },
  ),
  aLevelResultsMeiLin: snapshot(
    "bg-a-level-results",
    [
      sprite("aleem", "aleem-jc-neutral", "aleem-sec", "left", "neutral"),
      sprite(
        "mei-lin",
        "mei-lin-jc-disappointed",
        "mei-lin",
        "right",
        "disappointed",
        "left",
      ),
    ],
    "disappointment in a crowded results area",
    "none",
    {
      kind: "results",
      label: "A-Level results",
      title: "Two different outcomes",
      lines: [
        "Aleem did well.",
        "Mei Lin did not receive the result she hoped for.",
        "Exact grades are not shown.",
      ],
    },
  ),
  jcMeiLinInvitation: snapshot(
    "bg-jc-walkway",
    [
      sprite("aleem", "aleem-casual-smile", "aleem-sec", "left", "smile"),
      sprite(
        "mei-lin",
        "mei-lin-casual-guarded",
        "mei-lin",
        "right",
        "guarded",
        "left",
      ),
    ],
    "a low-pressure invitation between friends",
    "dissolve",
  ),
  zooArrival: snapshot(
    "bg-zoo-path",
    [
      sprite("aleem", "aleem-casual-neutral", "aleem-sec", "left", "neutral"),
      sprite(
        "mei-lin",
        "mei-lin-casual-neutral",
        "mei-lin",
        "right",
        "neutral",
        "left",
      ),
    ],
    "humid green daylight and a welcome change of scene",
    "fade",
  ),
  zooTogether: snapshot(
    "bg-zoo-path",
    [
      sprite("aleem", "aleem-casual-smile", "aleem-sec", "left", "smile"),
      sprite(
        "mei-lin",
        "mei-lin-casual-smile",
        "mei-lin",
        "right",
        "smile",
        "left",
      ),
    ],
    "a friend gradually loosening beneath open sky",
  ),
  zooMeiLinAnimated: snapshot(
    "bg-zoo-path",
    [
      sprite("aleem", "aleem-casual-patient", "aleem-sec", "left", "patient"),
      sprite(
        "mei-lin",
        "mei-lin-casual-animated",
        "mei-lin",
        "right",
        "animated",
        "left",
      ),
    ],
    "livelier conversation with another name recurring",
  ),
  zooAleemFrustrated: snapshot(
    "bg-zoo-shelter",
    [
      sprite(
        "aleem",
        "aleem-casual-frustrated",
        "aleem-sec",
        "left",
        "frustrated",
      ),
      sprite(
        "mei-lin",
        "mei-lin-casual-guarded",
        "mei-lin",
        "right",
        "guarded",
        "left",
      ),
    ],
    "irritation held beneath a patient expression",
  ),
  zooDistance: snapshot(
    "cg-zoo-distance",
    [],
    "emotional distance after a long day",
    "fade",
  ),
  jcDawn: snapshot(
    "bg-dawn-window",
    [],
    "a future continuing beyond another difficult lesson",
    "fade",
  ),
} as const satisfies Record<string, StageSnapshot>;
