import { expect, test } from '@playwright/test';

import { story } from '../src/story';
import { createArtAssetManifest } from '../src/story/artManifest';
import { dismissNotice, openApp, SAVE_KEY } from './helpers';

// Each isolated browser installs the full illustrated story before going offline.
test.setTimeout(60_000);

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

  await expect(page).toHaveTitle(/Return to Me.*Before Nurul/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /working life and a journey to the holy land/,
  );

  const manifestUrl = new URL('manifest.webmanifest', page.url()).href;
  const manifestResponse = await page.request.get(manifestUrl);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as BuiltManifest;
  expect(manifest.name).toBe('Return to Me: Before Nurul');
  expect(manifest.id).toBe('/return-to-me-test/');
  expect(manifest.short_name).toBe('Return to Me');
  expect(manifest.description).toMatch(/working life and a journey to the holy land/);
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
  await expect(offline).toContainText(
    'Voice packs are not included in this edition',
  );
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

test('loads both merged art batches and resumes arrival without a network connection', async ({ page, context }) => {
  await openApp(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await page.evaluate(({ key, revision }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      storyId: 'return-to-me-school-years',
      storyRevision: revision,
      currentNodeId: 'ch8-012',
      status: 'playing',
      history: [],
      rememberedChoices: {},
      unlockedChapters: ['prologue', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-ns', 'chapter-6', 'chapter-7', 'chapter-8'],
      seenNodeIds: [],
      timestamp: Date.now(),
    }));
  }, { key: SAVE_KEY, revision: story.revision });

  await context.setOffline(true);
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('A Different Journey', { exact: true })).toBeVisible();
  const reveal = page.getByRole('button', { name: 'Reveal full line' });
  if (await reveal.isVisible()) await reveal.click();
  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText('arrived in the holy land');

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
  }, createArtAssetManifest('/return-to-me-test/').filter((asset) =>
    ['chapter-ns', 'chapter-6', 'chapter-7', 'chapter-8'].includes(asset.preloadGroup ?? ''),
  ).map((asset) => asset.url));
  expect(missing).toEqual([]);
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
  await expect(
    page.getByRole('dialog', { name: 'A note before we begin' }),
  ).toBeVisible();
});
