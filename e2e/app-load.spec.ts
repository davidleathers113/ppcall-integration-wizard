import { test, expect } from '@playwright/test';
import { setupConsoleMonitoring, navigateTo } from './helpers';

test.describe('App Load', () => {
  test('should load app successfully with no console errors', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);

    await page.goto('/');

    // No-regex title check: assert via string includes
    const title = await page.title();
    const lowered = title.toLowerCase();
    expect(lowered.includes('integration studio')).toBeTruthy();

    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('should display seeded campaigns', async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'Campaigns');
    await expect(page.getByTestId('campaigns-page')).toBeVisible();
    await expect(page.getByTestId('campaign-row').first()).toBeVisible();
  });

  test('should display seeded integrations', async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'Integrations');
    await expect(page.getByTestId('integrations-page')).toBeVisible();
    await expect(page.getByTestId('integration-row').first()).toBeVisible();
  });

  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    await page.getByTestId('nav-campaigns').click();
    await expect(page.getByTestId('campaigns-page')).toBeVisible();

    await page.getByTestId('nav-integrations').click();
    await expect(page.getByTestId('integrations-page')).toBeVisible();

    await page.getByTestId('nav-test-console').click();
    await expect(page.getByTestId('test-console-page')).toBeVisible();

    await page.getByTestId('nav-activity').click();
    await expect(page.getByTestId('activity-page')).toBeVisible();

    await page.getByTestId('nav-ai-assistant').click();
    await expect(page.getByTestId('ai-assistant-page')).toBeVisible();

    await page.getByTestId('nav-developer').click();
    await expect(page.getByTestId('developer-docs-page')).toBeVisible();

    await page.getByTestId('nav-bulk-import').click();
    await expect(page.getByTestId('bulk-import-page')).toBeVisible();
  });
});
