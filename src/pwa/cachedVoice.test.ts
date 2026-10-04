import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canResolveCachedVoice, resolveCachedVoice } from './cachedVoice';
import { VOICE_CACHE_NAME } from './cacheNames';
import { TestCacheStorage } from './testCache';

const NativeURL = URL;
const makeUrl = vi.fn(() => 'blob:cached-voice');
const revoke = vi.fn();
let storage: TestCacheStorage;
beforeEach(() => {
  storage = new TestCacheStorage();
  makeUrl.mockClear(); revoke.mockClear();
  vi.stubGlobal('caches', storage.storage);
  vi.stubGlobal('URL', class extends NativeURL { static createObjectURL = makeUrl; static revokeObjectURL = revoke; });
});
afterEach(() => vi.unstubAllGlobals());

describe('cached voice sources', () => {
  it('uses a complete cached audio response and revokes its temporary URL once', async () => {
    const url = 'https://example.test/story/voices/line.mp3';
    await (await storage.open(VOICE_CACHE_NAME)).put(url, new Response('audio', { headers: { 'content-type': 'audio/mpeg' } }));
    expect(canResolveCachedVoice()).toBe(true);
    const result = await resolveCachedVoice(url);
    expect(result.url).toBe('blob:cached-voice');
    expect(makeUrl).toHaveBeenCalledOnce();
    result.release?.(); result.release?.();
    expect(revoke).toHaveBeenCalledOnce();
  });
  it('leaves missing, partial and non-audio responses on their original URL', async () => {
    const cache = await storage.open(VOICE_CACHE_NAME);
    const url = 'https://example.test/story/voices/line.mp3';
    expect(await resolveCachedVoice(url)).toEqual({ url });
    await cache.put(url, new Response('partial', { status: 206, headers: { 'content-type': 'audio/mpeg' } }));
    expect(await resolveCachedVoice(url)).toEqual({ url });
    await cache.put(url, new Response('<html>', { headers: { 'content-type': 'text/html' } }));
    expect(await resolveCachedVoice(url)).toEqual({ url });
    expect(makeUrl).not.toHaveBeenCalled();
  });
  it('fails open to the original URL when browser storage is unavailable', async () => {
    vi.spyOn(storage, 'open').mockRejectedValue(new DOMException('Denied', 'SecurityError'));
    expect(await resolveCachedVoice('voices/line.mp3')).toEqual({ url: 'voices/line.mp3' });
  });
});
