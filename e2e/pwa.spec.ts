import { expect, test, type Page } from '@playwright/test';

import { story } from '../src/story';
import { createArtAssetManifest } from '../src/story/artManifest';
import { artFiles, artPacks, getArtUrl } from '../src/pwa/artContent';
import { dismissNotice, openApp, SAVE_KEY } from './helpers';

// Artwork is now explicit; shell installation must stay small.
test.setTimeout(60_000);

async function readyWorker(page: Page): Promise<void> {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

async function openLibrary(page: Page) {
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Offline & install', exact: true }).click();
  return page.getByRole('dialog', { name: 'Offline & install' });
}

async function saveAt(page: Page, currentNodeId: string, ended = false): Promise<void> {
  await page.evaluate(({ key, revision, currentNodeId, chapters, ended }) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, storyId: 'return-to-me-school-years', storyRevision: revision,
      currentNodeId, status: ended ? 'ended' : 'playing', history: [], rememberedChoices: {}, unlockedChapters: chapters,
      seenNodeIds: [], timestamp: Date.now() }));
  }, { key: SAVE_KEY, revision: story.revision, currentNodeId, chapters: story.chapters.map((chapter) => chapter.id), ended });
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

interface BuiltManifest {
  readonly name?: string;
  readonly id?: string;
  readonly short_name?: string;
  readonly description?: string;
  readonly scope?: string;
  readonly start_url?: string;
  readonly icons?: ReadonlyArray<{
    readonly src: string;
    readonly sizes?: string;
    readonly purpose?: string;
  }>;
}

test('publishes nested-path-safe manifest, icons, and service worker', async ({
  page,
}) => {
  await openApp(page);

  await expect(page).toHaveTitle('Return to Me');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Umrah, and a new beginning with Nurul/,
  );

  const manifestUrl = new URL('manifest.webmanifest', page.url()).href;
  const manifestResponse = await page.request.get(manifestUrl);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as BuiltManifest;
  expect(manifest.name).toBe('Return to Me');
  expect(manifest.id).toBe('/return-to-me-test/');
  expect(manifest.short_name).toBe('Return to Me');
  expect(manifest.description).toMatch(/Umrah, and a new beginning with Nurul/);
  expect(manifest.scope).toBe('/return-to-me-test/');
  expect(manifest.start_url).toBe('/return-to-me-test/');
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
    ]),
  );

  for (const icon of manifest.icons ?? []) {
    const response = await page.request.get(new URL(icon.src, manifestUrl).href);
    expect(response.ok(), `${icon.src} should be deployable`).toBe(true);
  }

  const scope = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    return Promise.race([
      navigator.serviceWorker.ready.then(
        (registration) => new URL(registration.scope).pathname,
      ),
      new Promise<string>((resolve) => {
        window.setTimeout(() => resolve('timeout'), 45_000);
      }),
    ]);
  });
  expect(scope).toBe('/return-to-me-test/');

  await expect
    .poll(() => page.evaluate(() => caches.keys()))
    .toContainEqual(expect.stringContaining('precache'));

  const workerResponse = await page.request.get(
    new URL('sw.js', page.url()).href,
  );
  expect(workerResponse.ok()).toBe(true);
  expect(await workerResponse.text()).toContain('SKIP_WAITING');
});

test('presents offline/install fallback and accepts an install prompt', async ({
  page,
}) => {
  await openApp(page);
  await dismissNotice(page);
  await page
    .getByRole('button', { name: 'Offline & install', exact: true })
    .click();

  const offline = page.getByRole('dialog', { name: 'Offline & install' });
  await expect(offline).toContainText('Take the story with you');
  await expect(offline).toContainText('Artwork loads as you read');
  await expect(offline).toContainText('choose Share, then Add to Home Screen');
  for (const manifest of artPacks) {
    await expect(offline.getByRole('heading', { name: manifest.title, exact: true })).toBeVisible();
  }
  await expect(
    offline.getByRole('button', { name: 'Use browser install menu' }),
  ).toBeDisabled();

  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({
        outcome: 'accepted',
        platform: 'web',
      }),
    });
    window.dispatchEvent(event);
  });

  const install = offline.getByRole('button', { name: 'Install app' });
  await expect(install).toBeEnabled();
  await install.click();
  await expect(
    offline.getByRole('button', { name: 'Installed' }),
  ).toBeDisabled();
});

test('starts with shell/text only and does not automatically fetch chapter artwork or voices', async ({ page, context }) => {
  const requested: string[] = [];
  context.on('request', (request) => requested.push(new URL(request.url()).pathname));
  await openApp(page);
  await readyWorker(page);
  const precached = await page.evaluate(async () => {
    const result: string[] = [];
    for (const name of (await caches.keys()).filter((name) => name.includes('precache'))) {
      for (const request of await (await caches.open(name)).keys()) result.push(new URL(request.url).pathname);
    }
    return result;
  });
  expect(precached.some((url) => url.includes('/assets/art/') || url.includes('/voices/'))).toBe(false);
  expect(precached.some((url) => url.endsWith('/index.html'))).toBe(true);
  expect(requested.filter((url) => url.includes('/assets/art/')).every((url) => url.endsWith('/bg-dawn-window.webp'))).toBe(true);
  expect(requested.some((url) => url.includes('/voices/'))).toBe(false);
});

