import { expect, test } from '@playwright/test';
import { story } from '../src/story';

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
  await expect(notice).toContainText('Family pressure');
  await expect(notice).toContainText(/relationship breakdown/i);
  await expect(notice).toContainText(/prejudicial thoughts/i);
  await expect(notice).toContainText(/Aleem’s thoughts, not as facts/i);
  await expect(notice).toContainText('Exact examination grades are not shown');

  await dismissNotice(page);
  await expect(
    page.getByRole('heading', { name: /Return\s+to\s+Me/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continue', exact: true }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText(
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

  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText(
    'Content note: this story includes family pressure',
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

  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText(
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

test('chains a completed first-edition save into the JC expansion', async ({
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
        currentNodeId: 'epilogue-end',
        status: 'ended',
        history: [
          { kind: 'line', nodeId: 'ch2-108' },
          { kind: 'line', nodeId: 'epilogue-001' },
        ],
        rememberedChoices: {},
        unlockedChapters: [
          'prologue',
          'chapter-1',
          'chapter-2',
          'epilogue',
        ],
        seenNodeIds: ['ch2-108', 'epilogue-001', 'epilogue-end'],
        timestamp: Date.now(),
      }),
    );
  }, SAVE_KEY);
  await page.reload();
  await dismissNotice(page);

  await expect(page.getByRole('status')).toContainText(
    'saved progress was updated for the expanded story edition',
  );
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByText('The Bus We Waited For', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Dialogue', { exact: true })).toContainText(
    'The morning after disappointment is rarely dramatic',
  );
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) return undefined;
        const save = JSON.parse(raw) as {
          storyRevision?: string;
          currentNodeId?: string;
          status?: string;
          unlockedChapters?: string[];
          seenNodeIds?: string[];
        };
        return {
          storyRevision: save.storyRevision,
          currentNodeId: save.currentNodeId,
          status: save.status,
          unlockedChapters: save.unlockedChapters,
          seenNodeIds: save.seenNodeIds,
        };
      }, SAVE_KEY),
    )
    .toMatchObject({
      storyRevision: 'school-years-4.0.0',
      currentNodeId: 'ch3-001',
      status: 'playing',
      unlockedChapters: [
        'prologue',
        'chapter-1',
        'chapter-2',
        'chapter-3',
      ],
      seenNodeIds: ['ch2-108'],
    });
});

test('resumes a completed JC edition at National Service and keeps later chapters locked', async ({ page }) => {
  await openApp(page);
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      storyId: 'return-to-me-school-years',
      storyRevision: 'school-years-2.0.0',
      currentNodeId: 'epilogue-end',
      status: 'ended',
      history: [{ kind: 'line', nodeId: 'epilogue-013' }],
      rememberedChoices: { 'ch5-choice-zoo': 'zoo-name-feeling' },
      unlockedChapters: ['prologue', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'epilogue'],
      seenNodeIds: ['ch5-038', 'epilogue-013', 'epilogue-end'],
      timestamp: Date.now(),
    }));
  }, SAVE_KEY);
  await page.reload();
  await dismissNotice(page);
  await expect(page.getByRole('status')).toContainText('saved progress was updated');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('The Story I Wasn’t In', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as unknown, SAVE_KEY)).toMatchObject({
    storyRevision: 'school-years-4.0.0',
    currentNodeId: 'ns-001',
    status: 'playing',
    history: [],
    rememberedChoices: { 'ch5-choice-zoo': 'zoo-name-feeling' },
    seenNodeIds: ['ch5-038'],
  });

  await page.getByRole('button', { name: 'Open chapter menu' }).click();
  const chapters = page.getByRole('dialog', { name: 'Chapter select' });
  await expect(chapters.getByRole('button', { name: /The Story I Wasn’t In/ })).toBeEnabled();
  for (const title of ['Almost Us', 'Just Friends', 'A Different Journey', 'Arrival']) {
    await expect(chapters.getByRole('button', { name: new RegExp(title) })).toBeDisabled();
  }
  await chapters.getByRole('button', { name: 'Close' }).click();
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('The Story I Wasn’t In', { exact: true })).toBeVisible();
});

