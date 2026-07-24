import { resolveAppUrl } from './basePath';
import { VOICE_CACHE_PREFIX, voiceCacheName } from './cacheNames';
import type { OfflinePackManifest } from '../engine/types';

export type { OfflinePackManifest } from '../engine/types';

export type OfflinePackState =
  | 'not-downloaded'
  | 'checking'
  | 'downloading'
  | 'partial'
  | 'ready'
  | 'error'
  | 'unsupported';

export interface OfflinePackStatus {
  packId: string;
  state: OfflinePackState;
  cachedFiles: number;
  totalFiles: number;
  cachedBytes: number;
  expectedBytes: number;
  error?: string;
}

export interface OfflinePackProgress extends OfflinePackStatus {
  currentUrl?: string;
}

export interface OfflinePackDownloadOptions {
  signal?: AbortSignal;
  onProgress?: OfflinePackProgressListener;
}

export type OfflinePackProgressListener = (
  progress: OfflinePackProgress,
) => void;

export interface OfflinePackManagerOptions {
  basePath?: string;
  origin?: string;
  cacheStorage?: CacheStorage;
  fetcher?: typeof fetch;
}

export class OfflinePackCancelledError extends Error {
  constructor(packId: string) {
    super(`Download of offline pack "${packId}" was cancelled.`);
    this.name = 'OfflinePackCancelledError';
  }
}

interface CacheInspection {
  cachedFiles: number;
  cachedBytes: number;
  missingUrls: string[];
}

function validateManifest(manifest: OfflinePackManifest): void {
  if (!manifest.id.trim()) {
    throw new Error('Offline pack id must not be empty.');
  }
  if (!manifest.title.trim()) {
    throw new Error(`Offline pack "${manifest.id}" must have a title.`);
  }
  if (!manifest.contentRevision.trim()) {
    throw new Error(
      `Offline pack "${manifest.id}" must have a content revision.`,
    );
  }
  if (
    !Number.isSafeInteger(manifest.expectedBytes) ||
    manifest.expectedBytes < 0
  ) {
    throw new Error(
      `Offline pack "${manifest.id}" expectedBytes must be a non-negative integer.`,
    );
  }
  if (manifest.voiceUrls.length === 0) {
    throw new Error(`Offline pack "${manifest.id}" must contain at least one URL.`);
  }
  if (new Set(manifest.voiceUrls).size !== manifest.voiceUrls.length) {
    throw new Error(`Offline pack "${manifest.id}" contains duplicate URLs.`);
  }
}

async function responseSize(response: Response): Promise<number> {
  return (await response.arrayBuffer()).byteLength;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === 'AbortError'
      : error instanceof Error && error.name === 'AbortError'
  );
}

function normalizedError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown download error.';
}

function combineAbortSignals(
  internal: AbortSignal,
  external?: AbortSignal,
): AbortSignal {
  if (!external) {
    return internal;
  }

  if ('any' in AbortSignal) {
    return AbortSignal.any([internal, external]);
  }

  const combined = new AbortController();
  const abort = () => combined.abort();
  internal.addEventListener('abort', abort, { once: true });
  external.addEventListener('abort', abort, { once: true });
  if (internal.aborted || external.aborted) {
    combined.abort();
  }
  return combined.signal;
}

/**
 * Manages optional, chapter-sized voice downloads. Partial downloads are kept
 * so retry can resume, while removal only evicts URLs belonging to that pack.
 */
export class OfflinePackManager {
  private readonly cacheStorage: CacheStorage | undefined;
  private readonly fetcher: typeof fetch | undefined;
  private readonly basePath: string | undefined;
  private readonly origin: string | undefined;
  private readonly listeners = new Set<OfflinePackProgressListener>();
  private readonly controllers = new Map<string, AbortController>();
  private readonly downloads = new Map<
    string,
    Promise<OfflinePackStatus>
  >();
  private readonly errors = new Map<string, string>();

  constructor(options: OfflinePackManagerOptions = {}) {
    this.cacheStorage =
      options.cacheStorage ??
      ('caches' in globalThis ? globalThis.caches : undefined);
    this.fetcher =
      options.fetcher ?? ('fetch' in globalThis ? globalThis.fetch.bind(globalThis) : undefined);
    this.basePath = options.basePath;
    this.origin = options.origin;
  }

  get supported(): boolean {
    return Boolean(this.cacheStorage && this.fetcher);
  }