test('downloads chapter artwork explicitly, protects shared files, and rotates offline', async ({ page, context, browserName }) => {
  test.setTimeout(120_000);
  await openApp(page);
  await readyWorker(page);
  await page.reload();
  const library = await openLibrary(page);
  const selected = artPacks.filter((pack) => ['chapter-10', 'chapter-11', 'epilogue'].includes(pack.chapterId));
  for (const pack of selected) {
    const row = library.getByRole('article', { name: `Artwork for ${pack.title}`, exact: true });
    await row.getByRole('button', { name: /^(Download|Retry download|Keep offline)$/ }).click();
    await expect(row.getByRole('status')).toHaveText('Downloaded', { timeout: 45_000 });
  }
  // The epilogue shares art with chapter 12; removing one owner must preserve the other.
  const finale = selected.find((pack) => pack.chapterId === 'chapter-11')!;
  const epilogue = selected.find((pack) => pack.chapterId === 'epilogue')!;
  const epilogueRow = library.getByRole('article', { name: `Artwork for ${epilogue.title}`, exact: true });
  await epilogueRow.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(library.getByRole('article', { name: `Artwork for ${finale.title}`, exact: true }).getByRole('status')).toHaveText('Downloaded');
  await epilogueRow.getByRole('button', { name: /^(Download|Retry download|Keep offline)$/ }).click();
  await expect(epilogueRow.getByRole('status')).toHaveText('Downloaded');
  await library.getByRole('button', { name: 'Close', exact: true }).click();
  if (browserName !== 'webkit') await context.setOffline(true);
  else test.info().annotations.push({ type: 'offline-emulation', description: 'WebKit setOffline bypasses even unconditional service-worker responses. Strict network-refusal/offline worker proof runs in scripts/check-offline-upgrade.ts --webkit.' });
  const missing = await page.evaluate(async (paths) => {
    const unavailable: string[] = [];
    for (const path of paths) {
      try {
        const response = await fetch(new URL(path, window.location.href));
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/') || (await response.blob()).size === 0) {
          unavailable.push(path);
        }
      } catch {
        unavailable.push(path);
      }
    }
    return unavailable;
  }, [...new Set(selected.flatMap((pack) => pack.urls))].map((url) => getArtUrl(`/return-to-me-test/${url}`)));
  expect(missing).toEqual([]);
  const scene = story.nodes.find((node) => node.chapterId === 'chapter-11' && node.stage.backgroundId === 'cg-kallang-confession')!;
  const art = createArtAssetManifest('/return-to-me-test/').find((asset) => asset.id === scene.stage.backgroundId)!;
  await saveAt(page, scene.id);
  for (const viewport of [{ width: 390, height: 844 }, { width: 900, height: 480 }]) {
    await page.setViewportSize(viewport);
    const image = page.getByTestId('cg-composition');
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const expected = viewport.width < viewport.height && art.mobile ? art.mobile.url : art.url;
    await expect(image).toHaveAttribute('src', getArtUrl(expected));
    await expect(page.getByText('Artwork is unavailable here.', { exact: false })).toBeHidden();
  }
  await saveAt(page, 'epilogue-end', true);
  await expect(page.getByRole('region', { name: 'The End' })).toContainText('Our journey continues. Inshallah, a happily ever after.');
});

test('cancels and resumes a partial artwork pack and continues after the library closes', async ({ page }) => {
  // This exercises a real 32-image pack, including a cancellation and reopen.
  // Leave room outside the final wait for WebKit's slower CacheStorage writes.
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('/assets/art/') && init?.cache === 'no-store') await new Promise((resolve) => window.setTimeout(resolve, 160));
      return nativeFetch(input, init);
    };
  });
  await openApp(page);
  await readyWorker(page);
  await page.reload();
  let library = await openLibrary(page);
  const pack = artPacks.find((pack) => pack.chapterId === 'chapter-1')!;
  let row = library.getByRole('article', { name: `Artwork for ${pack.title}`, exact: true });
  await row.getByRole('button', { name: 'Download', exact: true }).click();
  await expect.poll(() => page.evaluate(async (urls) => {
    const name = (await caches.keys()).find((name) => name.startsWith('return-to-me-art-retained-'));
    if (!name) return 0;
    return (await (await caches.open(name)).keys()).filter((key) => urls.some((url) => key.url.includes(url))).length;
  }, pack.urls)).toBeGreaterThan(0);
  await row.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(row.getByRole('status')).toHaveText('Partly available');
  const partial = await page.evaluate(async (files) => {
    const retained = (await caches.keys()).find((name) => name.startsWith('return-to-me-art-retained-'));
    if (!retained) return [];
    const keys = await (await caches.open(retained)).keys();
    return keys.map((key) => key.url).filter((url) => files.some((file) => url.includes(file.url)));
  }, artFiles.filter((file) => pack.urls.includes(file.url)));
  expect(partial.length).toBeGreaterThan(0);
  await row.getByRole('button', { name: 'Retry download', exact: true }).click();
  await library.getByRole('button', { name: 'Close', exact: true }).click();
  library = await openLibrary(page);
  row = library.getByRole('article', { name: `Artwork for ${pack.title}`, exact: true });
  await expect(row.getByRole('status')).toHaveText('Downloaded', { timeout: 90_000 });
});

test('keeps browser data across a service-worker-safe update check and reload', async ({
  page,
}) => {
  await openApp(page);
  await page.evaluate(() => {
    localStorage.setItem('return-to-me:e2e-update-sentinel', 'kept');
  });

  const updateResult = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return 'checked';
  });
  expect(updateResult).toBe('checked');
  await expect(
    page.getByRole('button', { name: 'Update now' }),
  ).toBeHidden();

  await page.reload();
  await expect(
    page.evaluate(() =>
      localStorage.getItem('return-to-me:e2e-update-sentinel'),
    ),
  ).resolves.toBe('kept');
  await expect(page.locator('#main-content')).toBeVisible();
});
