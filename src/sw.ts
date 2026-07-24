import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

import {
  VOICE_CACHE_NAME,
  VOICE_CACHE_PREFIX,
} from './pwa/cacheNames';

interface InjectedManifestEntry {
  url: string;
  revision?: string | null;
}

interface ServiceWorkerMessage {
  type?: string;
}

interface WorkerMessageEvent {
  data?: ServiceWorkerMessage;
  waitUntil(promise: Promise<unknown>): void;
}

interface WorkerLifecycleEvent {
  waitUntil(promise: Promise<unknown>): void;
}

interface InjectManifestGlobal {
  __WB_MANIFEST: Array<InjectedManifestEntry | string>;
  location: Location;
  skipWaiting(): Promise<void>;
  addEventListener(
    type: 'message',
    listener: (event: WorkerMessageEvent) => void,
  ): void;
  addEventListener(
    type: 'activate',
    listener: (event: WorkerLifecycleEvent) => void,
  ): void;
}

const worker = globalThis as unknown as InjectManifestGlobal;

precacheAndRoute(
  (self as unknown as InjectManifestGlobal).__WB_MANIFEST,
);
cleanupOutdatedCaches();
clientsClaim();

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === worker.location.origin &&
    /\/voices\/.+\.(?:mp3|m4a|ogg|wav)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: VOICE_CACHE_NAME,
  }),
);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [
      /\/(?:api|voices)\//,
      /\.[a-z0-9]{2,8}$/i,
    ],
  }),
);

worker.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(worker.skipWaiting());
  }
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                name.startsWith(VOICE_CACHE_PREFIX) &&
                name !== VOICE_CACHE_NAME,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => undefined),
  );
});
