import { test, expect } from '@playwright/test';
import { setupConsoleMonitoring } from './helpers';

test.describe('App Load', () => {
  test('should load app successfully with no console errors', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);

    await page.goto('/');

    // Verify app loaded
    await expect(page).toHaveTitle(/PPCall Integration Studio|Integration Studio/i);

    // Verify sidebar rendered
    await expect(page.getByRole('navigation')).toBeVisible();

    // Verify dashboard is default view
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('should display seeded campaigns', async ({ page }) => {
    await page.goto('/');

    // Navigate to campaigns
    await page.getByRole('link', { name: /campaigns/i }).click();

    // Verify campaign list renders
    await expect(page.getByRole('heading', { name: /campaigns/i })).toBeVisible();

    // Verify at least one seeded campaign exists
    const campaignRows = page.locator('[data-testid="campaign-row"]').or(
      page.locator('table tbody tr, [role="row"]')
    );

    await expect(campaignRows.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display seeded integrations', async ({ page }) => {
    await page.goto('/');

    // Navigate to integrations
    await page.getByRole('link', { name: /integrations/i }).click();

    // Verify integration list renders
    await expect(page.getByRole('heading', { name: /integrations/i })).toBeVisible();

    // Verify at least one integration exists
    const integrationRows = page.locator('[data-testid="integration-row"]').or(
      page.locator('table tbody tr, .integration-item')
    );

    await expect(integrationRows.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');

    // Dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Campaigns
    await page.getByRole('link', { name: /campaigns/i }).click();
    await expect(page.getByRole('heading', { name: /campaigns/i })).toBeVisible();

    // Integrations
    await page.getByRole('link', { name: /integrations/i }).click();
    await expect(page.getByRole('heading', { name: /integrations/i })).toBeVisible();

    // Test Console
    const testConsoleLink = page.getByRole('link', { name: /test console/i });
    if (await testConsoleLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await testConsoleLink.click();
      await expect(page.getByRole('heading', { name: /test console/i })).toBeVisible();
    }

    // Activity
    const activityLink = page.getByRole('link', { name: /activity/i });
    if (await activityLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await activityLink.click();
      await expect(page.getByRole('heading', { name: /activity/i })).toBeVisible();
    }
  });
});