for (const previousRevision of ['school-years-3.0.0', 'before-nurul-3.0.0']) {
  test(`distinguishes a completed ${previousRevision} save from the other branch`, async ({ page }) => {
    await openApp(page);
    await page.evaluate(({ key, revision }) => {
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        storyId: 'return-to-me-school-years',
        storyRevision: revision,
        currentNodeId: 'epilogue-end',
        status: 'ended',
        history: [],
        rememberedChoices: { 'ch5-choice-zoo': 'zoo-name-feeling' },
        unlockedChapters: ['prologue', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-6', 'epilogue'],
        seenNodeIds: ['epilogue-end'],
        timestamp: Date.now(),
      }));
    }, { key: SAVE_KEY, revision: previousRevision });
    await page.reload();
    await dismissNotice(page);
    await expect(page.getByRole('status')).toContainText('saved progress was updated');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    const completedAdulthood = previousRevision === 'school-years-3.0.0';
    if (completedAdulthood) {
      await expect(page.getByRole('heading', { name: 'To be continued' })).toBeVisible();
    } else {
      await expect(page.getByText('Almost Us', { exact: true })).toBeVisible();
    }
    await expect.poll(() => page.evaluate((key) =>
      JSON.parse(localStorage.getItem(key) ?? '{}') as unknown, SAVE_KEY,
    )).toMatchObject({
      storyRevision: story.revision,
      currentNodeId: completedAdulthood ? 'epilogue-end' : 'ch6-001',
      status: completedAdulthood ? 'ended' : 'playing',
      rememberedChoices: { 'ch5-choice-zoo': 'zoo-name-feeling' },
      unlockedChapters: expect.arrayContaining(['chapter-ns', 'chapter-6']),
    });
  });
}

test('unlocks National Service when advancing beyond the zoo and restores that position', async ({ page }) => {
  await openApp(page);
  await page.evaluate(({ key, revision }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      storyId: 'return-to-me-school-years',
      storyRevision: revision,
      currentNodeId: 'ch5-038',
      status: 'playing',
      history: [],
      rememberedChoices: {},
      unlockedChapters: ['prologue', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5'],
      seenNodeIds: [],
      timestamp: Date.now(),
    }));
  }, { key: SAVE_KEY, revision: story.revision });
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('The Zoo After Results', { exact: true })).toBeVisible();
  await revealAndAdvance(page);
  await expect(page.getByText('The Story I Wasn’t In', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as unknown, SAVE_KEY)).toMatchObject({
    currentNodeId: 'ns-001',
    unlockedChapters: ['prologue', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-ns'],
  });
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('The Story I Wasn’t In', { exact: true })).toBeVisible();
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
    chapterDialog.getByRole('button', { name: /Arrival/ }),
  ).toBeDisabled();
});

