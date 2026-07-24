import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { dismissNotice, openApp } from './helpers';

async function expectNoWcagViolations(
  builder: AxeBuilder,
  context: string,
): Promise<void> {
  const results = await builder
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
  await expectNoWcagViolations(new AxeBuilder({ page }), 'notice');

  await dismissNotice(page);
  await expectNoWcagViolations(new AxeBuilder({ page }), 'title');

  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await expect(page.getByLabel('Dialogue')).toBeVisible();
  await expectNoWcagViolations(new AxeBuilder({ page }), 'game');
});
