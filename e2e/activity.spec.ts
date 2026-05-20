import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Activity', () => {
  test('activity page lists events for tested + marked-used integrations', async ({ page }) => {
    await page.goto('/');

    // Pick an integration; run a test; mark it used
    await navigateTo(page, 'Integrations');
    await page.getByTestId('integration-row').first().getByRole('button').first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();

    await page.getByTestId('tab-test-console').click();
    await page.getByTestId('run-test-button').click();
    await expect(page.getByTestId('test-result-status')).toBeVisible();

    await page.getByTestId('tab-freshness').click();
    await page.getByTestId('mark-used-button').click();
    await expect(page.getByTestId('toast-info').first()).toBeVisible();

    // Confirm Activity page captures both events
    await navigateTo(page, 'Activity');
    const events = page.getByTestId('activity-event-row');
    await expect(events.first()).toBeVisible();

    const testedRow = page.locator('[data-testid="activity-event-row"][data-event-type="tested"]').first();
    const usedRow = page.locator('[data-testid="activity-event-row"][data-event-type="used"]').first();
    await expect(testedRow).toBeVisible();
    await expect(usedRow).toBeVisible();
  });
});
