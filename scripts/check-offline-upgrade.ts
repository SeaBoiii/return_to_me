import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { build, type Plugin } from 'vite';
import { chromium, webkit } from '@playwright/test';
import { STORY_REVISION } from '../src/story/metadata';

// Two real worker builds on one local origin. No application assets are edited.
const base = '/offline-fixture/';
const swPath = resolve('src/sw.ts').replaceAll('\\', '/');
const contentPath = resolve('src/pwa/artContent.ts').replaceAll('\\', '/');
const file = (name: string, body: string) => ({ url: `assets/art/${name}.webp`, bytes: Buffer.byteLength(body), sha256: createHash('sha256').update(body).digest('hex') });
const files = [file('kept', 'unchanged'), file('changed', 'new-art')];
const nextFiles = [files[0], file('changed', 'newer-art')];
const pack = { id: 'art-fixture', chapterId: 'fixture', title: 'Fixture', urls: files.map((entry) => entry.url), expectedBytes: files.reduce((sum, entry) => sum + entry.bytes, 0), revision: 'current' };
const voiceBytes = await readFile('public/voices/prologue/prologue-003.mp3');
const legacyCode = `import {precacheAndRoute} from 'workbox-precaching';
  import {clientsClaim} from 'workbox-core';
  precacheAndRoute([{url:'index.html',revision:'legacy'}, {url:'assets/art/kept.webp',revision:null},{url:'assets/art/changed.webp',revision:null}]);
  self.addEventListener('install',()=>self.skipWaiting()); clientsClaim();`;

async function workerBuild(legacy: boolean, next = false): Promise<string> {
  const catalog = next ? nextFiles : files;
  const fixturePack = { ...pack, expectedBytes: catalog.reduce((sum, entry) => sum + entry.bytes, 0), revision: next ? 'next' : 'current' };
  const plugin: Plugin = {
    name: 'offline-upgrade-fixture',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id.endsWith('virtual:legacy-worker')) return '\0virtual:legacy-worker';
      if (id === 'virtual:fixture-art') return '\0virtual:fixture-art';
      if (id === './artContent' && importer?.replaceAll('\\', '/').endsWith('/pwa/artCache.ts')) return '\0virtual:fixture-art';
      return undefined;
    },
    load(id) {
      if (id === '\0virtual:legacy-worker') return legacyCode;
      if (id === '\0virtual:fixture-art') return `export const artFiles=${JSON.stringify(catalog)};export const artPacks=${JSON.stringify([fixturePack])};export {resolvedArtUrl} from ${JSON.stringify(contentPath)};`;
      return undefined;
    },
    transform(code, id) {
      if (id.replaceAll('\\', '/') === swPath) return code
        .replace('precache.addToCacheList(self.__WB_MANIFEST);', `precache.addToCacheList([{url:'index.html',revision:'${next ? 'next' : 'current'}'}]);
          self.addEventListener('message', event => { if(event.data?.type === 'FIXTURE_RETAIN') event.waitUntil((async()=>{
            await art.claim(${JSON.stringify(fixturePack)});
            for(const file of art.files) await art.retain(file);
            event.ports[0]?.postMessage({ok:true});
          })()); });`)
        .replace('const basePath =', `const realPut = Cache.prototype.put; let failAdoptionOnce = ${!next};
          Cache.prototype.put = function(request, response) {
            const url = typeof request === 'string' ? request : request instanceof Request ? request.url : request.href;
            if (failAdoptionOnce && url.includes('kept.webp?art=')) {
              failAdoptionOnce = false;
              return Promise.reject(new DOMException('Fixture interrupted migration', 'QuotaExceededError'));
            }
            return realPut.call(this, request, response);
          };
          const basePath =`);
      return undefined;
    },
  };
  const result = await build({ configFile: false, logLevel: 'silent', base, define: { 'process.env.NODE_ENV': JSON.stringify('production') }, plugins: [plugin], build: { write: false, minify: true, lib: { entry: legacy ? 'virtual:legacy-worker' : swPath, formats: ['iife'], name: 'OfflineFixture', fileName: 'sw' } } });
  const output = (Array.isArray(result) ? result[0] : result);
  if (!output || !('output' in output)) throw new Error('Missing worker output.');
  const chunk = output.output.find((entry) => entry.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('Missing worker chunk.');
  return chunk.code;
}

