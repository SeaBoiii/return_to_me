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

const aleem = (expression: string) => person(`aleem-umrah-${expression}`, "aleem-adult");
const nadiah = (expression: string) => person(`nadiah-umrah-${expression}`, "nadiah", "right");
const mariam = (expression: string) => person(`mariam-${expression}`, "mariam", "center");
const yusuf = (expression: string) => person(`yusuf-${expression}`, "yusuf", "right");
const imran = (expression: string) => person(`imran-${expression}`, "imran", "right");

/** Complete snapshots also restore every reflective branch and replay entry. */
export const umrahStages = {
  arrival: scene("bg-holy-land-arrival", "bringing an unfinished heart to the journey", [aleem("neutral"), imran("neutral")], "fade"),
  common: scene("bg-umrah-common-area", "settling among unfamiliar companions", [aleem("neutral")]),
  reunion: scene("bg-umrah-common-area", "a familiar face where he least expected one", [aleem("surprised"), nadiah("neutral")], "cut"),
  reunionWarm: scene("bg-umrah-common-area", "the first ease of speaking again", [aleem("warm"), nadiah("warm")]),
  couple: scene("bg-umrah-common-area", "ordinary kindness within the group", [aleem("neutral"), mariam("warm"), yusuf("neutral")]),
  coupleWarm: scene("bg-umrah-common-area", "company without anything to prove", [aleem("warm"), mariam("neutral"), yusuf("warm")]),
  makkah: scene("bg-makkah-courtyard", "room for worship and a slower breath", [aleem("reflective")], "fade"),
  makkahTogether: scene("bg-makkah-courtyard", "a familiar warmth in a different place", [aleem("warm"), nadiah("warm")]),
  nurAscent: scene("bg-jabal-nur-ascent", "five companions finding their pace", [aleem("neutral"), nadiah("neutral")], "fade"),
  nurTogether: scene("bg-jabal-nur-ascent", "an unexpected conversation on the climb", [aleem("warm"), nadiah("amused")]),
  nurRest: scene("bg-jabal-nur-rest", "time to ask how the years have been", [aleem("reflective"), nadiah("warm")]),
  nurMemory: scene("cg-umrah-jabal-nur", "the past becoming possible to remember gently", [], "dissolve"),
  nurQuiet: scene("bg-jabal-nur-rest", "comfortable pauses between old friends", [aleem("warm"), nadiah("neutral")]),
  rahmah: scene("bg-jabal-rahmah", "finding each other beside the group once more", [aleem("surprised"), nadiah("amused")], "fade"),
  rahmahTogether: scene("bg-jabal-rahmah", "a coincidence he wants to understand", [aleem("warm"), nadiah("warm")]),
  rahmahMemory: scene("cg-umrah-jabal-rahmah", "hope gathering around a remembered tradition", [], "dissolve"),
  hesitation: scene("bg-umrah-common-area", "warmth with a pause he cannot explain", [aleem("reflective"), nadiah("hesitant")]),
  longing: scene("bg-makkah-courtyard", "affection and an unanswered distance", [aleem("reflective"), nadiah("wistful")]),
  madinah: scene("bg-madinah-courtyard", "arriving with questions still unfinished", [aleem("reflective"), imran("neutral")], "fade"),
  prayer: scene("bg-nabawi-interior", "a small private doa", [aleem("reflective")], "dissolve"),
  release: scene("cg-nabawi-release", "a breath escaping with the weight he carried", [], "dissolve"),
  prayerAfter: scene("bg-nabawi-interior", "quiet relief without a promised outcome", [aleem("relieved")]),
  madinahRelief: scene("bg-madinah-courtyard", "learning how light the next step can feel", [aleem("relieved"), imran("encouraging")]),
  madinahTogether: scene("bg-madinah-courtyard", "affection without reaching for a reunion", [aleem("warm"), nadiah("wistful")]),
  boundary: scene("bg-madinah-courtyard", "a kind decision made quietly", [aleem("resolved")]),
  ordinaryCompany: scene("bg-umrah-common-area", "being welcome without having to earn it", [aleem("relieved"), mariam("warm"), yusuf("warm")]),
  introduction: scene("bg-umrah-common-area", "a conversation opening towards someone new", [aleem("neutral"), mariam("encouraging"), yusuf("neutral")]),
  continuation: scene("bg-umrah-common-area", "a name at the beginning of another story", [], "dissolve"),
} as const;
