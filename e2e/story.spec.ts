import { expect, test } from '@playwright/test';

import {
  SAVE_KEY,
  SETTINGS_KEY,
  dismissNotice,
  openApp,
  revealAndAdvance,
  startNewGame,
} from './helpers';

test('shows the factual notice and starts a new story', async ({ page }) => {
  await openApp(page);

  const notice = page.getByRole('dialog', {
    name: 'A note before we begin',
  });
  await expect(notice).toContainText('Inspired by real events');
  await expect(notice).toContainText('Relationship breakdown');
  await expect(notice).toContainText('Exact examination grades are not shown');

  await dismissNotice(page);
  await expect(
    page.getByRole('heading', { name: /Return\s+to\s+Me/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continue', exact: true }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.getByLabel('Dialogue')).toContainText(
    'Inspired by real events',
  );
  await expect(page.getByText('Before Nurul', { exact: true })).toBeVisible();
});

test('autosaves an advanced line and restores it through Continue', async ({
  page,
}) => {
  await openApp(page);
  await startNewGame(page);
  await revealAndAdvance(page);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw === null
          ? undefined
          : (JSON.parse(raw) as { currentNodeId?: string }).currentNodeId;
      }, SAVE_KEY),
    )
    .toBe('prologue-002');

  await page.reload();
  await dismissNotice(page);
  const continueButton = page.getByRole('button', {
    name: 'Continue',
    exact: true,
  });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page.getByLabel('Dialogue')).toContainText(
    'Content note: this chapter includes relationship breakdown',
  );
  await expect(
    page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw === null
        ? undefined
        : (JSON.parse(raw) as { currentNodeId?: string }).currentNodeId;
    }, SAVE_KEY),
  ).resolves.toBe('prologue-002');
});

test('records a reflective choice and reconverges on the true-life milestone', async ({
  page,
}) => {
  await openApp(page);
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        storyId: 'return-to-me-school-years',
        storyRevision: 'school-years-1.0.0',
        currentNodeId: 'ch1-choice-sms',
        status: 'playing',
        history: [],
        rememberedChoices: {},
        unlockedChapters: ['prologue', 'chapter-1'],
        seenNodeIds: [],
        timestamp: Date.now(),
      }),
    );
  }, SAVE_KEY);
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByLabel('Choice')).toContainText(
    'How does young Aleem answer the wrong message?',
  );
  await page
    .getByRole('button', {
      name: /Ask quietly:.*Was that meant for me/,
    })
    .click();
  await revealAndAdvance(page);
  await revealAndAdvance(page);

  await expect(page.getByLabel('Dialogue')).toContainText(
    'I sent that to the wrong person',
  );
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) return undefined;
        return (JSON.parse(raw) as {
          currentNodeId?: string;
          rememberedChoices?: Record<string, string>;
        });
      }, SAVE_KEY),
    )
    .toMatchObject({
      currentNodeId: 'ch1-035',
      rememberedChoices: { 'ch1-choice-sms': 'sms-ask' },
    });
});
test('unlocks the first chapter only after reaching it', async ({ page }) => {
  await openApp(page);
  await startNewGame(page);

  await page.getByRole('button', { name: 'Open chapter menu' }).click();
  let chapterDialog = page.getByRole('dialog', { name: 'Chapter select' });
  await expect(
    chapterDialog.getByRole('button', { name: /Before Nurul/ }),
  ).toBeEnabled();
  await expect(
    chapterDialog.getByRole('button', { name: /The Wrong Message/ }),
  ).toBeDisabled();
  await chapterDialog.getByRole('button', { name: 'Close' }).click();

  for (let line = 0; line < 12; line += 1) {
    await revealAndAdvance(page);
  }

  await expect(page.getByText('The Wrong Message', { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) return [];
        return (JSON.parse(raw) as { unlockedChapters?: string[] })
          .unlockedChapters ?? [];
      }, SAVE_KEY),
    )
    .toContain('chapter-1');

  await page.getByRole('button', { name: 'Open chapter menu' }).click();
  chapterDialog = page.getByRole('dialog', { name: 'Chapter select' });
  await expect(
    chapterDialog.getByRole('button', { name: /The Wrong Message/ }),
  ).toBeEnabled();
  await expect(
    chapterDialog.getByRole('button', { name: /A Different Classroom/ }),
  ).toBeDisabled();
  await expect(
    chapterDialog.getByRole('button', { name: /Continue\?/ }),
  ).toBeDisabled();
});

test('plays a complete route through all five reconverging choices', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'desktop route audit only');

  await openApp(page);
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        textSpeedMs: 0,
        autoMode: false,
        skipSeen: false,
        volume: 0.9,
        muted: true,
        reducedMotion: true,
      }),
    );
  }, SETTINGS_KEY);
  await page.reload();
  await startNewGame(page);

  let choiceCount = 0;
  for (let step = 0; step < 230; step += 1) {
    if (await page.getByRole('heading', { name: 'Continue?' }).isVisible()) {
      break;
    }

    const choice = page.getByLabel('Choice');
    if (await choice.isVisible()) {
      const prompt = (await choice.textContent()) ?? '';
      const option = prompt.includes('wrong message')
        ? /Ask quietly/
        : prompt.includes('Faris say')
          ? /Keep it simple/
          : prompt.includes('attend to first')
            ? /Call Hana/
            : prompt.includes('mutual friend')
              ? /Ask calmly/
              : /next path.*there must be one/;
      await choice.getByRole('button', { name: option }).click();
      choiceCount += 1;
      continue;
    }

    await page.getByRole('button', { name: 'Advance dialogue' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Continue?' })).toBeVisible();
  expect(choiceCount).toBe(5);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) return undefined;
        const save = JSON.parse(raw) as {
          status?: string;
          currentNodeId?: string;
          rememberedChoices?: Record<string, string>;
          unlockedChapters?: string[];
        };
        return {
          status: save.status,
          currentNodeId: save.currentNodeId,
          choiceCount: Object.keys(save.rememberedChoices ?? {}).length,
          unlockedCount: save.unlockedChapters?.length,
        };
      }, SAVE_KEY),
    )
    .toEqual({
      status: 'ended',
      currentNodeId: 'epilogue-end',
      choiceCount: 5,
      unlockedCount: 4,
    });
});
test('keeps subtitles and voice settings usable without licensed clips', async ({
  page,
}) => {
  await openApp(page);
  await startNewGame(page);

  const dialogue = page.getByLabel('Dialogue');
  await expect(dialogue).toContainText('Inspired by real events');
  const replay = page.getByRole('button', { name: 'Replay voice' });
  await expect(replay).toBeDisabled();
  await expect(replay).toHaveAttribute(
    'title',
    'No voice clip is included for this line',
  );

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  let settings = page.getByRole('dialog', { name: 'Settings' });
  const mute = settings.getByRole('checkbox', { name: /Mute voices/ });
  await expect(mute).not.toBeChecked();
  await mute.check();
  await settings.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(
    settings.getByRole('checkbox', { name: /Mute voices/ }),
  ).toBeChecked();
  await expect(
    page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw === null
        ? undefined
        : (JSON.parse(raw) as { muted?: boolean }).muted;
    }, SETTINGS_KEY),
  ).resolves.toBe(true);
});

test('supports the core touch flow without horizontal overflow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile project only');

  await openApp(page);
  await startNewGame(page);
  await expect(page.getByLabel('Dialogue')).toBeVisible();
  await revealAndAdvance(page);
  await page.getByRole('button', { name: 'Open chapter menu' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Chapter select' }),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
