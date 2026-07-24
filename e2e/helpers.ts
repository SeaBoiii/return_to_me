import { expect, type Page } from '@playwright/test';

export const SAVE_KEY = 'return-to-me:save:v1';
export const SETTINGS_KEY = 'return-to-me:settings:v1';

export async function openApp(page: Page): Promise<void> {
  await page.goto('./');
  await expect(page).toHaveURL(/\/return-to-me-test\/$/);
}

export async function dismissNotice(page: Page): Promise<void> {
  const notice = page.getByRole('dialog', {
    name: 'A note before we begin',
  });
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Continue to title' }).click();
  await expect(notice).toBeHidden();
}

export async function startNewGame(page: Page): Promise<void> {
  await dismissNotice(page);
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Dialogue', exact: true }),
  ).toBeVisible();
}

export async function revealAndAdvance(page: Page): Promise<void> {
  const reveal = page.getByRole('button', { name: 'Reveal full line' });
  if (await reveal.isVisible()) {
    await reveal.click();
  }

  const advance = page.getByRole('button', { name: 'Advance dialogue' });
  await expect(advance).toBeVisible();
  await advance.click();
}
