import { expect, test, type Page } from '@playwright/test';
import { story } from '../src/story';
import { DEFAULT_SETTINGS } from '../src/engine';
import { offlinePackManifests, voiceEntries } from '../src/voices';
import { dismissNotice, openApp, revealAndAdvance, SAVE_KEY, SETTINGS_KEY, startNewGame } from './helpers';

// Observe the actual browser-created audio elements; playback is never mocked.
async function observeAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    const elements: HTMLAudioElement[] = [];
    Object.defineProperty(window, '__voiceTestAudio', { value: elements });
    window.Audio = function (src?: string) {
      const element = new NativeAudio(src);
      elements.push(element);
      return element;
    } as unknown as typeof Audio;
  });
}

async function expectPlaying(page: Page, lineId: string): Promise<void> {
  await expect.poll(() => page.evaluate((id) => {
    const probe = window as Window & { __voiceTestAudio?: HTMLAudioElement[] };
    const audio = probe.__voiceTestAudio?.at(-1);
    if (!audio) return false;
    const source = new URL(audio.dataset.voiceUrl ?? audio.currentSrc ?? audio.src, location.href);
    return source.pathname.startsWith('/return-to-me-test/voices/')
      && source.pathname.endsWith(`/${id}.mp3`)
      && audio.currentTime > 0
      && !audio.paused
      && audio.error === null;
  }, lineId)).toBe(true);
}

async function saveAt(page: Page, nodeId: string): Promise<void> {
  await page.evaluate(({ key, settingsKey, revision, id, chapters, settings }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 1, storyId: 'return-to-me-school-years', storyRevision: revision,
      currentNodeId: id, status: 'playing', history: [], rememberedChoices: {},
      unlockedChapters: chapters, seenNodeIds: [], timestamp: Date.now(),
    }));
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, { key: SAVE_KEY, settingsKey: SETTINGS_KEY, revision: story.revision, id: nodeId, chapters: story.chapters.map((chapter) => chapter.id), settings: { ...DEFAULT_SETTINGS, textSpeedMs: 0 } });
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

test('plays imported narration under the nested base and keeps subtitles after a media error', async ({ page }) => {
  await observeAudio(page);
  await openApp(page);
  await startNewGame(page);
  await revealAndAdvance(page);
  await revealAndAdvance(page);
  const replay = page.getByRole('button', { name: 'Replay voice', exact: true });
  await expect(replay).toBeEnabled();
  await replay.click();
  await expectPlaying(page, 'prologue-003');

  // Trigger a genuine decoder/network error in the active HTMLAudioElement.
  await page.evaluate(() => {
    const probe = window as Window & { __voiceTestAudio?: HTMLAudioElement[] };
    const audio = probe.__voiceTestAudio?.at(-1);
    if (!audio) throw new Error('Expected the active narration element.');
    audio.src = new URL('voices/unavailable-e2e-clip.mp3', location.href).href;
    audio.load();
  });
  await expect(page.getByLabel('Dialogue', { exact: true }).getByRole('status')).toContainText('Voice unavailable; subtitles remain active.');
  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText('People like to begin a love story');
  await revealAndAdvance(page);
  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText('My story with Nurul');
});

test('downloads chapters independently and plays the imported voices offline', async ({ page, context }, info) => {
  test.skip(info.project.name === 'webkit', 'Playwright WebKit setOffline bypasses service-worker responses; the origin-refusal harness covers WebKit offline behavior.');
  test.setTimeout(180_000);
  await observeAudio(page);
  await openApp(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Offline & install', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Offline & install' });
  expect(offlinePackManifests.length).toBeGreaterThan(1);
  await panel.getByRole('button', { name: 'Voices', exact: true }).click();
  const rows = offlinePackManifests.map((pack) => panel.getByRole('article', { name: `Voices for ${pack.title}`, exact: true }));
  for (const row of rows) await expect(row.getByRole('status')).toHaveText('Not downloaded');
  for (const [index, row] of rows.entries()) {
    await row.getByRole('button', { name: 'Download', exact: true }).click();
    await expect(row.getByRole('status')).toHaveText('Downloaded', { timeout: 30_000 });
    const nextRow = rows[index + 1];
    if (nextRow) await expect(nextRow.getByRole('status')).toHaveText('Not downloaded');
    await row.getByRole('button', { name: 'Verify', exact: true }).click();
    await expect(row.getByRole('status')).toHaveText('Downloaded');
  }

  // Exercise every imported chapter and every cast profile as coverage grows.
  const sampleLineIds = new Set<string>();
  for (const pack of offlinePackManifests) {
    const clip = voiceEntries.find((entry) => entry.packId === pack.id);
    if (!clip) throw new Error(`Expected an imported clip for ${pack.chapterId}.`);
    sampleLineIds.add(clip.lineId);
  }
  for (const profile of new Set(voiceEntries.map((entry) => entry.provenance.profile))) {
    const clip = voiceEntries.find((entry) => entry.provenance.profile === profile);
    if (!clip) throw new Error(`Expected an imported ${profile} clip.`);
    sampleLineIds.add(clip.lineId);
  }

  await context.setOffline(true);
  for (const clip of voiceEntries.filter((entry) => sampleLineIds.has(entry.lineId))) {
    await saveAt(page, clip.lineId);
    const replay = page.getByRole('button', { name: 'Replay voice', exact: true });
    await expect(replay).toBeEnabled();
    await replay.click();
    await expectPlaying(page, clip.lineId);
    await expect(page.getByLabel('Dialogue', { exact: true })).not.toContainText('Voice unavailable');
  }

  await saveAt(page, 'epilogue-005');
  await page.getByRole('button', { name: 'Replay voice', exact: true }).click();
  await expectPlaying(page, 'epilogue-005');
  await revealAndAdvance(page);
  await expect(page.getByRole('region', { name: 'The End' })).toContainText(
    'The story ends here. Our journey continues. Inshallah, a happily ever after.',
  );
  await expect(page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as unknown, SAVE_KEY))
    .resolves.toMatchObject({ currentNodeId: 'epilogue-end', status: 'ended' });
});
