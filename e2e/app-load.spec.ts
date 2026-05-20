import { test, expect } from '@playwright/test';
import { setupConsoleMonitoring, navigateTo } from './helpers';

test.describe('App Load', () => {
  test('should load app successfully with no console errors', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);

    await page.goto('/');

    // Verify app loaded - title check can use regex as it's checking document title
    await expect(page).toHaveTitle(/PPCall Integration Studio|Integration Studio/i);

    // Verify sidebar rendered
    await expect(page.getByRole('navigation')).toBeVisible();

    // Verify dashboard is default view using data-testid
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('should display seeded campaigns', async ({ page }) => {
    await page.goto('/');

    // Navigate to campaigns using helper function (no regex)
    await navigateTo(page, 'Campaigns');

    // Verify campaign list renders using data-testid
    await expect(page.getByTestId('campaigns-page')).toBeVisible();

    // Verify at least one seeded campaign exists using data-testid
    const campaignRows = page.getByTestId('campaign-row');
    await expect(campaignRows.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display seeded integrations', async ({ page }) => {
    await page.goto('/');

    // Navigate to integrations using helper function (no regex)
    await navigateTo(page, 'Integrations');

    // Verify integration list renders using data-testid
    await expect(page.getByTestId('integrations-page')).toBeVisible();

    // Verify at least one integration exists using data-testid
    const integrationRows = page.getByTestId('integration-row');
    await expect(integrationRows.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');

    // Dashboard - use data-testid for navigation
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Campaigns
    await page.getByTestId('nav-campaigns').click();
    await expect(page.getByTestId('campaigns-page')).toBeVisible();

    // Integrations
    await page.getByTestId('nav-integrations').click();
    await expect(page.getByTestId('integrations-page')).toBeVisible();

    // Test Console
    await page.getByTestId('nav-test-console').click();
    await expect(page.getByTestId('test-console-page')).toBeVisible();

    // Activity
    await page.getByTestId('nav-activity').click();
    await expect(page.getByTestId('activity-page')).toBeVisible({ timeout: 5000 });
  });
});
