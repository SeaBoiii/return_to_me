import type { AssetEntry, AssetKind } from "../engine/types";
import { appPathname } from "../pwa/basePath";
import { storyAssetIds } from "./assets";

interface ArtAssetSpec {
  readonly id: string;
  readonly kind: AssetKind;
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly focalPoint: AssetEntry["focalPoint"];
  readonly preloadGroup: string;
  readonly alt: string;
  readonly promptReference: string;
}

const generatedProvenance = (promptReference: string) => ({
  creator: "OpenAI image generation",
  promptReference,
  license: "All rights reserved; generated for Return to Me",
});

const background = (
  id: string,
  group: string,
  alt: string,
  focalPoint: AssetEntry["focalPoint"] = { x: 0.5, y: 0.5 },
): ArtAssetSpec => ({
  id,
  kind: "background",
  path: `assets/art/backgrounds/${id}.webp`,
  width: 1600,
  height: 900,
  focalPoint,
  preloadGroup: group,
  alt,
  promptReference: `art/prompts/provenance.md#${id}`,
});

const cg = (
  id: string,
  group: string,
  alt: string,
  focalPoint: AssetEntry["focalPoint"] = { x: 0.5, y: 0.5 },
): ArtAssetSpec => ({
  id,
  kind: "cg",
  path: `assets/art/cg/${id}.webp`,
  width: 1600,
  height: 900,
  focalPoint,
  preloadGroup: group,
  alt,
  promptReference: `art/prompts/provenance.md#${id}`,
});

const sprite = (
  id: string,
  directory: string,
  filename: string,
  width: number,
  height: number,
  group: string,
  alt: string,
  focalPoint: AssetEntry["focalPoint"],
): ArtAssetSpec => ({
  id,
  kind: "sprite",
  path: `assets/art/characters/${directory}/${filename}.webp`,
  width,
  height,
  focalPoint,
  preloadGroup: group,
  alt,
  promptReference: `art/prompts/provenance.md#${directory}`,
});

