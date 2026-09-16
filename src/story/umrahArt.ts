import inventory from "./umrah-art.json" with { type: "json" };

export const umrahBackgroundIds = inventory.scenes.map((scene) => scene.id);
export const umrahSpriteIds = inventory.families.flatMap((family) =>
  family.expressions.map((expression) => `${family.id}-${expression}`),
);

/** The independently validated Umrah batch shares its inventory with the app. */
export const umrahArtSpecs = [
  ...inventory.scenes.map((scene) => ({
    id: scene.id,
    kind: scene.kind === "cg" ? "cg" as const : "background" as const,
    path: `assets/art/${scene.kind === "cg" ? "cg" : "backgrounds"}/${scene.id}.webp`,
    width: 1600,
    height: 900,
    focalPoint: { x: 0.5, y: 0.4 },
    preloadGroup: scene.chapter,
    alt: scene.alt,
    promptReference: `art/prompts/umrah-scenes.md#${scene.id}`,
  })),
  ...inventory.families.flatMap((family) =>
    family.expressions.map((expression) => ({
      id: `${family.id}-${expression}`,
      kind: "sprite" as const,
      path: `assets/art/characters/${family.id}/${expression}.webp`,
      width: 768,
      height: 1152,
      focalPoint: { x: 0.5, y: 0.29 },
      preloadGroup: family.chapter,
      alt: `${family.name}, ${expression}.`,
      promptReference: `art/prompts/${family.id === "aleem-umrah" ? "umrah-aleem-sprites" : "umrah-support-sprites"}.md#${family.id}-${expression}`,
    })),
  ),
];
