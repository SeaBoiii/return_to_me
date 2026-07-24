import { describe, expect, it, vi } from 'vitest';

import { voiceCacheName } from './cacheNames';
import {
  OfflinePackCancelledError,
  OfflinePackManager,
  type OfflinePackManifest,
} from './offlinePacks';

function requestUrl(request: RequestInfo | URL): string {
  if (typeof request === 'string') {
    return request;
  }
  if (request instanceof URL) {
    return request.href;
  }
  return request.url;
}

class MemoryCache {
  readonly entries = new Map<string, Response>();

  match(request: RequestInfo | URL): Promise<Response | undefined> {
    return Promise.resolve(this.entries.get(requestUrl(request))?.clone());
  }

  put(request: RequestInfo | URL, response: Response): Promise<void> {
    this.entries.set(requestUrl(request), response.clone());
    return Promise.resolve();
  }

  delete(request: RequestInfo | URL): Promise<boolean> {
    return Promise.resolve(this.entries.delete(requestUrl(request)));
  }
}

class MemoryCacheStorage {
  readonly caches = new Map<string, MemoryCache>();

  open(cacheName: string): Promise<Cache> {
    let cache = this.caches.get(cacheName);
    if (!cache) {
      cache = new MemoryCache();
      this.caches.set(cacheName, cache);
    }
    return Promise.resolve(cache as unknown as Cache);
  }

  keys(): Promise<string[]> {
    return Promise.resolve([...this.caches.keys()]);
  }

  delete(cacheName: string): Promise<boolean> {
    return Promise.resolve(this.caches.delete(cacheName));
  }
}

const chapterOne: OfflinePackManifest = {
  id: 'chapter-one',
  chapterId: 'chapter-1',
  title: 'The Wrong Message',
  contentRevision: 'school-years-1.0.0',
  expectedBytes: 6,
  voiceUrls: [
    'voices/chapter-1/line-001.mp3',
    '/voices/chapter-1/line-002.mp3',
  ],
};

function successfulResponse(bytes = 3): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'content-length': String(bytes),
      'content-type': 'audio/mpeg',
    },
  });
}

function managerWith(
  storage: MemoryCacheStorage,
  fetcher: typeof fetch,
): OfflinePackManager {
  return new OfflinePackManager({
    cacheStorage: storage as unknown as CacheStorage,
    fetcher,
    basePath: '/return-to-me/',
    origin: 'https://example.test',
  });
}