const ART_SPECS = [
  background(
    "bg-primary-classroom",
    "chapter-1",
    "A warm Singapore primary-school classroom with light-blue accents.",
  ),
  background(
    "bg-primary-corridor",
    "chapter-1",
    "A sunlit primary-school corridor overlooking a courtyard.",
    { x: 0.52, y: 0.46 },
  ),
  background(
    "bg-graduation-gate",
    "chapter-1",
    "An unnamed primary-school gate decorated for graduation.",
    { x: 0.5, y: 0.42 },
  ),
  background(
    "bg-bus-stop",
    "chapter-1",
    "A quiet Singapore bus stop suggesting two diverging school journeys.",
    { x: 0.55, y: 0.5 },
  ),
  background(
    "bg-bedroom-2009",
    "chapter-1",
    "A modest 2009 bedroom lit by the cool glow of a mobile phone.",
    { x: 0.62, y: 0.48 },
  ),
  background(
    "bg-boys-classroom",
    "chapter-2",
    "A plain secondary-school classroom in an unnamed boys' school.",
  ),
  background(
    "bg-language-classroom",
    "chapter-2",
    "A bright mixed-school classroom hosting an external language class.",
  ),
  background(
    "bg-language-courtyard",
    "chapter-2",
    "A leafy school courtyard in warm afternoon light.",
    { x: 0.5, y: 0.44 },
  ),
  background(
    "bg-bedroom-pc-day",
    "chapter-2",
    "Aleem's bedroom workspace and block-inspired game server setup by day.",
    { x: 0.65, y: 0.48 },
  ),
  background(
    "bg-bedroom-pc-night",
    "chapter-2",
    "Aleem's bedroom workspace illuminated by electric-blue monitors at night.",
    { x: 0.65, y: 0.48 },
  ),
  background(
    "bg-exam-hall",
    "chapter-2",
    "Rows of desks in a quiet, unnamed O-Level examination hall.",
  ),
  background(
    "bg-results-hall",
    "chapter-2",
    "A muted school hall on O-Level results day.",
    { x: 0.5, y: 0.44 },
  ),
  background(
    "bg-dark-bedroom",
    "chapter-2",
    "Aleem's darkened bedroom during a period of withdrawal.",
    { x: 0.63, y: 0.48 },
  ),
  background(
    "bg-dawn-window",
    "shared",
    "Soft dawn light entering through a bedroom window.",
    { x: 0.62, y: 0.46 },
  ),
  cg(
    "cg-wrong-message",
    "chapter-1",
    "Young Aleem reacting to an unexpected SMS in cold phone light.",
    { x: 0.65, y: 0.46 },
  ),
  cg(
    "cg-server-night",
    "chapter-2",
    "Teenage Aleem absorbed in late-night game-server administration.",
    { x: 0.66, y: 0.48 },
  ),
  cg(
    "cg-results",
    "chapter-2",
    "Teenage Aleem processing disappointing O-Level results.",
    { x: 0.65, y: 0.46 },
  ),

  sprite(
    "aleem-p6-neutral",
    "aleem-p6",
    "neutral",
    512,
    512,
    "chapter-1",
    "Primary 6 Aleem, neutral.",
    { x: 0.5, y: 0.24 },
  ),
  sprite(
    "aleem-p6-smile",
    "aleem-p6",
    "shy-smile",
    512,
    512,
    "chapter-1",
    "Primary 6 Aleem smiling shyly.",
    { x: 0.5, y: 0.24 },
  ),
  sprite(
    "aleem-p6-surprised",
    "aleem-p6",
    "surprised",
    512,
    512,
    "chapter-1",
    "Primary 6 Aleem looking surprised.",
    { x: 0.5, y: 0.24 },
  ),
  sprite(
    "aleem-p6-hurt",
    "aleem-p6",
    "hurt",
    512,
    512,
    "chapter-1",
    "Primary 6 Aleem looking hurt.",
    { x: 0.5, y: 0.24 },
  ),
  sprite(
    "aleem-p6-reflective",
    "aleem-p6",
    "reflective",
    512,
    512,
    "chapter-1",
    "Primary 6 Aleem in a reflective mood.",
    { x: 0.5, y: 0.24 },
  ),
  sprite(
    "alya-neutral",
    "alya",
    "neutral",
    512,
    512,
    "chapter-1",
    "Alya, neutral.",
    { x: 0.5, y: 0.23 },
  ),
  sprite(
    "alya-smile",
    "alya",
    "smile",
    512,
    512,
    "chapter-1",
    "Alya smiling.",
    { x: 0.5, y: 0.23 },
  ),
  sprite(
    "alya-playful",
    "alya",
    "playful",
    512,
    512,
    "chapter-1",
    "Alya with a playful expression.",
    { x: 0.5, y: 0.23 },
  ),
  sprite(
    "alya-startled",
    "alya",
    "startled",
    512,
    512,
    "chapter-1",
    "Alya looking startled.",
    { x: 0.5, y: 0.23 },
  ),
  sprite(
    "alya-apologetic",
    "alya",
    "apologetic",
    512,
    512,
    "chapter-1",
    "Alya with an apologetic expression.",
    { x: 0.5, y: 0.23 },
  ),

  sprite(
    "aleem-sec-neutral",
    "aleem-sec",
    "neutral",
    384,
    512,
    "chapter-2",
    "Secondary-school Aleem, neutral.",
    { x: 0.5, y: 0.2 },
  ),
  sprite(
    "aleem-sec-nervous",
    "aleem-sec",
    "nervous",
    384,
    512,
    "chapter-2",
    "Secondary-school Aleem looking nervous.",
    { x: 0.5, y: 0.2 },
  ),
  sprite(
    "aleem-sec-smile",
    "aleem-sec",
    "smile",
    384,
    512,
    "chapter-2",
    "Secondary-school Aleem smiling.",
    { x: 0.5, y: 0.2 },
  ),
  sprite(
    "aleem-sec-confused",
    "aleem-sec",
    "confused",
    384,
    512,
    "chapter-2",
    "Secondary-school Aleem looking confused.",
    { x: 0.5, y: 0.2 },
  ),
  sprite(
    "aleem-sec-guilty",
    "aleem-sec",
    "guilty",
    384,
    512,
    "chapter-2",
    "Secondary-school Aleem looking guilty.",
    { x: 0.5, y: 0.2 },
  ),
  sprite(
    "aleem-sec-tired",
    "aleem-sec",
    "tired",
    384,
    512,
    "chapter-2",
    "Secondary-school Aleem looking tired.",
    { x: 0.5, y: 0.2 },
  ),
  sprite(
    "aleem-sec-devastated",
    "aleem-sec",
    "devastated",
    384,
    512,
    "chapter-2",
    "Secondary-school Aleem processing devastating news.",
    { x: 0.5, y: 0.2 },
  ),
  sprite(
    "aleem-home-focused",
    "aleem-home",
    "focused",
    627,
    627,
    "chapter-2",
    "Aleem in home clothes, focused on his computer.",
    { x: 0.5, y: 0.22 },
  ),
  sprite(
    "aleem-home-proud",
    "aleem-home",
    "proud",
    627,
    627,
    "chapter-2",
    "Aleem in home clothes, proud of his server.",
    { x: 0.5, y: 0.22 },
  ),
  sprite(
    "aleem-home-distracted",
    "aleem-home",
    "distracted",
    627,
    627,
    "chapter-2",
    "Aleem in home clothes, distracted by server alerts.",
    { x: 0.5, y: 0.22 },
  ),
  sprite(
    "aleem-home-numb",
    "aleem-home",
    "numb",
    627,
    627,
    "chapter-2",
    "Aleem in home clothes, withdrawn and numb.",
    { x: 0.5, y: 0.22 },
  ),
  sprite(
    "hana-neutral",
    "hana",
    "neutral",
    512,
    512,
    "chapter-2",
    "Hana, neutral.",
    { x: 0.5, y: 0.21 },
  ),
  sprite(
    "hana-curious",
    "hana",
    "curious",
    512,
    512,
    "chapter-2",
    "Hana looking curious.",
    { x: 0.5, y: 0.21 },
  ),
  sprite(
    "hana-shy",
    "hana",
    "shy",
    512,
    512,
    "chapter-2",
    "Hana with a shy expression.",
    { x: 0.5, y: 0.21 },
  ),
  sprite(
    "hana-smile",
    "hana",
    "smile",
    512,
    512,
    "chapter-2",
    "Hana smiling.",
    { x: 0.5, y: 0.21 },
  ),
  sprite(
    "hana-disappointed",
    "hana",
    "disappointed",
    512,
    512,
    "chapter-2",
    "Hana looking disappointed.",
    { x: 0.5, y: 0.21 },
  ),
  sprite(
    "hana-distant",
    "hana",
    "distant",
    512,
    512,
    "chapter-2",
    "Hana with a distant expression.",
    { x: 0.5, y: 0.21 },
  ),
  sprite(
    "faris-neutral",
    "faris",
    "neutral",
    572,
    916,
    "chapter-2",
    "Faris, neutral.",
    { x: 0.5, y: 0.16 },
  ),
  sprite(
    "faris-encouraging",
    "faris",
    "encouraging",
    572,
    916,
    "chapter-2",
    "Faris looking encouraging.",
    { x: 0.5, y: 0.16 },
  ),
  sprite(
    "faris-confident",
    "faris",
    "confident",
    572,
    916,
    "chapter-2",
    "Faris with a confident expression.",
    { x: 0.5, y: 0.16 },
  ),
] as const satisfies readonly ArtAssetSpec[];

const defaultBaseUrl = (): string =>
  (
    import.meta as ImportMeta & {
      readonly env?: { readonly BASE_URL?: string };
    }
  ).env?.BASE_URL || "/";

export const createArtAssetManifest = (
  baseUrl = defaultBaseUrl(),
): readonly AssetEntry[] =>
  ART_SPECS.map(({ path, promptReference, ...spec }) => ({
    ...spec,
    url: appPathname(path, baseUrl),
    provenance: generatedProvenance(promptReference),
  }));

export const artAssets = createArtAssetManifest();

const mappedIds = new Set(ART_SPECS.map((asset) => asset.id));

export const unmappedStoryAssetIds = storyAssetIds.filter(
  (id) => !mappedIds.has(id),
);

export const extraArtAssetIds = ART_SPECS.map((asset) => asset.id).filter(
  (id) => !(storyAssetIds as readonly string[]).includes(id),
);
