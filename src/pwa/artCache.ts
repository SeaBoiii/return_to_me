import { artFiles, artPacks, resolvedArtUrl, type ArtFile, type ArtPack } from './artContent';
import { resolveAppUrl } from './basePath';
import { withArtMutation } from './artMutationLock';

export const READING_CACHE_LIMIT = 32 * 1024 * 1024;
const SIZE_HEADER = 'x-return-to-me-bytes';
const HASH_HEADER = 'x-return-to-me-sha256';

export function artCacheNames(basePath: string) {
  const scope = encodeURIComponent(new URL(basePath, 'https://scope.invalid').pathname);
  return {
    reading: `return-to-me-art-reading-v1-${scope}`,
    retained: `return-to-me-art-retained-v1-${scope}`,
    metadata: `return-to-me-art-index-v1-${scope}`,
  };
}

export async function sha256(bytes: ArrayBuffer): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

interface ArtCacheOptions {
  basePath: string; origin: string; storage?: CacheStorage; fetcher?: typeof fetch;
  files?: readonly ArtFile[]; packs?: readonly ArtPack[]; readingLimit?: number;
}
interface PackClaim { urls: readonly string[] }
export interface ArtInspection { cachedFiles: number; cachedBytes: number; retainedFiles: number; missing: readonly ArtFile[] }
export interface ArtMigration { copied: number; remaining: number; errors: readonly string[]; obsolete?: number }

/** Shared implementation for window downloads and the service worker. */
export class ArtCache {
  readonly names: ReturnType<typeof artCacheNames>;
  readonly files: readonly ArtFile[];
  readonly packs: readonly ArtPack[];
  private readonly storage: CacheStorage;
  private readonly fetcher: typeof fetch;
  private readonly basePath: string;
  private readonly origin: string;
  private readonly readingLimit: number;
  private readonly byUrl: ReadonlyMap<string, ArtFile>;
  private protectedUrls = new Set<string>();
  private trimOperation: Promise<void> = Promise.resolve();

  constructor(options: ArtCacheOptions) {
    this.basePath = options.basePath;
    this.origin = options.origin;
    this.storage = options.storage ?? caches;
    this.fetcher = options.fetcher ?? fetch.bind(globalThis);
    this.files = options.files ?? artFiles;
    this.packs = options.packs ?? artPacks;
    this.names = artCacheNames(options.basePath);
    this.readingLimit = options.readingLimit ?? READING_CACHE_LIMIT;
    this.byUrl = new Map(this.files.map((file) => [this.url(file), file]));
  }

