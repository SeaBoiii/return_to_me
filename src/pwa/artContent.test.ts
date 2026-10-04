import { describe, expect, it } from 'vitest';
import { artFiles, artPacks, getArtUrl } from './artContent';
import { createArtAssetManifest } from '../story/artManifest';
import { story } from '../story';

describe('artwork download inventory', () => {
  it('covers every branch dependency and both orientation variants exactly once per pack', () => {
    const assets = new Map(createArtAssetManifest('/').map((asset) => [asset.id, asset]));
    for (const chapter of story.chapters) {
      const dependencies = new Set<string>();
      for (const node of story.nodes.filter((node) => node.chapterId === chapter.id)) {
        for (const id of [node.stage.backgroundId, ...node.stage.sprites.map((sprite) => sprite.assetId)]) {
          const asset = assets.get(id)!;
          dependencies.add(asset.url.slice(1));
          if (asset.mobile) dependencies.add(asset.mobile.url.slice(1));
        }
      }
      const pack = artPacks.find((pack) => pack.chapterId === chapter.id)!;
      expect([...pack.urls].sort()).toEqual([...dependencies].sort());
      expect(new Set(pack.urls).size).toBe(pack.urls.length);
      expect(pack.expectedBytes).toBe(pack.urls.reduce((total, url) => total + artFiles.find((file) => file.url === url)!.bytes, 0));
    }
  });
  it('keeps nested deployment paths and leaves non-art URLs alone', () => {
    const file = artFiles[0]!;
    expect(getArtUrl(`/nested/story/${file.url}`)).toBe(`/nested/story/${file.url}?art=${file.sha256}`);
    expect(getArtUrl('voices/one.mp3')).toBe('voices/one.mp3');
  });
});
