import inventory from "./adulthood-art.json" with { type: "json" };

export const adulthoodBackgroundIds = inventory.scenes.map((scene) => scene.id);
export const adulthoodSpriteIds = inventory.families.flatMap((family) =>
  family.expressions.map((expression) => `${family.id}-${expression}`),
);

/** Shared inventory also drives the physical art processor and validator. */
export const adulthoodArtSpecs = [
  ...inventory.scenes.map((scene) => ({
    id: scene.id,
    kind: scene.kind === "cg" ? "cg" as const : "background" as const,
    path: `assets/art/${scene.kind === "cg" ? "cg" : "backgrounds"}/${scene.id}.webp`,
    width: 1600,
    height: 900,
    focalPoint: { x: 0.5, y: 0.45 },
    preloadGroup: scene.chapter,
    alt: scene.alt,
    promptReference: `art/prompts/adulthood-scenes.md#${scene.id}`,
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
      alt: `${family.name}, ${expression === "firm" ? "gentle but firm" : expression}.`,
      promptReference: `art/prompts/adulthood-sprites.md#${family.id}-${expression}`,
    })),
  ),
];