test('plays a complete route through eleven chapters and eighteen reconverging choices', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'desktop route audit only');
  test.setTimeout(180_000);

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
  for (let step = 0; step <= story.nodes.length; step += 1) {
    if (await page.getByRole('heading', { name: 'To be continued' }).isVisible()) {
      break;
    }

    const choice = page.getByLabel('Choice');
    if (await choice.isVisible()) {
      await choice
        .locator('button > span[aria-hidden="true"]')
        .first()
        .locator('..')
        .click();
      choiceCount += 1;
      continue;
    }

    await page.getByRole('button', { name: 'Advance dialogue' }).click();
  }

  await expect(page.getByRole('heading', { name: 'To be continued' })).toBeVisible();
  expect(choiceCount).toBe(18);
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
      choiceCount: 18,
      unlockedCount: 11,
    });
});
test('keeps subtitles and voice settings usable without licensed clips', async ({
  page,
}) => {
  await openApp(page);
  await startNewGame(page);

  const dialogue = page.getByLabel('Dialogue', { exact: true });
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
  await expect(page.getByLabel('Dialogue', { exact: true })).toBeVisible();
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

for (const artworkId of ['cg-jia-wen-boyfriend', 'cg-uss-confession']) {
  test(`preserves ${artworkId} composition above dialogue on portrait screens`, async ({
    page,
  }, testInfo) => {
    const node = story.nodes.find((candidate) => candidate.stage.backgroundId === artworkId);
    if (node === undefined) throw new Error(`No story scene uses ${artworkId}`);

    await openApp(page);
    await page.evaluate(({ key, revision, nodeId }) => {
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        storyId: 'return-to-me-school-years',
        storyRevision: revision,
        currentNodeId: nodeId,
        status: 'playing',
        history: [],
        rememberedChoices: {},
        unlockedChapters: ['prologue', 'chapter-6'],
        seenNodeIds: [],
        timestamp: Date.now(),
      }));
    }, { key: SAVE_KEY, revision: story.revision, nodeId: node.id });
    await page.reload();
    await dismissNotice(page);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    const stage = page.locator('figure[data-art-kind="cg"]');
    await expect(stage).toBeVisible();
    const composition = page.getByTestId('cg-composition');
    const background = stage.locator(':scope > img').first();
    await expect(background).toHaveAttribute('src', new RegExp(`${artworkId}\\.webp$`));

    if (testInfo.project.name !== 'mobile') {
      await expect(composition).toBeHidden();
      await expect(background).toHaveCSS('object-fit', 'cover');
      return;
    }

    await expect(composition).toBeVisible();
    await expect(composition).toHaveCSS('object-fit', 'contain');
    await expect.poll(() => composition.evaluate((element) => {
      const image = element as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    })).toBe(true);
    const imageRect = await composition.boundingBox();
    const dialogueRect = await page.getByLabel('Dialogue', { exact: true }).boundingBox();
    const viewport = page.viewportSize();
    expect(imageRect).not.toBeNull();
    expect(dialogueRect).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (imageRect === null || dialogueRect === null || viewport === null) return;

    expect(imageRect.width / imageRect.height).toBeCloseTo(16 / 9, 2);
    expect(imageRect.x).toBeGreaterThanOrEqual(0);
    expect(imageRect.y).toBeGreaterThanOrEqual(0);
    expect(imageRect.x + imageRect.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(imageRect.y + imageRect.height).toBeLessThanOrEqual(dialogueRect.y + 1);
    expect(imageRect.y + imageRect.height).toBeLessThanOrEqual(viewport.height);
  });
}

test('keeps intrusive thoughts labelled, static, and contained on mobile', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile project only');

  await openApp(page);
  await page.evaluate(
    ({ saveKey, settingsKey }) => {
      localStorage.setItem(
        settingsKey,
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
      localStorage.setItem(
        saveKey,
        JSON.stringify({
          version: 1,
          storyId: 'return-to-me-school-years',
          storyRevision: 'before-nurul-3.0.0',
          currentNodeId: 'epilogue-009',
          status: 'playing',
          history: [],
          rememberedChoices: {},
          unlockedChapters: [
            'prologue',
            'chapter-1',
            'chapter-2',
            'chapter-3',
            'chapter-4',
            'chapter-5',
            'chapter-6',
            'epilogue',
          ],
          seenNodeIds: [],
          timestamp: Date.now(),
        }),
      );
    },
    { saveKey: SAVE_KEY, settingsKey: SETTINGS_KEY },
  );
  await page.reload();
  await dismissNotice(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  const overlay = page.locator('[data-overlay-kind="intrusive"]');
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute('aria-label', /\S+/);
  await expect(overlay.locator('p').first()).toHaveCSS('animation-name', 'none');

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
