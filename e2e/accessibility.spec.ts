import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { dismissNotice, openApp } from './helpers';

async function expectNoWcagViolations(
  page: Page,
  context: string,
): Promise<void> {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => undefined)));
  });
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations,
    `${context}: ${results.violations
      .map((violation) => `${violation.id} (${violation.nodes.length})`)
      .join(', ')}`,
  ).toEqual([]);
}

test('notice, title, and first dialogue meet automated WCAG checks', async ({
  page,
}) => {
  await openApp(page);
  await expectNoWcagViolations(page, 'notice');

  await dismissNotice(page);
  await expectNoWcagViolations(page, 'title');

  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.getByLabel('Dialogue')).toBeVisible();
  await expectNoWcagViolations(page, 'game');

  await page.getByRole('button', { name: 'Open reading menu' }).click();
  await expectNoWcagViolations(page, 'reading menu');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expectNoWcagViolations(page, 'reading preferences');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'View artwork', exact: true }).click();
  await expectNoWcagViolations(page, 'full artwork viewer');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Open reading menu' }).click();
  await page.getByRole('button', { name: 'Offline & install', exact: true }).click();
  await expectNoWcagViolations(page, 'offline artwork and voices');
});