const workers = [await workerBuild(true), await workerBuild(false), await workerBuild(false, true)];
let version = 0;
let refuseNetwork = false;
const requests: string[] = [];
const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://local').pathname;
  requests.push(pathname);
  if (refuseNetwork) { response.destroy(); return; }
  response.setHeader('cache-control', 'no-store');
  if (pathname === `${base}sw.js`) { response.setHeader('content-type', 'application/javascript'); response.end(workers[version]); }
  else if (pathname.endsWith('/kept.webp')) response.end('unchanged');
  else if (pathname.endsWith('/changed.webp')) response.end(version === 0 ? 'old-art' : version === 1 ? 'new-art' : 'newer-art');
  else if (pathname.endsWith('/voices/preserved.mp3')) { response.setHeader('content-type', 'audio/mpeg'); response.setHeader('content-length', voiceBytes.length); response.end(voiceBytes); }
  else { response.setHeader('content-type', 'text/html'); response.end('<!doctype html><title>Offline update fixture</title><main>Offline update fixture</main>'); }
});
await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Missing test server port.');
const url = `http://127.0.0.1:${address.port}${base}`;
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript("globalThis.__name = (target, value) => Object.defineProperty(target, 'name', { value, configurable: true });");
  await page.goto(url);
  await page.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.evaluate(async (revision) => {
    const cache = await caches.open(`return-to-me-voices-${revision}`);
    const url = new URL('voices/preserved.mp3', location.href).href;
    await cache.put(url, await fetch(url));
  }, STORY_REVISION);
  version = 1;
  requests.length = 0;
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    await new Promise<void>((done) => {
      const send = () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true });
      if (registration.waiting) send();
      else registration.installing?.addEventListener('statechange', send);
    });
  });
  const interrupted = await page.evaluate(async () => {
    const legacy = (await caches.keys()).find((name) => name.includes('workbox-precache'));
    return legacy ? Boolean(await (await caches.open(legacy)).match(new URL('assets/art/kept.webp', location.href).href)) : false;
  });
  assert.equal(interrupted, true, 'Uncopied legacy artwork survives an interrupted migration.');
  await page.evaluate(() => {
    navigator.serviceWorker.controller?.postMessage({ type: 'OFFLINE_STATUS' });
  });
  await page.waitForFunction(async (file) => {
    const name = (await caches.keys()).find((entry) => entry.startsWith('return-to-me-art-retained-'));
    return name ? Boolean(await (await caches.open(name)).match(new URL(`${file.url}?art=${file.sha256}`, location.href).href)) : false;
  }, files[0]);
  await page.waitForFunction(async () => {
    for (const name of (await caches.keys()).filter((name) => name.includes('workbox-precache'))) {
      if ((await (await caches.open(name)).keys()).some((key) => key.url.includes('/assets/art/'))) return false;
    }
    return true;
  });
  // New installation downloads only the shell; legacy adoption performs no fetch.
  assert.equal(requests.some((path) => path.includes('/assets/art/')), false);
  const result = await page.evaluate(async ({ files, revision }) => {
    const artUrl = (file: { url: string; sha256: string }) => new URL(`${file.url}?art=${file.sha256}`, location.href).href;
    const kept = await (await fetch(artUrl(files[0]))).text();
    const changed = await (await fetch(artUrl(files[1]))).text();
    const cache = await caches.open(`return-to-me-voices-${revision}`);
    const voice = await (await cache.match(new URL('voices/preserved.mp3', location.href).href))?.arrayBuffer();
    const voiceHash = voice ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', voice))].map((byte) => byte.toString(16).padStart(2, '0')).join('') : '';
    return { kept, changed, voiceHash };
  }, { files, revision: STORY_REVISION });
  assert.deepEqual(result, { kept: 'unchanged', changed: 'new-art', voiceHash: createHash('sha256').update(voiceBytes).digest('hex') });
  await page.evaluate(() => new Promise<void>((done) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => { channel.port1.close(); done(); };
    navigator.serviceWorker.controller?.postMessage({ type: 'FIXTURE_RETAIN' }, [channel.port2]);
  }));
  version = 2;
  requests.length = 0;
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    await new Promise<void>((done) => {
      const send = () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true });
      if (registration.waiting) send(); else registration.installing?.addEventListener('statechange', send);
    });
  });
  assert.equal(requests.some((path) => path.includes('/assets/art/')), false);
  const updated = await page.evaluate(async ({ previous, current, revision }) => {
    const name = (await caches.keys()).find((entry) => entry.startsWith('return-to-me-art-retained-'))!;
    const retained = await caches.open(name);
    const oldResponse = await retained.match(new URL(`${previous.url}?art=${previous.sha256}`, location.href).href);
    const fresh = await (await fetch(new URL(`${current.url}?art=${current.sha256}`, location.href))).text();
    const voice = await (await (await caches.open(`return-to-me-voices-${revision}`)).match(new URL('voices/preserved.mp3', location.href).href))!.arrayBuffer();
    return { retained: await oldResponse?.text(), fresh, voiceHash: [...new Uint8Array(await crypto.subtle.digest('SHA-256', voice))].map((byte) => byte.toString(16).padStart(2, '0')).join('') };
  }, { previous: files[1], current: nextFiles[1], revision: STORY_REVISION });
  assert.deepEqual(updated, { retained: 'new-art', fresh: 'newer-art', voiceHash: createHash('sha256').update(voiceBytes).digest('hex') });
  assert.deepEqual(requests.filter((path) => path.includes('/assets/art/')), [`${base}assets/art/changed.webp`]);
  const requestCount = requests.length;
  // WebKit's Playwright offline emulation rejects even worker-created responses.
  // Refuse all origin traffic instead; then assert no fallback network request occurs.
  refuseNetwork = true;
  if (!process.argv.includes('--webkit')) await context.setOffline(true);
  const offline = await page.evaluate(async (files) => {
    const values = [];
    for (const file of files) values.push(await (await fetch(new URL(`${file.url}?art=${file.sha256}`, location.href))).text());
    const audio = await fetch(new URL('voices/preserved.mp3', location.href), { headers: { range: 'bytes=0-4' } });
    return { values, rangeStatus: audio.status, rangeBody: [...new Uint8Array(await audio.arrayBuffer())] };
  }, nextFiles);
  assert.deepEqual(offline, { values: ['unchanged', 'newer-art'], rangeStatus: 206, rangeBody: [...voiceBytes.subarray(0, 5)] });
  await page.evaluate(async (revision) => {
    const response = await (await caches.open(`return-to-me-voices-${revision}`)).match(new URL('voices/preserved.mp3', location.href).href);
    if (!response) throw new Error('Missing cached voice.');
    const source = URL.createObjectURL(await response.blob());
    const button = document.createElement('button');
    button.textContent = 'Play cached voice';
    button.onclick = () => {
      const audio = new Audio();
      audio.src = source;
      document.body.append(audio);
      (window as Window & { fixtureAudio?: HTMLAudioElement }).fixtureAudio = audio;
      void audio.play().catch((error: unknown) => { (window as Window & { fixturePlayError?: string }).fixturePlayError = String(error); });
    };
    document.body.append(button);
    (window as Window & { fixtureBlob?: string }).fixtureBlob = source;
  }, STORY_REVISION);
  await page.getByRole('button', { name: 'Play cached voice' }).click();
  await page.waitForFunction(() => {
    const state = window as Window & { fixtureAudio?: HTMLAudioElement; fixturePlayError?: string };
    return (state.fixtureAudio?.currentTime ?? 0) > 0.15 || state.fixturePlayError !== undefined;
  }, undefined, { timeout: 8_000 });
  const playback = await page.evaluate(() => {
    const state = window as Window & { fixtureAudio?: HTMLAudioElement; fixturePlayError?: string };
    return { currentTime: state.fixtureAudio?.currentTime ?? 0, error: state.fixtureAudio?.error?.code, playError: state.fixturePlayError };
  });
  let mediaLimitation: string | undefined;
  if (process.platform === 'win32' && process.argv.includes('--webkit') && playback.error === 4 && playback.playError?.startsWith('NotSupportedError:')) {
    mediaLimitation = 'Windows Playwright WebKit rejects MP3 Blob URLs, also reproduced online without a service worker. Native offline audio is not proven on this runner.';
  } else assert.ok(playback.currentTime > 0.15, `Cached MP3 playback failed: ${JSON.stringify(playback)}`);
  await page.evaluate(() => (window as Window & { fixtureAudio?: HTMLAudioElement }).fixtureAudio?.pause());
  await page.evaluate(() => { const url = (window as Window & { fixtureBlob?: string }).fixtureBlob; if (url) URL.revokeObjectURL(url); });
  assert.deepEqual(requests.slice(requestCount).filter((path) => path !== `${base}sw.js`), [], 'Offline art and cached audio make no asset request.');
  console.log(JSON.stringify({ legacyMigrationAndRetry: 'passed', obsoleteLegacyCleanup: 'passed', currentBuildToCurrentBuildHashRefresh: 'passed', voiceBytesPreserved: 'passed', offlineArtworkAndAudioRanges: 'passed', originAssetRequestsWhileOffline: 0,
    nativeCachedMp3Playback: mediaLimitation ? 'runner limitation' : 'passed', ...(mediaLimitation ? { limitation: mediaLimitation } : {}) }, null, 2));
} finally {
  await browser.close();
  await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
}
