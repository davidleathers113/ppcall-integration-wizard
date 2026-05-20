import { test, expect, Page } from '@playwright/test';
import { navigateTo } from './helpers';

async function openFirstBuyerConfigure(page: Page) {
  await navigateTo(page, 'Integrations');
  const rows = page.getByTestId('integration-row');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    await row.getByRole('button').first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    const isPublisher = await page
      .getByTestId('tab-publisher-instructions')
      .isVisible()
      .catch(() => false);
    if (!isPublisher) {
      await page.getByTestId('tab-configure').click();
      await expect(page.getByTestId('buyer-config-form')).toBeVisible();
      return;
    }
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('integrations-page')).toBeVisible();
  }
  throw new Error('No buyer integration with configure tab found');
}

test.describe('Buyer Advanced Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await openFirstBuyerConfigure(page);
  });

  test('switches destination mode and reveals dynamic path input', async ({ page }) => {
    await page.getByTestId('buyer-section-destination').click();
    await page
      .getByTestId('destination-mode-dynamic_number_from_response')
      .click();
    await expect(
      page.getByTestId('destination-dynamic-number-path')
    ).toBeVisible();
    await page
      .getByTestId('destination-dynamic-number-path')
      .fill('$.lead.phone_number');

    // Verify the value persists when navigating away and back.
    await page.getByTestId('buyer-section-request').click();
    await page.getByTestId('buyer-section-destination').click();
    await expect(
      page.getByTestId('destination-dynamic-number-path')
    ).toHaveValue('$.lead.phone_number');
  });

  test('adds a filter rule and persists it', async ({ page }) => {
    await page.getByTestId('buyer-section-filters').click();
    await page.getByTestId('filter-add-button').click();
    await expect(page.getByTestId('filter-row-0')).toBeVisible();
    await page
      .getByTestId('filter-field-0')
      .selectOption({ value: 'state' });
    await page
      .getByTestId('filter-operator-0')
      .selectOption({ value: 'equals' });
    await page.getByTestId('filter-value-0').fill('FL');

    // Navigate away and back to confirm the filter persists.
    await page.getByTestId('buyer-section-destination').click();
    await page.getByTestId('buyer-section-filters').click();
    await expect(page.getByTestId('filter-value-0')).toHaveValue('FL');
  });

  test('configures caps + schedule + timezone', async ({ page }) => {
    await page.getByTestId('buyer-section-caps-schedule').click();
    await page.getByTestId('caps-daily').fill('100');
    await page.getByTestId('caps-hourly').fill('15');
    await page
      .getByTestId('schedule-timezone')
      .selectOption({ value: 'America/Chicago' });
    await page
      .getByTestId('schedule-mode')
      .selectOption({ value: 'basic' });
    await page.getByTestId('schedule-day-Mon').click();
    // Navigate away and back to confirm values stick.
    await page.getByTestId('buyer-section-destination').click();
    await page.getByTestId('buyer-section-caps-schedule').click();
    await expect(page.getByTestId('caps-daily')).toHaveValue('100');
    await expect(page.getByTestId('caps-hourly')).toHaveValue('15');
    await expect(page.getByTestId('schedule-timezone')).toHaveValue(
      'America/Chicago'
    );
  });

  test('reveals override fields under revenue override mode', async ({ page }) => {
    await page.getByTestId('buyer-section-revenue-errors').click();
    await page.getByTestId('revenue-mode-override').click();
    await expect(page.getByTestId('revenue-payout')).toBeVisible();
    await page.getByTestId('revenue-payout').fill('42');
    await page.getByTestId('buyer-section-destination').click();
    await page.getByTestId('buyer-section-revenue-errors').click();
    await expect(page.getByTestId('revenue-payout')).toHaveValue('42');
  });

  test('configures restrict duplicates with a window', async ({ page }) => {
    await page.getByTestId('buyer-section-advanced').click();
    await page.getByTestId('duplicate-mode-restrict').click();
    await expect(page.getByTestId('duplicate-window')).toBeVisible();
    await page.getByTestId('duplicate-window').fill('45');
    await page.getByTestId('buyer-section-destination').click();
    await page.getByTestId('buyer-section-advanced').click();
    await expect(page.getByTestId('duplicate-window')).toHaveValue('45');
  });

  test('raw JSON reflects advanced config changes', async ({ page }) => {
    await page.getByTestId('buyer-section-advanced').click();
    await page.getByTestId('duplicate-mode-restrict').click();
    await page.getByTestId('duplicate-window').fill('30');

    await page.getByTestId('tab-raw-json').click();
    const textarea = page.getByTestId('raw-json-textarea');
    await expect(textarea).toBeVisible();
    const json = (await textarea.inputValue()) || '';
    expect(json.includes('"duplicateRules"')).toBeTruthy();
    expect(json.includes('"windowMinutes": 30')).toBeTruthy();
  });
});
