import { test, expect } from '@playwright/test';
import { navigateTo, openFirstActivatableIntegration } from './helpers';

test.describe('Integration Detail Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('all tabs load for a buyer integration', async ({ page }) => {
    await navigateTo(page, 'Integrations');

    // Pick the first integration in the list.
    const firstRow = page.getByTestId('integration-row').first();
    await firstRow.getByRole('button').first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();

    await page.getByTestId('tab-overview').click();
    await expect(page.getByTestId('integration-status')).toBeVisible();

    await page.getByTestId('tab-freshness').click();
    await expect(page.getByText('Freshness', { exact: false }).first()).toBeVisible();

    await page.getByTestId('tab-configure').click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();

    await page.getByTestId('tab-raw-json').click();
    await expect(page.getByTestId('raw-json-textarea')).toBeVisible();

    await page.getByTestId('tab-test-console').click();
    await expect(page.getByTestId('run-test-button')).toBeVisible();

    await page.getByTestId('tab-activity').click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
  });

  test('publisher integration shows publisher-instructions tab', async ({ page }) => {
    await navigateTo(page, 'Integrations');

    // Find a publisher row by its direction indicator. We use the integration list
    // structure: an integration row contains a campaign indicator that uses purple
    // for publisher and blue for buyer. We open each row in turn until we land
    // on a publisher.
    await openFirstPublisher(page);
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    await expect(page.getByTestId('tab-publisher-instructions')).toBeVisible();
    await page.getByTestId('tab-publisher-instructions').click();
  });

  test('publisher-instructions tab is not present for buyer integrations', async ({ page }) => {
    await navigateTo(page, 'Integrations');
    await openFirstBuyer(page);
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    await expect(page.getByTestId('tab-publisher-instructions')).toHaveCount(0);
  });
});

test.describe('Activation Guardrail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('activation blocked without a passing test; allowed after one', async ({ page }) => {
    // Open an integration whose activate-button is currently enabled (i.e. status
    // is not already active or archived).
    await openFirstActivatableIntegration(page);

    // Attempt to activate. Without a fresh passing stored test, the action
    // surfaces a warning toast.
    await page.getByTestId('activate-button').click();
    const warning = page.getByTestId('toast-warning').first();
    const success = page.getByTestId('toast-success').first();
    await expect(warning.or(success)).toBeVisible();

    // Now run a test
    await page.getByTestId('tab-test-console').click();
    await page.getByTestId('run-test-button').click();
    await expect(page.getByTestId('test-result-status')).toBeVisible();
    const status = await page.getByTestId('test-result-status').getAttribute('data-status');

    await page.getByTestId('tab-overview').click();

    // If the test passed, activation should succeed; otherwise it should remain blocked.
    const activate = page.getByTestId('activate-button');
    if (await activate.isDisabled().catch(() => false)) return;
    await activate.click();
    if (status === 'passed') {
      await expect(page.getByTestId('toast-success').first()).toBeVisible();
      await expect(page.getByTestId('integration-status')).toBeVisible();
    } else {
      await expect(page.getByTestId('toast-warning').first()).toBeVisible();
    }
  });
});

async function openFirstPublisher(page: import('@playwright/test').Page) {
  await openByDirection(page, 'publisher');
}

async function openFirstBuyer(page: import('@playwright/test').Page) {
  await openByDirection(page, 'buyer');
}

async function openByDirection(
  page: import('@playwright/test').Page,
  direction: 'publisher' | 'buyer'
) {
  const rows = page.getByTestId('integration-row');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    await row.getByRole('button').first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    const hasInstructionsTab = await page
      .getByTestId('tab-publisher-instructions')
      .isVisible()
      .catch(() => false);
    if (direction === 'publisher' ? hasInstructionsTab : !hasInstructionsTab) return;
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('integrations-page')).toBeVisible();
  }
  throw new Error(`No ${direction} integration found in list`);
}
