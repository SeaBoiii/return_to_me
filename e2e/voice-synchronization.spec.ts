import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_SETTINGS } from '../src/engine';
import { story } from '../src/story';
import { offlinePackManifests } from '../src/voices';
import { alignedVoiceLines } from '../src/voices/alignment.generated';
import { SAVE_KEY, SETTINGS_KEY } from './helpers';

async function startAlignedLine(page: Page, lineId: string) {
  await page.addInitScript(({ lineId, revision, chapters, settings, saveKey, settingsKey }) => {
    localStorage.setItem('return-to-me:notice:v1', 'acknowledged');
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    localStorage.setItem(saveKey, JSON.stringify({ version: 1, storyId: 'return-to-me-school-years', storyRevision: revision,
      currentNodeId: lineId, status: 'playing', history: [], rememberedChoices: {}, unlockedChapters: chapters, seenNodeIds: [], timestamp: 1 }));
    const NativeAudio = window.Audio;
    const audios: HTMLAudioElement[] = [];
    Object.defineProperty(window, '__alignedAudio', { value: audios });
    window.Audio = function (src?: string) { const audio = new NativeAudio(src); audios.push(audio); return audio; } as unknown as typeof Audio;
  }, { lineId, revision: story.revision, chapters: story.chapters.map(chapter => chapter.id),
    settings: { ...DEFAULT_SETTINGS, textSpeedMs: 60 }, saveKey: SAVE_KEY, settingsKey: SETTINGS_KEY });
  await page.goto('./');
  const notice = page.getByRole('button', { name: 'Continue to title' });
  if (await notice.isVisible()) await notice.click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

async function audioPosition(page: Page) {
  return page.evaluate(() => {
    const audio = (window as Window & { __alignedAudio?: HTMLAudioElement[] }).__alignedAudio?.at(-1);
    return audio ? { time: audio.currentTime, paused: audio.paused, ended: audio.ended } : undefined;
  });
}

for (const lineId of ['prologue-003', 'ch1-004', 'ch11-057']) {
  test(`synchronizes ${lineId} to native narration, pauses, and resets on replay`, async ({ page }) => {
    const alignment = alignedVoiceLines[lineId];
    if (!alignment) throw new Error(`Missing alignment for ${lineId}`);
    const providerRequests: string[] = [];
    page.on('request', request => { if (request.url().includes('elevenlabs.io')) providerRequests.push(request.url()); });
    await startAlignedLine(page, lineId);
    const passage = page.getByLabel('Passage text').locator('p[aria-hidden="true"]');
    await expect(passage).toHaveAttribute('data-reveal-mode', 'audio');
    // Playback remains native: read its live clock and allow one rendering frame of tolerance.
    await expect.poll(async () => (await audioPosition(page))?.time ?? 0).toBeGreaterThan(1.1);
    await expect.poll(() => page.evaluate(({ cues, text }) => {
      const audio = (window as Window & { __alignedAudio?: HTMLAudioElement[] }).__alignedAudio?.at(-1);
      const visible = document.querySelector('[data-reveal-mode="audio"]')?.textContent ?? '';
      if (!audio || audio.paused || visible.length === 0) return false;
      const lower = cues.filter(cue => cue[1] <= (audio.currentTime - 0.08) * 1000).at(-1)?.[0] ?? 0;
      const upper = cues.filter(cue => cue[1] <= (audio.currentTime + 0.08) * 1000).at(-1)?.[0] ?? 0;
      return visible === text.slice(0, visible.length) && visible.length >= lower && visible.length <= upper;
    }, { cues: alignment.cues, text: alignment.text })).toBe(true);

    await page.getByRole('button', { name: 'Pause voice', exact: true }).click();
    const pausedText = await passage.textContent();
    const pausedTime = (await audioPosition(page))?.time;
    await page.waitForTimeout(350);
    expect(await passage.textContent()).toBe(pausedText);
    expect((await audioPosition(page))?.time).toBe(pausedTime);
    await page.getByRole('button', { name: 'Open reading menu' }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Resume reading', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Resume reading', exact: true }).click();
    await expect.poll(async () => (await audioPosition(page))?.time ?? 0).toBeGreaterThan(pausedTime ?? 0);

    await page.getByRole('button', { name: 'Replay voice', exact: true }).click();
    await expect.poll(async () => (await audioPosition(page))?.time ?? 99).toBeLessThan(0.5);
    await expect.poll(async () => (await passage.textContent())?.length ?? 999).toBeLessThan(pausedText?.length ?? 0);
    await page.getByRole('button', { name: 'Reveal full line', exact: true }).click();
    await expect(passage).toHaveText(alignment.text);
    await expect(page.getByRole('button', { name: 'Advance dialogue', exact: true })).toBeEnabled();
    expect(providerRequests).toEqual([]);
  });
}

test('keeps alignment metadata and downloaded narration available offline', async ({ page, context }, info) => {
  test.skip(info.project.name === 'webkit', 'Native offline audio limitation of Windows WebKit is documented in the QA record.');
  const lineId = 'prologue-003';
  const alignment = alignedVoiceLines[lineId]!;
  await startAlignedLine(page, lineId);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.getByRole('button', { name: 'Open reading menu' }).click();
  await page.getByRole('button', { name: 'Offline & install', exact: true }).click();
  const library = page.getByRole('dialog', { name: 'Offline & install' });
  await library.getByRole('button', { name: 'Voices', exact: true }).click();
  const title = offlinePackManifests.find(pack => pack.chapterId === 'prologue')!.title;
  const pack = library.getByRole('article', { name: `Voices for ${title}`, exact: true });
  await pack.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(pack.getByRole('status')).toHaveText('Downloaded', { timeout: 30_000 });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const passage = page.getByLabel('Passage text').locator('p[aria-hidden="true"]');
  await expect(passage).toHaveAttribute('data-reveal-mode', 'audio');
  await expect.poll(async () => (await audioPosition(page))?.time ?? 0).toBeGreaterThan(0.8);
  await expect.poll(async () => (await passage.textContent())?.length ?? 0).toBeGreaterThan(0);
  expect(alignment.text.startsWith((await passage.textContent()) ?? '')).toBe(true);
});