  url(file: ArtFile): string { return resolvedArtUrl(file, this.basePath, this.origin); }
  fileForUrl(url: string): ArtFile | undefined { return this.byUrl.get(new URL(url, this.origin).href); }
  protect(urls: readonly string[]): void {
    this.protectedUrls = new Set(urls.map((url) => new URL(url, this.origin).href).filter((url) => this.byUrl.has(url)));
  }
  private metadataUrl(kind: string, id: string): string {
    return resolveAppUrl(`__offline__/${kind}/${encodeURIComponent(id)}`, this.basePath, this.origin);
  }
  private async putRecord(kind: string, id: string, value: unknown): Promise<void> {
    const cache = await this.storage.open(this.names.metadata);
    await cache.put(this.metadataUrl(kind, id), new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } }));
  }
  private async record<T>(kind: string, id: string): Promise<T | undefined> {
    const cache = await this.storage.open(this.names.metadata);
    return (await cache.match(this.metadataUrl(kind, id)))?.json() as Promise<T | undefined> | undefined;
  }
  private async touch(file: ArtFile): Promise<void> { await this.putRecord('used', file.sha256, Date.now()); }
  private async cached(file: ArtFile): Promise<Response | undefined> {
    const url = this.url(file);
    return (await (await this.storage.open(this.names.retained)).match(url))
      ?? (await (await this.storage.open(this.names.reading)).match(url));
  }
  private async checked(response: Response, file: ArtFile): Promise<Response> {
    if (!response.ok || response.status === 206) throw new Error(`Artwork download failed (${response.status}).`);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== file.bytes || await sha256(bytes) !== file.sha256) throw new Error(`Artwork changed during download: ${file.url}. Refresh and try again.`);
    const headers = new Headers(response.headers);
    headers.set(SIZE_HEADER, String(bytes.byteLength));
    headers.set(HASH_HEADER, file.sha256);
    headers.set('content-length', String(bytes.byteLength));
    return new Response(bytes, { status: 200, headers });
  }

  async fetchReading(file: ArtFile, request: Request): Promise<Response> {
    const existing = await this.cached(file).catch(() => undefined);
    if (existing) { await this.touch(file).catch(() => undefined); return existing; }
    // A newly activated worker can still serve an old installation offline while adoption runs.
    try { if (await this.adoptLegacyFile(file)) return (await this.cached(file))!; }
    catch {
      // A full cache can prevent adoption without preventing existing offline reading.
      const legacy = await this.readLegacyFile(file).catch(() => undefined);
      if (legacy) return legacy;
    }
    const response = await this.checked(await this.fetcher(request), file);
    try { await (await this.storage.open(this.names.reading)).put(this.url(file), response.clone()); }
    catch { return response; /* Online reading survives storage exhaustion. */ }
    await this.touch(file).catch(() => undefined);
    // Recency metadata is best-effort; it must never bypass the byte budget.
    await this.trim().catch(() => undefined);
    return response;
  }

  private claimUnlocked(pack: ArtPack): Promise<void> { return this.putRecord('pack', pack.id, { urls: pack.urls } satisfies PackClaim); }
  claim(pack: ArtPack): Promise<void> { return withArtMutation(this.names.retained, () => this.claimUnlocked(pack)); }

  async retain(file: ArtFile, signal?: AbortSignal): Promise<void> {
    const existing = await this.cached(file);
    const response = existing ?? await this.checked(await this.fetcher(this.url(file), {
      credentials: 'same-origin', cache: 'no-store', ...(signal ? { signal } : {}),
    }), file);
    if (signal?.aborted) throw new DOMException('Download cancelled.', 'AbortError');
    await withArtMutation(this.names.retained, async () => {
      if (signal?.aborted) throw new DOMException('Download cancelled.', 'AbortError');
      await (await this.storage.open(this.names.retained)).put(this.url(file), response);
      await (await this.storage.open(this.names.reading)).delete(this.url(file));
    });
  }

  async inspect(pack: ArtPack, verify = false): Promise<ArtInspection> {
    const retained = await this.storage.open(this.names.retained);
    const reading = await this.storage.open(this.names.reading);
    const missing: ArtFile[] = [];
    let cachedFiles = 0, cachedBytes = 0, retainedFiles = 0;
    for (const source of pack.urls) {
      const file = this.files.find((entry) => entry.url === source);
      if (!file) throw new Error(`Unknown artwork ${source}.`);
      const retainedResponse = await retained.match(this.url(file));
      const response = retainedResponse ?? await reading.match(this.url(file));
      if (!response || response.headers.get(HASH_HEADER) !== file.sha256 || Number(response.headers.get(SIZE_HEADER)) !== file.bytes) { missing.push(file); continue; }
      if (verify) {
        try { await this.checked(response, file); }
        catch { await retained.delete(this.url(file)); await reading.delete(this.url(file)); missing.push(file); continue; }
      }
      cachedFiles += 1; cachedBytes += file.bytes;
      if (retainedResponse) retainedFiles += 1;
    }
    return { cachedFiles, cachedBytes, retainedFiles, missing };
  }

  remove(pack: ArtPack): Promise<void> {
    return withArtMutation(this.names.retained, () => this.removeUnlocked(pack));
  }
  private async removeUnlocked(pack: ArtPack): Promise<void> {
    const metadata = await this.storage.open(this.names.metadata);
    await metadata.delete(this.metadataUrl('pack', pack.id));
    const retainedByOthers = new Set<string>();
    for (const other of this.packs) {
      if (other.id === pack.id) continue;
      const claim = await this.record<PackClaim>('pack', other.id);
      for (const url of claim?.urls ?? []) retainedByOthers.add(url);
    }
    const retained = await this.storage.open(this.names.retained);
    const reading = await this.storage.open(this.names.reading);
    for (const source of pack.urls) {
      if (retainedByOthers.has(source)) continue;
      const file = this.files.find((entry) => entry.url === source)!;
      const bareUrl = resolveAppUrl(file.url, this.basePath, this.origin);
      // Release every old content revision of an unclaimed canonical file.
      for (const key of await retained.keys(bareUrl, { ignoreSearch: true })) await retained.delete(key);
      for (const key of await reading.keys(bareUrl, { ignoreSearch: true })) {
        if (!this.protectedUrls.has(key.url)) await reading.delete(key);
      }
    }
  }

  async trim(): Promise<void> {
    this.trimOperation = this.trimOperation.catch(() => undefined).then(async () => {
      const cache = await this.storage.open(this.names.reading);
      const rows = [];
      for (const key of await cache.keys()) {
        const file = this.byUrl.get(key.url);
        if (!file) { await cache.delete(key); continue; }
        rows.push({ file, used: await this.record<number>('used', file.sha256).catch(() => undefined) ?? 0 });
      }
      let bytes = rows.reduce((sum, row) => sum + row.file.bytes, 0);
      for (const { file } of rows.sort((a, b) => a.used - b.used)) {
        if (bytes <= this.readingLimit) break;
        if (this.protectedUrls.has(this.url(file))) continue;
        await cache.delete(this.url(file)); bytes -= file.bytes;
      }
    });
    return this.trimOperation;
  }

  private async legacyCaches(): Promise<string[]> {
    // Workbox cache names include the full worker scope; never adopt another installation.
    const scope = resolveAppUrl('./', this.basePath, this.origin);
    return (await this.storage.keys()).filter((name) => name.includes('workbox-precache') && name.endsWith(scope));
  }

  async adoptLegacyFile(file: ArtFile): Promise<boolean> {
    return withArtMutation(this.names.retained, () => this.adoptLegacyFileUnlocked(file));
  }
  private async adoptLegacyFileUnlocked(file: ArtFile): Promise<boolean> {
    const bareUrl = resolveAppUrl(file.url, this.basePath, this.origin);
    for (const name of await this.legacyCaches()) {
      const cache = await this.storage.open(name);
      const keys = await cache.keys(bareUrl, { ignoreSearch: true });
      for (const key of keys) {
        const old = await cache.match(key);
        if (!old) continue;
        let response: Response;
        try { response = await this.checked(old, file); } catch { continue; }
        // Claim before copying. A crash can leave a partial claim, never a lost file.
        for (const pack of this.packs.filter((pack) => pack.urls.includes(file.url))) await this.claimUnlocked(pack);
        await (await this.storage.open(this.names.retained)).put(this.url(file), response);
        await cache.delete(key);
        return true;
      }
    }
    return false;
  }

  private async readLegacyFile(file: ArtFile): Promise<Response | undefined> {
    const url = resolveAppUrl(file.url, this.basePath, this.origin);
    for (const name of await this.legacyCaches()) {
      const response = await (await this.storage.open(name)).match(url, { ignoreSearch: true });
      if (response) { try { return await this.checked(response, file); } catch { /* Another legacy revision. */ } }
    }
    return undefined;
  }

  async migrateLegacy(): Promise<ArtMigration> {
    if ((await this.legacyCaches()).length === 0) return { copied: 0, remaining: 0, errors: [] };
    let copied = 0;
    const errors: string[] = [];
    for (const file of this.files) {
      try { if (await this.adoptLegacyFile(file)) copied += 1; }
      catch (error) { errors.push(error instanceof Error || error instanceof DOMException ? error.message : 'Artwork adoption interrupted.'); break; }
    }
    let remaining = 0;
    let obsolete = 0;
    const prefix = resolveAppUrl('assets/art/', this.basePath, this.origin);
    if (errors.length === 0) await withArtMutation(this.names.retained, async () => {
      // Only a complete successful scan may reclaim obsolete versions. A copy
      // failure above preserves every untouched source for a later retry.
      const retained = await this.storage.open(this.names.retained);
      for (const name of await this.legacyCaches()) {
        const legacy = await this.storage.open(name);
        for (const key of await legacy.keys()) {
          if (!key.url.startsWith(prefix)) continue;
          const sourcePath = new URL(key.url).pathname;
          const file = this.files.find((entry) => new URL(resolveAppUrl(entry.url, this.basePath, this.origin)).pathname === sourcePath);
          const response = await legacy.match(key);
          if (!response) continue;
          let matchesCurrent = false;
          if (file) { try { await this.checked(response, file); matchesCurrent = true; } catch { /* Obsolete bytes. */ } }
          if (matchesCurrent && file) {
            const copy = await retained.match(this.url(file));
            if (!copy || copy.headers.get(HASH_HEADER) !== file.sha256) continue;
          }
          await legacy.delete(key);
          obsolete += 1;
        }
      }
    });
    for (const name of await this.legacyCaches()) {
      remaining += (await (await this.storage.open(name)).keys()).filter((key) => key.url.startsWith(prefix)).length;
    }
    await this.putRecord('migration', 'legacy-art', { copied, remaining, errors, obsolete }).catch(() => undefined);
    return { copied, remaining, errors, obsolete };
  }
}
