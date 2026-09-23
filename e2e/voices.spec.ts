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
    return new URL(audio.currentSrc || audio.src).pathname.startsWith('/return-to-me-test/voices/')
      && new URL(audio.currentSrc || audio.src).pathname.endsWith(`/${id}.mp3`)
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

test('downloads chapters independently and plays the imported voices offline', async ({ page, context }) => {
  test.setTimeout(90_000);
  await observeAudio(page);
  await openApp(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Offline & install', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Offline & install' });
  const prologuePack = offlinePackManifests.find((pack) => pack.chapterId === 'prologue');
  const chapterPack = offlinePackManifests.find((pack) => pack.chapterId === 'chapter-1');
  if (!prologuePack || !chapterPack) throw new Error('Expected both imported voice packs.');
  const prologueRow = panel.getByRole('article').filter({ has: page.getByRole('heading', { name: prologuePack.title, exact: true }) });
  const chapterRow = panel.getByRole('article').filter({ has: page.getByRole('heading', { name: chapterPack.title, exact: true }) });
  await expect(prologueRow.getByRole('status')).toHaveText('not downloaded');
  await prologueRow.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(prologueRow.getByRole('status')).toHaveText('ready', { timeout: 30_000 });
  await expect(chapterRow.getByRole('status')).toHaveText('not downloaded');
  await chapterRow.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(chapterRow.getByRole('status')).toHaveText('ready', { timeout: 30_000 });
  await prologueRow.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(prologueRow.getByRole('status')).toHaveText('ready');

  await context.setOffline(true);
  for (const profile of ['adult-aleem', 'young-aleem', 'alya']) {
    const clip = voiceEntries.find((entry) => entry.provenance.profile === profile);
    if (!clip) throw new Error(`Expected an imported ${profile} clip.`);
    await saveAt(page, clip.lineId);
    const replay = page.getByRole('button', { name: 'Replay voice', exact: true });
    await expect(replay).toBeEnabled();
    await replay.click();
    await expectPlaying(page, clip.lineId);
    await expect(page.getByLabel('Dialogue', { exact: true })).not.toContainText('Voice unavailable');
  }

  const unvoiced = story.nodes.find((node) => node.type === 'line' && node.chapterId === 'chapter-2' && node.speakerId !== null);
  if (!unvoiced || unvoiced.type !== 'line') throw new Error('Expected a later unvoiced chapter.');
  await saveAt(page, unvoiced.id);
  await expect(page.getByRole('button', { name: 'Replay voice', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText(unvoiced.text);
  await revealAndAdvance(page);
  await expect(page.getByLabel('Dialogue', { exact: true })).not.toContainText(unvoiced.text);
});
