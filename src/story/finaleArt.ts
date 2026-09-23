import inventory from "./finale-art.json" with { type: "json" };

export const finaleBackgroundIds = inventory.scenes.map((scene) => scene.id);
export const finaleSpriteIds = inventory.families.flatMap((family) =>
  family.expressions.map((expression) => `${family.id}-${expression}`),
);

/** The final chapter shares one inventory with its independent art processor. */
export const finaleArtSpecs = [
  ...inventory.scenes.map((scene) => ({
    id: scene.id,
    kind: scene.kind === "cg" ? "cg" as const : "background" as const,
    path: `assets/art/${scene.kind === "cg" ? "cg" : "backgrounds"}/${scene.id}.webp`,
    width: 1600,
    height: 900,
    focalPoint: { x: 0.5, y: 0.4 },
    preloadGroup: scene.chapter,
    alt: scene.alt,
    promptReference: `art/prompts/finale-scenes.md#${scene.id}`,
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
      promptReference: `art/prompts/finale-sprites.md#${family.id}-${expression}`,
    })),
  ),
];
