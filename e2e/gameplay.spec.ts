import { expect, test, type Page, type Locator, type TestInfo } from '@playwright/test';
import { DEFAULT_SETTINGS, REPLAY_STORAGE_KEY } from '../src/engine';
import { getAssetEntry } from '../src/art/manifest';
import { story } from '../src/story';
import { dismissNotice, openApp, openReadingPanel, SAVE_KEY, SETTINGS_KEY } from './helpers';

async function seedReader(page: Page, nodeId: string, textSpeedMs = 0, textSize: 18 | 21 | 24 = 18): Promise<string> {
  await openApp(page);
  const raw = await page.evaluate(({ saveKey, settingsKey, nodeId, revision, chapters, settings }) => {
    const save = JSON.stringify({ version: 1, storyId: 'return-to-me-school-years', storyRevision: revision,
      currentNodeId: nodeId, status: 'playing', history: [], rememberedChoices: {}, unlockedChapters: chapters,
      seenNodeIds: [], timestamp: 1234 }, null, 2);
    localStorage.setItem(saveKey, save);
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    return save;
  }, { saveKey: SAVE_KEY, settingsKey: SETTINGS_KEY, nodeId, revision: story.revision,
    chapters: story.chapters.map(chapter => chapter.id), settings: { ...DEFAULT_SETTINGS, muted: true, textSpeedMs, textSize } });
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  return raw;
}
const savedNode = (page: Page) => page.evaluate(key => (JSON.parse(localStorage.getItem(key) ?? '{}') as { currentNodeId?: string }).currentNodeId, SAVE_KEY);

