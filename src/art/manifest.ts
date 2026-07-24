import type { AssetEntry } from "../engine/types";
import {
  artAssets,
  createArtAssetManifest,
  extraArtAssetIds,
  unmappedStoryAssetIds,
} from "../story/artManifest";

const assetsById = new Map(artAssets.map((asset) => [asset.id, asset]));

export const getAssetEntry = (id: string): AssetEntry | undefined =>
  assetsById.get(id);

export {
  artAssets,
  createArtAssetManifest,
  extraArtAssetIds,
  unmappedStoryAssetIds,
};

