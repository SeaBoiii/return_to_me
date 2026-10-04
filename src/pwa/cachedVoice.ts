import { VOICE_CACHE_NAME } from './cacheNames';

export interface CachedVoiceSource { readonly url: string; readonly release?: () => void }

export function canResolveCachedVoice(): boolean {
  return typeof caches !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof URL.revokeObjectURL === 'function';
}

/** No network request: complete downloaded clips can bypass native media-stack SW quirks. */
export async function resolveCachedVoice(url: string): Promise<CachedVoiceSource> {
  if (!canResolveCachedVoice()) return { url };
  try {
    const absolute = new URL(url, globalThis.location?.href).href;
    const response = await (await caches.open(VOICE_CACHE_NAME)).match(absolute);
    if (!response || response.status !== 200 || response.headers.has('content-range') || !response.headers.get('content-type')?.startsWith('audio/')) return { url };
    const blob = await response.blob();
    if (blob.size === 0) return { url };
    const source = URL.createObjectURL(blob);
    let released = false;
    return { url: source, release: () => { if (!released) { released = true; URL.revokeObjectURL(source); } } };
  } catch { return { url }; }
}
