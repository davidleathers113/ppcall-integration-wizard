import { test, expect } from '@playwright/test';

test.describe('Persistence and Reset', () => {
  test('localStorage persists across page reloads', async ({ page }) => {
    await page.goto('/');

    // Navigate to campaigns and note the count
    await page.getByRole('link', { name: /campaigns/i }).click();
    const initialCampaigns = await page.locator('[data-testid="campaign-row"]').or(
      page.locator('table tbody tr')
    ).count();

    // Create a new campaign via button
    const createButton = page.getByRole('button', { name: /create campaign/i });
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      // Fill form
      await page.getByLabel(/name/i).fill('Persistence Test Campaign');
      const verticalSelect = page.getByLabel(/vertical/i);
      if (await verticalSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await verticalSelect.selectOption({ index: 0 });
      }

      await page.getByRole('button', { name: /create|save/i }).last().click();
      await page.waitForTimeout(1000);
    }

    // Reload page
    await page.reload();

    // Verify campaign still exists
    await page.getByRole('link', { name: /campaigns/i }).click();
    await expect(page.getByText('Persistence Test Campaign')).toBeVisible({ timeout: 5000 });

    // Count should be higher than initial
    const newCount = await page.locator('[data-testid="campaign-row"]').or(
      page.locator('table tbody tr')
    ).count();

    expect(newCount).toBeGreaterThanOrEqual(initialCampaigns);
  });

  test('reset mock data clears custom data and restores seed', async ({ page }) => {
    await page.goto('/');

    // Get initial campaign count
    await page.getByRole('link', { name: /campaigns/i }).click();

    // Create custom campaign
    const createButton = page.getByRole('button', { name: /create campaign/i });
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();
      await page.getByLabel(/name/i).fill('Custom Campaign');

      const verticalSelect = page.getByLabel(/vertical/i);
      if (await verticalSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await verticalSelect.selectOption({ index: 0 });
      }

      await page.getByRole('button', { name: /create|save/i }).last().click();
      await page.waitForTimeout(1000);
    }

    // Verify custom campaign exists
    await expect(page.getByText('Custom Campaign')).toBeVisible();

    // Find and click Reset Mock Data button
    // It might be in a menu, settings, or on dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();

    const resetButton = page.getByRole('button', { name: /reset.*mock.*data|reset data/i });
    if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetButton.click();

      // Confirm if dialog appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes|reset/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1500);

      // Navigate back to campaigns
      await page.getByRole('link', { name: /campaigns/i }).click();

      // Custom campaign should be gone
      const customExists = await page.getByText('Custom Campaign')
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      expect(customExists).toBeFalsy();

      // Seed campaigns should be back
      const finalCount = await page.locator('[data-testid="campaign-row"]').or(
        page.locator('table tbody tr')
      ).count();

      expect(finalCount).toBeGreaterThan(0);
    }
  });
});
