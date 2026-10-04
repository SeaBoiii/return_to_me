import { PrecacheController, PrecacheRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { ArtCache } from './pwa/artCache';
import { VOICE_CACHE_NAME } from './pwa/cacheNames';
import { rangedAudioResponse } from './pwa/mediaRange';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string | null } | string>;
};
const basePath = new URL(self.registration.scope).pathname;
const art = new ArtCache({ basePath, origin: self.location.origin });
const precache = new PrecacheController();
precache.addToCacheList(self.__WB_MANIFEST);
registerRoute(new PrecacheRoute(precache));

let migrationComplete = false;
let migrationAttempt: Promise<void> | undefined;
let lastMigrationAttempt = 0;
function resumeLegacyMigration(event: ExtendableEvent, force = false): Promise<void> {
  if (migrationComplete) return Promise.resolve();
  if (migrationAttempt) return migrationAttempt;
  if (!force && Date.now() - lastMigrationAttempt < 10_000) return Promise.resolve();
  lastMigrationAttempt = Date.now();
  migrationAttempt = (async () => {
    const migration = await art.migrateLegacy();
    // Workbox would otherwise delete old artwork before adoption could finish.
    if (migration.remaining === 0 && migration.errors.length === 0) {
      await precache.activate(event);
      for (const name of await caches.keys()) {
        if (name.includes('workbox-precache') && name.endsWith(self.registration.scope) && name !== precache.strategy.cacheName) await caches.delete(name);
      }
      migrationComplete = true;
    }
    if (migration.copied > 0) {
      for (const client of await self.clients.matchAll()) client.postMessage({ type: 'ART_CACHE_CHANGED' });
    }
  })().finally(() => { migrationAttempt = undefined; });
  return migrationAttempt;
}

self.addEventListener('install', (event) => event.waitUntil(precache.install(event)));
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await resumeLegacyMigration(event, true);
    await self.clients.claim();
  })());
});

registerRoute(
  ({ request, url }) => request.method === 'GET' && url.origin === self.location.origin && art.fileForUrl(url.href) !== undefined,
  async ({ request }) => art.fetchReading(art.fileForUrl(request.url)!, request),
);

const voicePrefix = new URL('voices/', self.registration.scope).href;
registerRoute(
  ({ request, url }) => request.method === 'GET' && url.href.startsWith(voicePrefix) && /\.(?:mp3|m4a|ogg|wav)$/i.test(url.pathname),
  async ({ request }) => {
    const cache = await caches.open(VOICE_CACHE_NAME);
    const cached = await cache.match(request.url);
    if (cached?.status === 200) return rangedAudioResponse(request, cached);
    const response = await fetch(request);
    // A partial response must never replace a complete downloaded clip.
    if (response.status === 200) await cache.put(request.url, response.clone()).catch(() => undefined);
    return response;
  },
);

registerRoute(new NavigationRoute(precache.createHandlerBoundToURL('index.html'), {
  denylist: [/\/(?:api|voices|assets)\//, /\.[a-z0-9]{2,8}$/i],
}));

const protectedByClient = new Map<string, readonly string[]>();
self.addEventListener('message', (event) => {
  const data = event.data as { readonly type?: unknown; readonly urls?: unknown } | undefined;
  if (data?.type === 'OFFLINE_STATUS') event.waitUntil((async () => {
    const entries = await Promise.all(precache.getCachedURLs().map((url) => precache.matchPrecache(url)));
    event.ports[0]?.postMessage({ shellReady: entries.length > 0 && entries.every(Boolean) });
    await resumeLegacyMigration(event, true);
  })());
  if (data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (data?.type === 'PROTECT_ART' && Array.isArray(data.urls)) {
    const urls: readonly unknown[] = data.urls;
    const id = event.source && 'id' in event.source ? event.source.id : 'current';
    protectedByClient.set(id, urls.filter((url): url is string => typeof url === 'string'));
    event.waitUntil(self.clients.matchAll().then((clients) => {
      const live = new Set(clients.map((client) => client.id));
      for (const key of protectedByClient.keys()) if (key !== 'current' && !live.has(key)) protectedByClient.delete(key);
      art.protect([...protectedByClient.values()].flat());
    }));
    event.waitUntil(resumeLegacyMigration(event));
  }
});
