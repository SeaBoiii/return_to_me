import { generatedArtFiles, generatedArtPacks } from './artContent.generated';
import { resolveAppUrl } from './basePath';

export interface ArtFile { readonly url: string; readonly sha256: string; readonly bytes: number }
export interface ArtPack {
  readonly id: string; readonly chapterId: string; readonly title: string;
  readonly urls: readonly string[]; readonly expectedBytes: number; readonly revision: string;
}
export const artFiles: readonly ArtFile[] = generatedArtFiles;
export const artPacks: readonly ArtPack[] = generatedArtPacks;
const byPath = new Map(artFiles.map((file) => [file.url, file]));

export function findArtFile(url: string): ArtFile | undefined {
  const pathname = new URL(url, 'https://art.invalid').pathname;
  const start = pathname.indexOf('/assets/art/');
  return start < 0 ? undefined : byPath.get(pathname.slice(start + 1));
}

/** Preserve canonical asset identity and deployment base; invalidate by bytes. */
export function getArtUrl(url: string): string {
  const file = findArtFile(url);
  if (!file) return url;
  const absolute = /^[a-z][a-z\d+.-]*:/i.test(url);
  const parsed = new URL(url, 'https://art.invalid');
  parsed.searchParams.set('art', file.sha256);
  return absolute ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function resolvedArtUrl(file: ArtFile, basePath: string, origin: string): string {
  const url = new URL(resolveAppUrl(file.url, basePath, origin));
  url.searchParams.set('art', file.sha256);
  return url.href;
}

let activeUrls: readonly string[] = [];
/** Protect the visible composition from the reading-cache LRU. */
export function protectActiveArt(urls: readonly string[]): void {
  activeUrls = urls.map(getArtUrl);
  if (!('navigator' in globalThis) || !('serviceWorker' in navigator)) return;
  const send = () => navigator.serviceWorker.controller?.postMessage({ type: 'PROTECT_ART', urls: activeUrls });
  send();
  void navigator.serviceWorker.ready.then(send);
}
