import { offlinePackManifests } from '../voices';
import type { OfflinePackManifest } from '../engine/types';
import { artFiles, artPacks, type ArtFile, type ArtPack } from './artContent';
import { ArtCache } from './artCache';
import { OfflinePackCancelledError, OfflinePackManager, type OfflinePackStatus } from './offlinePacks';
import { TransferQueue } from './transferQueue';

export interface LibraryPack {
  readonly id: string; readonly chapterId: string; readonly title: string;
  readonly kind: 'art' | 'voice'; readonly expectedBytes: number; readonly totalFiles: number;
}
export interface LibraryStatus extends Omit<OfflinePackStatus, 'state'> {
  state: OfflinePackStatus['state'] | 'cached';
  remainingBytes: number;
  retainedFiles?: number;
}
interface LibraryOptions {
  basePath?: string; origin?: string; storage?: CacheStorage; fetcher?: typeof fetch;
  artFiles?: readonly ArtFile[]; artPacks?: readonly ArtPack[]; voicePacks?: readonly OfflinePackManifest[];
}
const aborted = (error: unknown) => error instanceof OfflinePackCancelledError || ((error instanceof Error || error instanceof DOMException) && error.name === 'AbortError');

/** App-scoped service: opening/closing a modal never owns download lifetime. */
export class OfflineLibraryManager {
  readonly packs: readonly LibraryPack[];
  readonly supported: boolean;
  private readonly art: ArtCache | undefined;
  private readonly voices: OfflinePackManager;
  private readonly artwork: readonly ArtPack[];
  private readonly voicePacks: readonly OfflinePackManifest[];
  private readonly queue = new TransferQueue(2);
  private readonly statuses = new Map<string, LibraryStatus>();
  private readonly listeners = new Set<() => void>();
  private readonly active = new Map<string, Promise<void>>();
  private readonly controllers = new Map<string, AbortController>();
  private readonly artTransfers = new Map<string, Promise<void>>();

