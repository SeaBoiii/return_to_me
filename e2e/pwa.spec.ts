import { expect, test } from '@playwright/test';

import { dismissNotice, openApp } from './helpers';

interface BuiltManifest {
  readonly id?: string;
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

  const manifestUrl = new URL('manifest.webmanifest', page.url()).href;
  const manifestResponse = await page.request.get(manifestUrl);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as BuiltManifest;
  expect(manifest.id).toBe('/return-to-me-test/');
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
        window.setTimeout(() => resolve('timeout'), 15_000);
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