test('chapter replay preserves main bytes across reload and stops at its chapter boundary', async ({ page }) => {
  const original = await seedReader(page, 'ch1-020');
  await page.getByRole('button', { name: 'Open chapter menu' }).click();
  await page.getByRole('dialog', { name: 'Chapter select' }).getByRole('button', { name: /Before Nurul/ }).click();
  await expect(page.getByText('Chapter replay', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Advance dialogue' }).click();
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  await expect.poll(() => page.evaluate(key => {
    const replay = JSON.parse(localStorage.getItem(key) ?? '{}') as { save?: { currentNodeId?: string } };
    return replay.save?.currentNodeId;
  }, REPLAY_STORAGE_KEY)).toBe('prologue-002');
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Resume replay', exact: true }).click();
  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText('Content note:');
  for (let step = 0; step < 14 && !(await page.getByRole('region', { name: 'Replay complete' }).isVisible()); step++) {
    await page.getByRole('button', { name: 'Advance dialogue' }).click();
  }
  await expect(page.getByRole('region', { name: 'Replay complete' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Advance dialogue' })).toBeHidden();
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{}') as unknown, REPLAY_STORAGE_KEY))
    .toMatchObject({ chapterId: 'prologue', completed: true, save: { currentNodeId: 'prologue-012' } });
  await page.getByRole('button', { name: 'Return to main story', exact: true }).click();
  await expect(page.getByText('Chapter replay', { exact: true })).toBeHidden();
  const mainLine = story.nodes.find(node => node.id === 'ch1-020');
  if (mainLine?.type !== 'line') throw new Error('Missing main test line');
  await expect(page.getByLabel('Passage text')).toContainText(mainLine.text);
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(original);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`keeps text sizes and 48px reading controls usable at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    test.skip(info.project.name === 'chromium', 'Mobile Chromium and WebKit exercise compact layouts.');
    await page.setViewportSize(viewport);
    await seedReader(page, 'ch10-prayer-honesty');
    for (const size of [18, 21, 24]) {
      await openReadingPanel(page, 'Settings');
      const settings = page.getByRole('dialog', { name: 'Settings' });
      await settings.getByRole('combobox', { name: 'Reading size' }).selectOption(String(size));
      await settings.getByRole('button', { name: 'Close', exact: true }).click();
      const passage = page.getByLabel('Passage text');
      await expect(passage.locator('p[aria-hidden="true"]')).toHaveCSS('font-size', `${size}px`);
      const geometry = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, height: innerHeight, documentHeight: document.documentElement.scrollHeight }));
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.width + 1);
      expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.height + 1);
      for (const button of await page.getByRole('navigation', { name: 'Reading controls' }).getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        if (!box) continue;
        expect(box.width).toBeGreaterThanOrEqual(48);
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      }
      await passage.evaluate(element => { element.scrollTop = element.scrollHeight; });
      expect(await savedNode(page)).toBe('ch10-prayer-honesty');
      await expect(page.getByRole('button', { name: 'Advance dialogue' })).toBeVisible();
    }
    // Choices use the same bounded scroll area and must remain reachable at the
    // largest reading size, including short landscape screens.
    await seedReader(page, 'ch11-choice-openness');
    await openReadingPanel(page, 'Settings');
    const settings = page.getByRole('dialog', { name: 'Settings' });
    await settings.getByRole('combobox', { name: 'Reading size' }).selectOption('24');
    await settings.getByRole('button', { name: 'Close', exact: true }).click();
    const passage = page.getByLabel('Passage text');
    const options = passage.getByRole('button');
    const choice = story.nodes.find(node => node.id === 'ch11-choice-openness');
    if (choice?.type !== 'choice') throw new Error('Missing choice fixture');
    await expect(options).toHaveCount(choice.choices.length);
    for (const option of await options.all()) {
      const box = await option.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(48);
    }
    await passage.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await savedNode(page)).toBe(choice.id);
    await expect(page.getByRole('button', { name: 'Choose a response' })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(viewport.height + 1);
    await options.last().click();
    await expect.poll(() => savedNode(page)).toBe(choice.choices.at(-1)?.next);
  });
}

test('dialogue tap reveals then advances; double tap and text selection retain the passage', async ({ page }, info) => {
  await seedReader(page, 'ch1-020', 60);
  const passage = page.getByLabel('Passage text');
  if (info.project.name === 'chromium') await passage.click({ position: { x: 25, y: 15 } });
  else await passage.tap({ position: { x: 25, y: 15 } });
  await expect(page.getByRole('button', { name: 'Advance dialogue' })).toBeVisible({ timeout: 1000 });
  expect(await savedNode(page)).toBe('ch1-020');
  await passage.dblclick({ position: { x: 60, y: 15 } });
  await expect.poll(() => page.evaluate(() => Boolean(getSelection()?.toString()))).toBe(true);
  await page.waitForTimeout(400); // Past the bounded tap delay; proves no delayed advance remains.
  expect(await savedNode(page)).toBe('ch1-020');
  await page.evaluate(() => getSelection()?.removeAllRanges());
  if (info.project.name === 'chromium') await passage.click({ position: { x: 25, y: 15 } });
  else await passage.tap({ position: { x: 25, y: 15 } });
  await expect.poll(() => savedNode(page)).toBe('ch1-021');
});

test('a reading sheet freezes Auto and keyboard focus until closed', async ({ page }) => {
  await seedReader(page, 'ch1-020');
  await page.getByRole('button', { name: 'Auto off', exact: true }).click();
  await page.getByRole('button', { name: 'Open reading menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Reading menu' });
  await expect(menu).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await menu.evaluate(element => element.contains(document.activeElement))).toBe(true);
  const line = story.nodes.find(node => node.id === 'ch1-020');
  if (line?.type !== 'line') throw new Error('Missing timed test line');
  const readingDelay = Math.max(1500, line.text.trim().split(/\s+/).length * 230);
  await page.waitForTimeout(readingDelay + 150);
  expect(await savedNode(page)).toBe('ch1-020');
  await menu.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Auto on', exact: true }).click();
  expect(await savedNode(page)).toBe('ch1-020');
});

const auditViewports = [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 844, height: 390 }];
const reflectiveChoices = story.nodes.filter(node => node.type === 'choice');
const longestChoices = [...reflectiveChoices].sort((left, right) =>
  right.prompt.length + right.choices.reduce((sum, option) => sum + option.label.length, 0)
  - left.prompt.length - left.choices.reduce((sum, option) => sum + option.label.length, 0)).slice(0, 3);
const longestPassages = story.nodes.filter(node => node.type === 'line')
  .sort((left, right) => right.text.length - left.text.length).slice(0, 3);

async function assertViewportBounds(page: Page, viewport: { width: number; height: number }) {
  const geometry = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  expect(geometry.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(geometry.height).toBeLessThanOrEqual(viewport.height + 1);
  for (const button of await page.getByRole('navigation', { name: 'Reading controls' }).getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    if (!box) continue;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }
}

for (const viewport of auditViewports) {
  test(`24px choice and longest-passage bounds at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    test.skip(info.project.name === 'chromium', 'Touch Chromium and WebKit audit every compact size.');
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    expect(reflectiveChoices).toHaveLength(25);
    const choices = viewport.width === 320 ? reflectiveChoices : longestChoices;
    for (const choice of choices) await test.step(`Choice ${choice.id}: last response without Next`, async () => {
      await seedReader(page, choice.id, 0, 24);
      const passage = page.getByLabel('Passage text');
      await expect(passage.locator('p[aria-hidden="true"]')).toHaveCSS('font-size', '24px');
      const options = passage.getByRole('button');
      await expect(options).toHaveCount(choice.choices.length);
      for (const option of await options.all()) {
        const box = await option.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(48);
        expect(box?.width).toBeGreaterThanOrEqual(48);
      }
      await options.last().scrollIntoViewIfNeeded();
      const bounds = await passage.boundingBox();
      const last = await options.last().boundingBox();
      expect(bounds).not.toBeNull(); expect(last).not.toBeNull();
      if (bounds && last) {
        expect(last.y).toBeGreaterThanOrEqual(bounds.y - 1);
        expect(last.y + last.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
      }
      expect(await savedNode(page)).toBe(choice.id);
      await expect(page.getByRole('button', { name: 'Choose a response' })).toBeDisabled();
      await assertViewportBounds(page, viewport);
      await options.last().tap();
      await expect.poll(() => savedNode(page)).toBe(choice.choices.at(-1)?.next);
    });

    for (const line of longestPassages) await test.step(`Long passage ${line.id}: scroll retains current line`, async () => {
      await seedReader(page, line.id, 0, 24);
      const passage = page.getByLabel('Passage text');
      await expect(passage.locator('p[aria-hidden="true"]')).toHaveCSS('font-size', '24px');
      await assertViewportBounds(page, viewport);
      const scrollable = await passage.evaluate(element => element.scrollHeight > element.clientHeight + 1);
      expect(scrollable).toBe(true);
      if (info.project.name === 'webkit') {
        // Mobile WebKit's automation does not implement mouse-wheel input.
        // The focusable passage also supports a hardware keyboard's End key.
        await passage.focus();
        await page.keyboard.press('End');
      } else {
        await passage.hover();
        await page.mouse.wheel(0, 10_000);
      }
      await expect.poll(() => passage.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await expect.poll(() => passage.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(2);
      expect(await savedNode(page)).toBe(line.id);
      await expect(page.getByRole('button', { name: 'Advance dialogue' })).toBeVisible();
      await assertViewportBounds(page, viewport);
    });
    await info.attach('reading-bounds-coverage', { body: JSON.stringify({ viewport, textSize: 24,
      choiceIds: choices.map(node => node.id), passageIds: longestPassages.map(node => node.id) }, null, 2), contentType: 'application/json' });
  });
}

async function spriteMetrics(image: Locator) {
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalHeight > 0)).toBe(true);
  return image.evaluate(element => {
    const image = element as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable for sprite proportion audit');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = canvas.height, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if ((pixels[(y * canvas.width + x) * 4 + 3] ?? 0) >= 16) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
    }
    const rect = image.getBoundingClientRect(), layer = image.parentElement!.getBoundingClientRect();
    return { url: new URL(image.currentSrc).pathname, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
      width: rect.width, height: rect.height, top: rect.top, layerTop: layer.top, layerHeight: layer.height,
      alphaTop: top, alphaHeight: bottom - top + 1, subjectTop: rect.top + top / canvas.height * rect.height,
      subjectHeight: (bottom - top + 1) / canvas.height * rect.height };
  });
}

async function attachStage(page: Page, info: TestInfo, name: string) {
  await info.attach(name, { body: await page.locator('figure[data-art-kind]').screenshot(), contentType: 'image/png' });
}

test('preserves P6 Alya framing and the adult Nurul to Aleem height ratio at runtime', async ({ page }, info) => {
  test.skip(info.project.name === 'chromium', 'Both mobile engines cover portrait, tablet, and landscape proportions.');
  test.setTimeout(120_000);
  const adultNode = story.nodes.find(node => node.stage.sprites.some(sprite => sprite.assetId === 'nurulain-neutral')
    && node.stage.sprites.some(sprite => sprite.assetId === 'aleem-umrah-neutral'));
  if (!adultNode) throw new Error('Missing adult couple fixture');
  const evidence = [];
  for (const viewport of auditViewports) {
    await page.setViewportSize(viewport);
    await seedReader(page, 'ch1-002');
    const childAleem = await spriteMetrics(page.locator('img[src*="/aleem-p6/neutral.webp"]'));
    const alya = await spriteMetrics(page.locator('img[src*="/alya/neutral.webp"]'));
    expect(childAleem.naturalHeight).toBe(getAssetEntry('aleem-p6-neutral')?.height);
    expect(alya.naturalHeight).toBe(getAssetEntry('alya-neutral')?.height);
    expect(childAleem.height / childAleem.layerHeight).toBeCloseTo(1, 2);
    expect(alya.height / alya.layerHeight).toBeCloseTo(1.45, 2);
    expect((alya.top - alya.layerTop) / alya.layerHeight).toBeCloseTo(-0.06, 2);
    expect(Math.abs(alya.subjectTop - childAleem.subjectTop)).toBeLessThan(alya.layerHeight * 0.12);
    await attachStage(page, info, `p6-${viewport.width}x${viewport.height}`);

    await seedReader(page, adultNode.id);
    const aleem = await spriteMetrics(page.locator('img[src*="/aleem-umrah/neutral.webp"]'));
    const nurul = await spriteMetrics(page.locator('img[src*="/nurulain/neutral.webp"]'));
    expect(aleem.naturalHeight).toBe(getAssetEntry('aleem-umrah-neutral')?.height);
    expect(nurul.naturalHeight).toBe(getAssetEntry('nurulain-neutral')?.height);
    expect(nurul.height / aleem.height).toBeCloseTo(1, 2);
    expect(nurul.width / nurul.height).toBeCloseTo(nurul.naturalWidth / nurul.naturalHeight, 2);
    expect(Math.abs(nurul.subjectHeight / aleem.subjectHeight - 947 / 1050)).toBeLessThan(0.015);
    await attachStage(page, info, `adult-${viewport.width}x${viewport.height}`);
    evidence.push({ viewport, childAleem, alya, aleem, nurul });
  }
  await info.attach('rendered-sprite-proportions', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});
