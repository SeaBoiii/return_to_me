import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { artAssets } from '../src/art/manifest';
import { story } from '../src/story';
import { DEFAULT_SETTINGS } from '../src/engine';
import { SAVE_KEY, SETTINGS_KEY } from './helpers';

test('reviews every background inside the portrait scene with protected landmarks visible', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Full inventory in mobile Chromium; WebKit exercises all22 CGs and gameplay layouts.');
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const report = [];
  for (const asset of artAssets.filter(entry => entry.kind === 'background')) {
    const node = story.nodes.find(candidate => candidate.stage.backgroundId === asset.id);
    if (!node) throw new Error(`Missing scene for ${asset.id}`);
    await page.evaluate(({ saveKey, settingsKey, settings, nodeId, revision, chapters }) => {
      localStorage.setItem('return-to-me:notice:v1', 'acknowledged');
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      localStorage.setItem(saveKey, JSON.stringify({ version: 1, storyId: 'return-to-me-school-years', storyRevision: revision,
        currentNodeId: nodeId, status: 'playing', history: [], rememberedChoices: {}, unlockedChapters: chapters, seenNodeIds: [], timestamp: 1 }));
    }, { saveKey: SAVE_KEY, settingsKey: SETTINGS_KEY, settings: { ...DEFAULT_SETTINGS, muted: true, textSpeedMs: 0, reducedMotion: true },
      nodeId: node.id, revision: story.revision, chapters: story.chapters.map(chapter => chapter.id) });
    await page.reload();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const image = page.getByTestId('scene-background');
    const selected = asset.mobile ?? asset;
    await expect.poll(() => image.evaluate((element, selected) => {
      const image = element as HTMLImageElement;
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      const bounds = selected.protectedBounds;
      if (!image.complete || !image.naturalWidth || !bounds) return false;
      const scale = style.objectFit === 'cover' ? Math.max(rect.width / selected.width, rect.height / selected.height)
        : Math.min(rect.width / selected.width, rect.height / selected.height);
      const left = (rect.width - selected.width * scale) * selected.focalPoint.x;
      const top = (rect.height - selected.height * scale) * selected.focalPoint.y;
      return left + bounds.x * selected.width * scale >= -2 && top + bounds.y * selected.height * scale >= -2
        && left + (bounds.x + bounds.width) * selected.width * scale <= rect.width + 2
        && top + (bounds.y + bounds.height) * selected.height * scale <= rect.height + 2;
    }, selected)).toBe(true);
    const stage = await page.locator('figure').boundingBox();
    const panel = await page.getByRole('region', { name: /^(Dialogue|Choice|The End)$/ }).boundingBox();
    if (!stage || !panel) throw new Error(`Missing reader area for ${asset.id}`);
    expect(stage.y + stage.height).toBeLessThanOrEqual(panel.y + 1);
    report.push({ id: asset.id, node: node.id, stage, fit: await image.evaluate(element => getComputedStyle(element).objectFit) });
  }
  expect(report).toHaveLength(57);
  await info.attach('background-framing.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
});

test('measures a cold mobile start without unrelated artwork or voice downloads', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'mobile', 'CDP network and CPU throttling are Chromium-only.');
  test.setTimeout(60_000);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 75_000, connectionType: 'cellular4g' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const requested = new Set<string>();
  context.on('request', request => requested.add(request.url()));
  const started = performance.now();
  await page.goto('./');
  await page.getByRole('dialog', { name: 'A note before we begin' }).waitFor();
  const interactiveMs = Math.round(performance.now() - started);
  await page.locator('main img').first().evaluate(async (element) => { await (element as HTMLImageElement).decode(); });
  const visibleArtworkMs = Math.round(performance.now() - started);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  const metrics = await page.evaluate(() => ({
    paints: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: Math.round(entry.startTime) })),
    resources: performance.getEntriesByType('resource').map(entry => ({ name: entry.name, transferBytes: (entry as PerformanceResourceTiming).transferSize })),
  }));
  const art = [...requested].filter(url => url.includes('/assets/art/'));
  const voices = [...requested].filter(url => /\/voices\/.*\.mp3/.test(url));
  expect(art.length).toBeGreaterThan(0);
  expect(art.every(url => url.includes('/bg-dawn-window.webp?art='))).toBe(true);
  expect(voices).toEqual([]);
  const path = info.outputPath('cold-mobile-startup.json');
  await writeFile(path, JSON.stringify({
    conditions: 'Cold production preview, 1.6 Mbps / 150 ms latency, 4x CPU; transfer sizes reflect actual responses.',
    interactiveMs, visibleArtworkMs, artRequests: art.length, voiceRequests: voices.length, ...metrics,
  }, null, 2));
  await info.attach('cold-mobile-startup.json', { path, contentType: 'application/json' });
});
