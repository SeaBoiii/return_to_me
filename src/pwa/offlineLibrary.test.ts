/// <reference types="node" />
import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineLibraryManager } from './offlineLibrary';
import { sha256 } from './artCache';
import { type ArtFile, type ArtPack } from './artContent';
import { TestCacheStorage } from './testCache';
import { voiceCacheName } from './cacheNames';
import { STORY_REVISION } from '../story/metadata';

beforeEach(() => { vi.stubGlobal('crypto', webcrypto); });
async function fixture() {
  const body = new TextEncoder().encode('art');
  const files: ArtFile[] = ['a', 'b', 'c'].map((name) => ({ url: `assets/art/${name}.webp`, bytes: 3, sha256: '' }));
  for (const file of files) (file as { sha256: string }).sha256 = await sha256(body.buffer);
  const artwork: ArtPack[] = files.map((file, index) => ({ id: `art-${index}`, chapterId: `chapter-${index}`, title: `Chapter ${index}`, urls: [file.url], expectedBytes: 3, revision: 'test' }));
  const voices = [{ id: 'voice-one', chapterId: 'chapter-0', title: 'Chapter 0', voiceUrls: ['voices/one.mp3'], expectedBytes: 3, contentRevision: STORY_REVISION }];
  return { files, artwork, voices };
}

describe('app-scoped offline library', () => {
  it('shares two transfer slots across artwork/voices and completes without a UI subscriber', async () => {
    const { files, artwork, voices } = await fixture();
    const storage = new TestCacheStorage();
    let active = 0, peak = 0;
    const releases: Array<() => void> = [];
    const fetcher = vi.fn<typeof fetch>(async () => {
      active += 1; peak = Math.max(peak, active);
      await new Promise<void>((resolve) => releases.push(resolve));
      active -= 1;
      return new Response('art', { headers: { 'content-length': '3' } });
    });
    const manager = new OfflineLibraryManager({ storage: storage.storage, fetcher, basePath: '/story/', origin: 'https://example.test', artFiles: files, artPacks: artwork, voicePacks: voices });
    const unsubscribe = manager.subscribe(vi.fn());
    const jobs = manager.packs.map((pack) => manager.download(pack.id));
    unsubscribe();
    await vi.waitFor(() => expect(releases.length).toBe(2));
    releases.splice(0).forEach((release) => release());
    await vi.waitFor(() => expect(releases.length).toBe(2));
    releases.splice(0).forEach((release) => release());
    await Promise.all(jobs);
    expect(peak).toBe(2);
    expect([...manager.snapshot().values()].every((status) => status.state === 'ready')).toBe(true);
  });

  it('resumes partial artwork after cancellation and does not refetch completed files', async () => {
    const { files } = await fixture();
    const storage = new TestCacheStorage();
    const pack: ArtPack = { id: 'art-all', chapterId: 'chapter', title: 'Chapter', urls: files.map((file) => file.url), expectedBytes: 9, revision: 'test' };
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response('art')));
    const manager = new OfflineLibraryManager({ storage: storage.storage, fetcher, basePath: '/story/', origin: 'https://example.test', artFiles: files, artPacks: [pack], voicePacks: [] });
    const stop = manager.subscribe(() => { if (manager.snapshot().get(pack.id)?.cachedFiles === 1) manager.cancel(pack.id); });
    await manager.download(pack.id);
    stop();
    expect(manager.snapshot().get(pack.id)?.state).toBe('partial');
    expect(fetcher).toHaveBeenCalledTimes(1);
    await manager.download(pack.id);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(manager.snapshot().get(pack.id)?.state).toBe('ready');
  });

  it('keeps old voice downloads and reports their availability without reading audio bodies', async () => {
    const { files, artwork, voices } = await fixture();
    const storage = new TestCacheStorage();
    const voiceCache = await storage.open(voiceCacheName(STORY_REVISION));
    await voiceCache.put('https://example.test/story/voices/one.mp3', new Response('art', { headers: { 'content-length': '3' } }));
    const fetcher = vi.fn<typeof fetch>();
    const manager = new OfflineLibraryManager({ storage: storage.storage, fetcher, basePath: '/story/', origin: 'https://example.test', artFiles: files, artPacks: artwork, voicePacks: voices });
    const read = vi.spyOn(Response.prototype, 'arrayBuffer');
    await manager.refresh();
    expect(manager.snapshot().get('voice-one')?.state).toBe('ready');
    expect(read).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
    read.mockRestore();
  });

  it.each(['art', 'voice'] as const)('reports %s removal storage failures without rejecting and allows removal retry', async (kind) => {
    const { files, artwork, voices } = await fixture();
    const storage = new TestCacheStorage();
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response('art')));
    const manager = new OfflineLibraryManager({ storage: storage.storage, fetcher, basePath: '/story/', origin: 'https://example.test', artFiles: files, artPacks: artwork, voicePacks: voices });
    const id = kind === 'art' ? artwork[0]!.id : voices[0]!.id;
    await manager.download(id);
    expect(manager.snapshot().get(id)?.state).toBe('ready');
    const open = vi.spyOn(storage, 'open').mockRejectedValueOnce(new DOMException('Storage access denied.', 'SecurityError'));
    await expect(manager.remove(id)).resolves.toBeUndefined();
    expect(manager.snapshot().get(id)).toMatchObject({ state: 'error', cachedFiles: 1, cachedBytes: 3, error: 'Storage access denied.' });
    open.mockRestore();
    const cache = [...storage.stores.entries()].find(([name]) => kind === 'art' ? name.startsWith('return-to-me-art-retained-') : name === voiceCacheName(STORY_REVISION))![1];
    const remove = vi.spyOn(cache, 'delete').mockRejectedValueOnce(new DOMException('Storage could not be updated.', 'QuotaExceededError'));
    await expect(manager.remove(id)).resolves.toBeUndefined();
    expect(manager.snapshot().get(id)).toMatchObject({ state: 'error', cachedFiles: 1, error: 'Storage could not be updated.' });
    remove.mockRestore();
    await manager.remove(id);
    expect(manager.snapshot().get(id)).toMatchObject({ state: 'not-downloaded', cachedFiles: 0 });
  });

  it.each(['art', 'voice'] as const)('reports %s verification storage failures without an unhandled rejection', async (kind) => {
    const { files, artwork, voices } = await fixture();
    const storage = new TestCacheStorage();
    const manager = new OfflineLibraryManager({ storage: storage.storage, fetcher: vi.fn<typeof fetch>(), basePath: '/story/', origin: 'https://example.test', artFiles: files, artPacks: artwork, voicePacks: voices });
    const id = kind === 'art' ? artwork[0]!.id : voices[0]!.id;
    vi.spyOn(storage, 'open').mockRejectedValueOnce(new DOMException('Storage access denied.', 'SecurityError'));
    await expect(manager.verify(id)).resolves.toBeUndefined();
    expect(manager.snapshot().get(id)).toMatchObject({ state: 'error', error: 'Storage access denied.' });
  });
});
