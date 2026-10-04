/// <reference types="node" />
import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArtCache, artCacheNames, sha256 } from './artCache';
import { type ArtFile, type ArtPack } from './artContent';
import { TestCacheStorage } from './testCache';

beforeEach(() => { vi.stubGlobal('crypto', webcrypto); });
const origin = 'https://example.test';
const basePath = '/story/';
async function file(name: string, text: string): Promise<ArtFile> {
  const bytes = new TextEncoder().encode(text);
  return { url: `assets/art/${name}.webp`, bytes: bytes.length, sha256: await sha256(bytes.buffer) };
}
function pack(id: string, files: readonly ArtFile[]): ArtPack {
  return { id, chapterId: id, title: id, urls: files.map((entry) => entry.url), expectedBytes: files.reduce((total, entry) => total + entry.bytes, 0), revision: id };
}

describe('versioned artwork storage', () => {
  it('invalidates same-path replacement bytes and leaves another installation untouched', async () => {
    const storage = new TestCacheStorage();
    const old = await file('scene', 'old');
    const current = await file('scene', 'new');
    const first = new ArtCache({ storage: storage.storage, basePath, origin, files: [old], packs: [], fetcher: vi.fn(() => Promise.resolve(new Response('old'))) });
    await first.fetchReading(old, new Request(first.url(old)));
    const fetcher = vi.fn(() => Promise.resolve(new Response('new')));
    const second = new ArtCache({ storage: storage.storage, basePath, origin, files: [current], packs: [], fetcher });
    expect(second.url(current)).not.toBe(first.url(old));
    expect(await (await second.fetchReading(current, new Request(second.url(current)))).text()).toBe('new');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(artCacheNames('/elsewhere/')).not.toEqual(second.names);
  });

  it('adopts verified legacy artwork without network, prunes obsolete bytes, and preserves other scopes', async () => {
    const storage = new TestCacheStorage();
    const good = await file('good', 'right');
    const bad = await file('bad', 'new');
    const chapter = pack('art-one', [good, bad]);
    const legacy = await storage.open(`workbox-precache-v2-${origin}${basePath}`);
    await legacy.put(`${origin}${basePath}${good.url}`, new Response('right'));
    await legacy.put(`${origin}${basePath}${bad.url}`, new Response('old'));
    const other = await storage.open(`workbox-precache-v2-${origin}/another/`);
    await other.put(`${origin}/another/${good.url}`, new Response('right'));
    const fetcher = vi.fn<typeof fetch>();
    const cache = new ArtCache({ storage: storage.storage, basePath, origin, files: [good, bad], packs: [chapter], fetcher });
    expect(await cache.migrateLegacy()).toMatchObject({ copied: 1, remaining: 0, obsolete: 1 });
    expect(fetcher).not.toHaveBeenCalled();
    expect(await legacy.match(`${origin}${basePath}${good.url}`)).toBeUndefined();
    expect(await legacy.match(`${origin}${basePath}${bad.url}`)).toBeUndefined();
    expect(await other.match(`${origin}/another/${good.url}`)).toBeDefined();
    expect(await cache.inspect(chapter)).toMatchObject({ cachedFiles: 1, retainedFiles: 1 });
    expect(await cache.migrateLegacy()).toMatchObject({ copied: 0, remaining: 0 });
  });

  it('does not delete the legacy source if storing its replacement fails', async () => {
    const storage = new TestCacheStorage();
    const image = await file('scene', 'safe');
    const legacy = await storage.open(`workbox-precache-v2-${origin}${basePath}`);
    const oldUrl = `${origin}${basePath}${image.url}`;
    await legacy.put(oldUrl, new Response('safe'));
    await legacy.put(`${origin}${basePath}assets/art/unlisted.webp`, new Response('obsolete'));
    const cache = new ArtCache({ storage: storage.storage, basePath, origin, files: [image], packs: [] });
    const retained = await storage.open(cache.names.retained);
    const put = vi.spyOn(retained, 'put').mockRejectedValue(new DOMException('Full', 'QuotaExceededError'));
    expect(await cache.migrateLegacy()).toMatchObject({ copied: 0, remaining: 2, errors: ['Full'] });
    expect(await legacy.match(oldUrl)).toBeDefined();
    put.mockRestore();
    expect(await cache.migrateLegacy()).toMatchObject({ copied: 1, remaining: 0, obsolete: 1 });
  });

  it('enforces the reading budget even when recency metadata cannot be saved', async () => {
    const storage = new TestCacheStorage();
    const a = await file('a', 'aaa'), b = await file('b', 'bbb');
    const cache = new ArtCache({ storage: storage.storage, basePath, origin, files: [a, b], packs: [], readingLimit: 3, fetcher: vi.fn((request) => Promise.resolve(new Response(String(request instanceof Request ? request.url : request).includes('/a.webp') ? 'aaa' : 'bbb'))) });
    vi.spyOn(await storage.open(cache.names.metadata), 'put').mockRejectedValue(new DOMException('Full', 'QuotaExceededError'));
    await cache.fetchReading(a, new Request(cache.url(a)));
    await cache.fetchReading(b, new Request(cache.url(b)));
    expect((await (await storage.open(cache.names.reading)).keys()).map((key) => key.url)).toEqual([cache.url(b)]);
  });

  it('serializes a shared-file removal against another manager claiming and retaining it', async () => {
    const storage = new TestCacheStorage();
    const image = await file('shared', 'same');
    const first = pack('first', [image]), second = pack('second', [image]);
    const options = { storage: storage.storage, basePath, origin, files: [image], packs: [first, second], fetcher: vi.fn(() => Promise.resolve(new Response('same'))) };
    const a = new ArtCache(options), b = new ArtCache(options);
    await a.claim(first); await a.retain(image);
    const retained = await storage.open(a.names.retained);
    const originalDelete = retained.delete.bind(retained);
    let entered!: () => void, release!: () => void;
    const started = new Promise<void>((resolve) => { entered = resolve; });
    const gate = new Promise<void>((resolve) => { release = resolve; });
    vi.spyOn(retained, 'delete').mockImplementation(async (request, options) => { entered(); await gate; return originalDelete(request, options); });
    const remove = a.remove(first);
    await started;
    let claimed = false;
    const keep = (async () => { await b.claim(second); claimed = true; await b.retain(image); })();
    await Promise.resolve();
    expect(claimed).toBe(false);
    release();
    await Promise.all([remove, keep]);
    expect(await b.inspect(second)).toMatchObject({ cachedFiles: 1, retainedFiles: 1 });
  });

  it('removes obsolete retained hashes when their canonical file has no other owner', async () => {
    const storage = new TestCacheStorage();
    const before = await file('same-path', 'old'), after = await file('same-path', 'new');
    const chapter = pack('chapter', [before]);
    const oldCache = new ArtCache({ storage: storage.storage, basePath, origin, files: [before], packs: [chapter], fetcher: vi.fn(() => Promise.resolve(new Response('old'))) });
    await oldCache.claim(chapter); await oldCache.retain(before);
    const current = new ArtCache({ storage: storage.storage, basePath, origin, files: [after], packs: [chapter], fetcher: vi.fn(() => Promise.resolve(new Response('new'))) });
    await current.claim(chapter); await current.retain(after);
    expect(await (await storage.open(current.names.retained)).keys()).toHaveLength(2);
    await current.remove(chapter);
    expect(await (await storage.open(current.names.retained)).keys()).toHaveLength(0);
  });

  it('protects retained/shared assets and the active scene when trimming/removing', async () => {
    const storage = new TestCacheStorage();
    const a = await file('a', 'aaa'), b = await file('b', 'bbb'), c = await file('c', 'ccc');
    const first = pack('first', [a, b]), second = pack('second', [b]);
    const cache = new ArtCache({ storage: storage.storage, basePath, origin, files: [a, b, c], packs: [first, second], readingLimit: 3, fetcher: vi.fn((request) => Promise.resolve(new Response(String(request instanceof Request ? request.url : request).includes('/a.webp') ? 'aaa' : String(request instanceof Request ? request.url : request).includes('/b.webp') ? 'bbb' : 'ccc'))) });
    await cache.claim(first); await cache.claim(second);
    await cache.retain(a); await cache.retain(b);
    await cache.remove(first);
    expect(await cache.inspect(second)).toMatchObject({ retainedFiles: 1 });
    cache.protect([cache.url(a)]);
    await cache.fetchReading(a, new Request(cache.url(a)));
    await cache.fetchReading(c, new Request(cache.url(c)));
    expect(await (await storage.open(cache.names.reading)).match(cache.url(a))).toBeDefined();
    expect(await (await storage.open(cache.names.reading)).match(cache.url(c))).toBeUndefined();
    expect(await cache.inspect(second)).toMatchObject({ retainedFiles: 1 });
  });
});
