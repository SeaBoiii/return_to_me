import { describe, expect, it } from "vitest";

import { validateStory } from "../engine/validation";
import { storyAssetIds } from "../story/assets";
import { story } from "../story";
import {
  artAssets,
  createArtAssetManifest,
  extraArtAssetIds,
  getAssetEntry,
  unmappedStoryAssetIds,
} from "./manifest";

describe("production art manifest", () => {
  it("maps every logical story asset exactly once", () => {
    expect(unmappedStoryAssetIds).toEqual([]);
    expect(extraArtAssetIds).toEqual([]);
    expect(artAssets).toHaveLength(storyAssetIds.length);
    expect(new Set(artAssets.map((asset) => asset.id)).size).toBe(
      storyAssetIds.length,
    );

    for (const id of storyAssetIds) {
      expect(getAssetEntry(id)?.id).toBe(id);
    }
  });

  it("resolves public art beneath a nested Vite base path", () => {
    const nestedAssets = createArtAssetManifest("/owner/return-to-me/");

    expect(nestedAssets[0]?.url).toMatch(
      /^\/owner\/return-to-me\/assets\/art\//,
    );
    expect(
      nestedAssets.every((asset) =>
        asset.url.startsWith("/owner/return-to-me/assets/art/"),
      ),
    ).toBe(true);
  });

  it("supplies complete metadata accepted by engine validation", () => {
    expect(
      artAssets.every(
        (asset) =>
          asset.width > 0 &&
          asset.height > 0 &&
          asset.preloadGroup.length > 0 &&
          Boolean(asset.alt?.trim()),
      ),
    ).toBe(true);

    expect(validateStory(story, { assets: artAssets })).toEqual([]);
  });
});