describe('OfflinePackManager', () => {
  it('downloads and verifies a complete pack beneath the Pages base path', async () => {
    const storage = new MemoryCacheStorage();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(successfulResponse()));
    const progress = vi.fn();
    const manager = managerWith(storage, fetcher);

    const result = await manager.download(chapterOne, { onProgress: progress });

    expect(result).toMatchObject({
      state: 'ready',
      cachedFiles: 2,
      totalFiles: 2,
      cachedBytes: 6,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(
      requestUrl(fetcher.mock.calls[0]?.[0] as Request),
    ).toBe(
      'https://example.test/return-to-me/voices/chapter-1/line-001.mp3',
    );
    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'downloading', cachedFiles: 1 }),
    );
    await expect(manager.verify(chapterOne)).resolves.toMatchObject({
      state: 'ready',
    });
  });

  it('requires exact cached bytes and replaces an invalid complete pack on retry', async () => {
    const storage = new MemoryCacheStorage();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(new Uint8Array(2), {
          status: 200,
          headers: { 'content-length': '3' },
        }),
      )
      .mockResolvedValueOnce(successfulResponse())
      .mockResolvedValueOnce(successfulResponse())
      .mockResolvedValueOnce(successfulResponse());
    const manager = managerWith(storage, fetcher);

    const invalid = await manager.download(chapterOne);
    expect(invalid).toMatchObject({
      state: 'error',
      cachedFiles: 2,
      cachedBytes: 5,
      expectedBytes: 6,
    });
    expect(invalid.error).toMatch(
      /failed verification: cached 5 bytes, expected 6.*Retry.*remove/i,
    );
    await expect(manager.verify(chapterOne)).resolves.toMatchObject({
      state: 'error',
      cachedFiles: 2,
      cachedBytes: 5,
    });

    await expect(manager.retry(chapterOne)).resolves.toMatchObject({
      state: 'ready',
      cachedFiles: 2,
      cachedBytes: 6,
    });
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('keeps partial data and resumes it on retry', async () => {
    const storage = new MemoryCacheStorage();
    const firstFetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(successfulResponse())
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    const manager = managerWith(storage, firstFetcher);

    await expect(manager.download(chapterOne)).rejects.toThrow('(503)');
    await expect(manager.status(chapterOne)).resolves.toMatchObject({
      state: 'partial',
      cachedFiles: 1,
    });

    const retryFetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(successfulResponse());
    const retryManager = managerWith(storage, retryFetcher);
    await expect(retryManager.retry(chapterOne)).resolves.toMatchObject({
      state: 'ready',
      cachedFiles: 2,
    });
    expect(retryFetcher).toHaveBeenCalledOnce();
  });

  it('cancels an in-flight pack without discarding resumable files', async () => {
    const storage = new MemoryCacheStorage();
    const fetcher = vi.fn<typeof fetch>(
      (_request, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () =>
              reject(
                new DOMException('The operation was aborted.', 'AbortError'),
              ),
            { once: true },
          );
        }),
    );
    const manager = managerWith(storage, fetcher);
    const operation = manager.download(chapterOne);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());

    expect(manager.cancel(chapterOne.id)).toBe(true);
    await expect(operation).rejects.toBeInstanceOf(
      OfflinePackCancelledError,
    );
    await expect(manager.status(chapterOne)).resolves.toMatchObject({
      state: 'not-downloaded',
    });
  });

  it('removes only the requested pack from the shared revision cache', async () => {
    const storage = new MemoryCacheStorage();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(successfulResponse()));
    const manager = managerWith(storage, fetcher);
    const chapterTwo: OfflinePackManifest = {
      ...chapterOne,
      id: 'chapter-two',
      chapterId: 'chapter-2',
      title: 'A Different Classroom',
      voiceUrls: ['voices/chapter-2/line-001.mp3'],
      expectedBytes: 3,
    };
    await manager.download(chapterOne);
    await manager.download(chapterTwo);

    await expect(manager.remove(chapterOne)).resolves.toMatchObject({
      state: 'not-downloaded',
    });
    await expect(manager.status(chapterTwo)).resolves.toMatchObject({
      state: 'ready',
    });
  });

  it('fully removes a partial pack without disturbing another pack', async () => {
    const storage = new MemoryCacheStorage();
    const chapterTwo: OfflinePackManifest = {
      ...chapterOne,
      id: 'chapter-two',
      chapterId: 'chapter-2',
      title: 'A Different Classroom',
      voiceUrls: ['voices/chapter-2/line-001.mp3'],
      expectedBytes: 3,
    };
    const chapterTwoManager = managerWith(
      storage,
      vi.fn<typeof fetch>().mockResolvedValue(successfulResponse()),
    );
    await chapterTwoManager.download(chapterTwo);

    const partialManager = managerWith(
      storage,
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(successfulResponse())
        .mockResolvedValueOnce(new Response(null, { status: 503 })),
    );
    await expect(partialManager.download(chapterOne)).rejects.toThrow('(503)');
    await expect(partialManager.status(chapterOne)).resolves.toMatchObject({
      state: 'partial',
      cachedFiles: 1,
    });

    await expect(partialManager.remove(chapterOne)).resolves.toMatchObject({
      state: 'not-downloaded',
      cachedFiles: 0,
      cachedBytes: 0,
    });
    await expect(partialManager.status(chapterOne)).resolves.toMatchObject({
      state: 'not-downloaded',
    });
    await expect(partialManager.status(chapterTwo)).resolves.toMatchObject({
      state: 'ready',
      cachedFiles: 1,
      cachedBytes: 3,
    });
  });

  it('cleans caches belonging to obsolete content revisions', async () => {
    const storage = new MemoryCacheStorage();
    await storage.open(voiceCacheName('old-revision'));
    await storage.open(voiceCacheName('school-years-1.0.0'));
    const manager = managerWith(storage, vi.fn<typeof fetch>());

    await expect(
      manager.cleanupObsoleteCaches('school-years-1.0.0'),
    ).resolves.toBe(1);
    await expect(storage.keys()).resolves.toEqual([
      voiceCacheName('school-years-1.0.0'),
    ]);
  });
});