  constructor(options: LibraryOptions = {}) {
    const storage = options.storage ?? ('caches' in globalThis ? caches : undefined);
    const fetcher = options.fetcher ?? ('fetch' in globalThis ? fetch.bind(globalThis) : undefined);
    const basePath = options.basePath ?? import.meta.env.BASE_URL;
    const origin = options.origin ?? globalThis.location?.origin ?? 'http://localhost';
    this.supported = Boolean(storage && fetcher);
    this.artwork = options.artPacks ?? artPacks;
    this.voicePacks = options.voicePacks ?? offlinePackManifests;
    this.art = storage && fetcher ? new ArtCache({ basePath, origin, storage, fetcher, files: options.artFiles ?? artFiles, packs: this.artwork }) : undefined;
    const queuedFetch: typeof fetch = async (request, init) => this.queue.run(async () => {
      const response = await fetcher!(request, init);
      const body = await response.arrayBuffer();
      return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    }, init?.signal ?? undefined);
    this.voices = new OfflinePackManager({ basePath, origin, ...(storage ? { cacheStorage: storage } : {}), ...(fetcher ? { fetcher: queuedFetch } : {}) });
    this.packs = [
      ...this.artwork.map((pack) => ({ id: pack.id, chapterId: pack.chapterId, title: pack.title, kind: 'art' as const, expectedBytes: pack.expectedBytes, totalFiles: pack.urls.length })),
      ...this.voicePacks.map((pack) => ({ id: pack.id, chapterId: pack.chapterId, title: pack.title, kind: 'voice' as const, expectedBytes: pack.expectedBytes, totalFiles: pack.voiceUrls.length })),
    ];
    for (const pack of this.packs) this.statuses.set(pack.id, { packId: pack.id, state: this.supported ? 'checking' : 'unsupported', cachedFiles: 0, totalFiles: pack.totalFiles, cachedBytes: 0, expectedBytes: pack.expectedBytes, remainingBytes: pack.expectedBytes });
    this.voices.subscribe((status) => this.publish({ ...status, remainingBytes: Math.max(0, status.expectedBytes - status.cachedBytes) }));
    if ('navigator' in globalThis && 'serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (typeof event.data === 'object' && event.data !== null && 'type' in event.data && event.data.type === 'ART_CACHE_CHANGED') void this.refresh();
    });
  }

  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  snapshot(): ReadonlyMap<string, LibraryStatus> { return new Map(this.statuses); }
  private publish(status: LibraryStatus): void { this.statuses.set(status.packId, status); this.listeners.forEach((listener) => listener()); }

  async refresh(): Promise<void> {
    await Promise.all(this.packs.filter((pack) => !this.active.has(pack.id)).map((pack) => this.refreshPack(pack.id)));
  }
  private async refreshPack(id: string, verify = false): Promise<void> {
    try {
      const voice = this.voicePacks.find((pack) => pack.id === id);
      if (voice) { await (verify ? this.voices.verify(voice) : this.voices.status(voice)); return; }
      const pack = this.artwork.find((entry) => entry.id === id);
      if (!pack || !this.art) return;
      const inspection = await this.art.inspect(pack, verify);
      this.publish({ packId: id, state: inspection.retainedFiles === pack.urls.length ? 'ready' : inspection.cachedFiles === pack.urls.length ? 'cached' : inspection.cachedFiles > 0 ? 'partial' : 'not-downloaded',
        totalFiles: pack.urls.length, cachedFiles: inspection.cachedFiles, cachedBytes: inspection.cachedBytes,
        retainedFiles: inspection.retainedFiles, expectedBytes: pack.expectedBytes, remainingBytes: Math.max(0, pack.expectedBytes - inspection.cachedBytes) });
    } catch (error) { this.fail(id, error); }
  }
  private fail(id: string, error: unknown): void {
    const status = this.statuses.get(id);
    if (status) this.publish({ ...status, state: 'error', error: error instanceof Error || error instanceof DOMException ? error.message : 'The download could not finish.' });
  }

  download(id: string): Promise<void> {
    const current = this.active.get(id);
    if (current) return current;
    const controller = new AbortController();
    this.controllers.set(id, controller);
    const task = this.performDownload(id, controller.signal).catch(async (error: unknown) => {
      if (aborted(error)) await this.refreshPack(id); else this.fail(id, error);
    }).finally(() => { this.active.delete(id); this.controllers.delete(id); });
    this.active.set(id, task);
    return task;
  }
  private async performDownload(id: string, signal: AbortSignal): Promise<void> {
    const voice = this.voicePacks.find((pack) => pack.id === id);
    if (voice) { await this.voices.retry(voice, { signal }); return; }
    const pack = this.artwork.find((entry) => entry.id === id);
    if (!pack || !this.art) throw new Error('Artwork downloads are unavailable in this browser.');
    await this.art.claim(pack);
    for (const source of pack.urls) {
      if (signal.aborted) throw new DOMException('Download cancelled.', 'AbortError');
      const current = this.statuses.get(id)!;
      this.publish({ ...current, state: 'downloading' });
      const file = this.art.files.find((entry) => entry.url === source)!;
      let transfer = this.artTransfers.get(file.url);
      if (!transfer) {
        transfer = this.queue.run(() => this.art!.retain(file, signal), signal).finally(() => { this.artTransfers.delete(file.url); });
        this.artTransfers.set(file.url, transfer);
      }
      try { await transfer; }
      catch (error) {
        if (aborted(error) && !signal.aborted) await this.queue.run(() => this.art!.retain(file, signal), signal);
        else throw error;
      }
      const progress = await this.art.inspect(pack);
      this.publish({ ...current, state: 'downloading', cachedFiles: progress.cachedFiles, cachedBytes: progress.cachedBytes, retainedFiles: progress.retainedFiles, remainingBytes: Math.max(0, pack.expectedBytes - progress.cachedBytes) });
    }
    await this.refreshPack(id);
  }

  cancel(id: string): void { this.controllers.get(id)?.abort(); this.voices.cancel(id); }
  async verify(id: string): Promise<void> { if (!this.active.has(id)) await this.refreshPack(id, true); }
  async remove(id: string): Promise<void> {
    try {
      this.cancel(id);
      await this.active.get(id);
      const voice = this.voicePacks.find((pack) => pack.id === id);
      if (voice) { await this.voices.remove(voice); return; }
      const pack = this.artwork.find((entry) => entry.id === id);
      if (pack && this.art) await this.art.remove(pack);
      await this.refresh();
    } catch (error) { this.fail(id, error); }
  }
}

let library: OfflineLibraryManager | undefined;
export function getOfflineLibraryManager(): OfflineLibraryManager {
  library ??= new OfflineLibraryManager();
  return library;
}