  subscribe(listener: OfflinePackProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async status(manifest: OfflinePackManifest): Promise<OfflinePackStatus> {
    validateManifest(manifest);
    if (!this.supported) {
      return this.makeStatus(manifest, 'unsupported', {
        cachedFiles: 0,
        cachedBytes: 0,
      });
    }

    this.emit(
      this.makeStatus(manifest, 'checking', {
        cachedFiles: 0,
        cachedBytes: 0,
      }),
    );
    try {
      const inspection = await this.inspect(manifest);
      const state = this.stateFromInspection(manifest, inspection);
      const result = this.makeStatus(manifest, state, inspection);
      this.emit(result);
      return result;
    } catch (error) {
      this.errors.set(manifest.id, normalizedError(error));
      const failed = this.makeStatus(manifest, 'error', {
        cachedFiles: 0,
        cachedBytes: 0,
      });
      this.emit(failed);
      return failed;
    }
  }

  verify(manifest: OfflinePackManifest): Promise<OfflinePackStatus> {
    return this.status(manifest);
  }

  download(
    manifest: OfflinePackManifest,
    options: OfflinePackDownloadOptions = {},
  ): Promise<OfflinePackStatus> {
    validateManifest(manifest);
    if (!this.supported) {
      const unsupported = this.makeStatus(manifest, 'unsupported', {
        cachedFiles: 0,
        cachedBytes: 0,
      });
      this.emit(unsupported, options.onProgress);
      return Promise.resolve(unsupported);
    }

    const existing = this.downloads.get(manifest.id);
    if (existing) {
      return existing;
    }

    const controller = new AbortController();
    this.controllers.set(manifest.id, controller);
    const signal = combineAbortSignals(controller.signal, options.signal);
    const operation = this.performDownload(manifest, signal, options.onProgress)
      .finally(() => {
        this.controllers.delete(manifest.id);
        this.downloads.delete(manifest.id);
      });

    this.downloads.set(manifest.id, operation);
    return operation;
  }

  retry(
    manifest: OfflinePackManifest,
    options: OfflinePackDownloadOptions = {},
  ): Promise<OfflinePackStatus> {
    this.errors.delete(manifest.id);
    return this.download(manifest, options);
  }

  cancel(packId: string): boolean {
    const controller = this.controllers.get(packId);
    if (!controller) {
      return false;
    }

    controller.abort();
    return true;
  }

  async remove(manifest: OfflinePackManifest): Promise<OfflinePackStatus> {
    validateManifest(manifest);
    const activeDownload = this.downloads.get(manifest.id);
    this.cancel(manifest.id);
    if (activeDownload) {
      await activeDownload.catch(() => undefined);
    }
    if (!this.cacheStorage) {
      const unsupported = this.makeStatus(manifest, 'unsupported', {
        cachedFiles: 0,
        cachedBytes: 0,
      });
      this.emit(unsupported);
      return unsupported;
    }

    const cache = await this.cacheStorage.open(
      voiceCacheName(manifest.contentRevision),
    );
    await Promise.all(
      this.resolveUrls(manifest).map((url) => cache.delete(url)),
    );
    this.errors.delete(manifest.id);
    const result = this.makeStatus(manifest, 'not-downloaded', {
      cachedFiles: 0,
      cachedBytes: 0,
    });
    this.emit(result);
    return result;
  }

  async cleanupObsoleteCaches(activeContentRevision: string): Promise<number> {
    const cacheStorage = this.cacheStorage;
    if (!cacheStorage) {
      return 0;
    }

    const activeName = voiceCacheName(activeContentRevision);
    const names = await cacheStorage.keys();
    const obsolete = names.filter(
      (name) => name.startsWith(VOICE_CACHE_PREFIX) && name !== activeName,
    );
    const deleted = await Promise.all(
      obsolete.map((name) => cacheStorage.delete(name)),
    );
    return deleted.filter(Boolean).length;
  }

  private async performDownload(
    manifest: OfflinePackManifest,
    signal: AbortSignal,
    listener?: OfflinePackProgressListener,
  ): Promise<OfflinePackStatus> {
    const cacheStorage = this.cacheStorage;
    const fetcher = this.fetcher;
    if (!cacheStorage || !fetcher) {
      return this.makeStatus(manifest, 'unsupported', {
        cachedFiles: 0,
        cachedBytes: 0,
      });
    }

    let inspection: CacheInspection = {
      cachedFiles: 0,
      cachedBytes: 0,
      missingUrls: this.resolveUrls(manifest),
    };

    try {
      inspection = await this.inspect(manifest);
      if (inspection.missingUrls.length === 0) {
        const state = this.stateFromInspection(manifest, inspection);
        if (state === 'ready') {
          const ready = this.makeStatus(manifest, state, inspection);
          this.emit(ready, listener);
          return ready;
        }

        // Aggregate verification cannot identify which response is corrupt,
        // so retry by replacing only the URLs belonging to this pack.
        const invalid = this.makeStatus(manifest, state, inspection);
        this.emit(invalid, listener);
        const invalidCache = await cacheStorage.open(
          voiceCacheName(manifest.contentRevision),
        );
        const urls = this.resolveUrls(manifest);
        await Promise.all(urls.map((url) => invalidCache.delete(url)));
        inspection = {
          cachedFiles: 0,
          cachedBytes: 0,
          missingUrls: urls,
        };
      }

      const cache = await cacheStorage.open(
        voiceCacheName(manifest.contentRevision),
      );
      let cachedFiles = inspection.cachedFiles;
      let cachedBytes = inspection.cachedBytes;

      for (const url of inspection.missingUrls) {
        if (signal.aborted) {
          throw new OfflinePackCancelledError(manifest.id);
        }

        this.emit(
          this.makeStatus(
            manifest,
            'downloading',
            { cachedFiles, cachedBytes },
            url,
          ),
          listener,
        );

        const request = new Request(url, {
          credentials: 'same-origin',
        });
        const response = await fetcher(request, {
          cache: 'no-store',
          credentials: 'same-origin',
          signal,
        });

        if (!response.ok) {
          throw new Error(
            `Could not download ${new URL(url).pathname} (${response.status}).`,
          );
        }

        const body = await response.arrayBuffer();
        const headers = new Headers(response.headers);
        if (!headers.has('content-length')) {
          headers.set('content-length', String(body.byteLength));
        }
        await cache.put(
          request,
          new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          }),
        );
        cachedFiles += 1;
        cachedBytes += body.byteLength;
        this.emit(
          this.makeStatus(manifest, 'downloading', {
            cachedFiles,
            cachedBytes,
          }),
          listener,
        );
      }

      inspection = await this.inspect(manifest);
      const state = this.stateFromInspection(manifest, inspection);
      const result = this.makeStatus(manifest, state, inspection);
      if (state !== 'error') {
        this.errors.delete(manifest.id);
      }
      this.emit(result, listener);
      return result;
    } catch (error) {
      inspection = await this.inspect(manifest).catch(() => inspection);
      if (signal.aborted || error instanceof OfflinePackCancelledError || isAbortError(error)) {
        const cancelled = this.makeStatus(
          manifest,
          this.stateFromInspection(manifest, inspection),
          inspection,
        );
        this.emit(cancelled, listener);
        throw new OfflinePackCancelledError(manifest.id);
      }

      const message = normalizedError(error);
      this.errors.set(manifest.id, message);
      const failed = this.makeStatus(manifest, 'error', inspection);
      this.emit(failed, listener);
      throw error;
    }
  }

  private async inspect(
    manifest: OfflinePackManifest,
  ): Promise<CacheInspection> {
    const cacheStorage = this.cacheStorage;
    if (!cacheStorage) {
      return {
        cachedFiles: 0,
        cachedBytes: 0,
        missingUrls: this.resolveUrls(manifest),
      };
    }

    const cache = await cacheStorage.open(
      voiceCacheName(manifest.contentRevision),
    );
    const urls = this.resolveUrls(manifest);
    const missingUrls: string[] = [];
    let cachedFiles = 0;
    let cachedBytes = 0;

    // Read one cached body at a time so verification measures real bytes
    // without buffering an entire chapter's voice pack in memory at once.
    for (const url of urls) {
      const response = await cache.match(url);
      if (!response) {
        missingUrls.push(url);
        continue;
      }
      cachedFiles += 1;
      cachedBytes += await responseSize(response);
    }

    return { cachedFiles, cachedBytes, missingUrls };
  }

  private resolveUrls(manifest: OfflinePackManifest): string[] {
    return manifest.voiceUrls.map((url) =>
      resolveAppUrl(url, this.basePath, this.origin),
    );
  }

  private stateFromInspection(
    manifest: OfflinePackManifest,
    inspection: CacheInspection,
  ): OfflinePackState {
    if (inspection.cachedFiles === manifest.voiceUrls.length) {
      if (inspection.cachedBytes === manifest.expectedBytes) {
        return 'ready';
      }
      this.errors.set(
        manifest.id,
        `Voice pack "${manifest.title}" failed verification: cached ${inspection.cachedBytes} bytes, expected ${manifest.expectedBytes}. Retry to replace the cached files, or remove the pack and download it again.`,
      );
      return 'error';
    }
    return inspection.cachedFiles > 0 ? 'partial' : 'not-downloaded';
  }

  private makeStatus(
    manifest: OfflinePackManifest,
    state: OfflinePackState,
    counts: Pick<CacheInspection, 'cachedFiles' | 'cachedBytes'>,
    currentUrl?: string,
  ): OfflinePackProgress {
    const error = state === 'error' ? this.errors.get(manifest.id) : undefined;
    return {
      packId: manifest.id,
      state,
      cachedFiles: counts.cachedFiles,
      totalFiles: manifest.voiceUrls.length,
      cachedBytes: counts.cachedBytes,
      expectedBytes: manifest.expectedBytes,
      ...(error ? { error } : {}),
      ...(currentUrl ? { currentUrl } : {}),
    };
  }

  private emit(
    status: OfflinePackProgress,
    localListener?: OfflinePackProgressListener,
  ): void {
    localListener?.(status);
    this.listeners.forEach((listener) => listener(status));
  }
}
