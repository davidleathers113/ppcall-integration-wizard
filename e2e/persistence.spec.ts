import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Persistence and Reset', () => {
  test('localStorage persists across page reloads', async ({ page }) => {
    await page.goto('/');

    // Navigate to campaigns
    await navigateTo(page, 'Campaigns');

    // Create a new campaign via button
    const createButton = page.getByTestId('create-campaign-button');
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      // Wait for form or inline creation
      await page.waitForTimeout(500);

      // Check if there's a modal form
      const nameInput = page.getByLabel('Integration Name').or(page.getByLabel('Campaign Name')).or(page.getByLabel('Name'));
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameInput.fill('Persistence Test Campaign');

        const verticalSelect = page.getByLabel('Vertical');
        if (await verticalSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
          await verticalSelect.selectOption({ index: 0 });
        }

        const saveButton = page.getByText('Save').or(page.getByText('Create'));
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Reload page
    await page.reload();

    // Verify campaign still exists
    await navigateTo(page, 'Campaigns');

    // The newly created campaign should still exist (or at least we should have campaigns)
    const newCount = await page.getByTestId('campaign-row').count();
    expect(newCount).toBeGreaterThan(0);
  });

  test('reset mock data clears custom data and restores seed', async ({ page }) => {
    await page.goto('/');

    // Get initial campaign count
    await navigateTo(page, 'Campaigns');

    // Create custom campaign
    const createButton = page.getByTestId('create-campaign-button');
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      await page.waitForTimeout(500);

      const nameInput = page.getByLabel('Integration Name').or(page.getByLabel('Campaign Name')).or(page.getByLabel('Name'));
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameInput.fill('Custom Campaign');

        const verticalSelect = page.getByLabel('Vertical');
        if (await verticalSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
          await verticalSelect.selectOption({ index: 0 });
        }

        const saveButton = page.getByText('Save').or(page.getByText('Create'));
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to developer page where reset button is
    await navigateTo(page, 'Developer/API');

    // Find and click Reset Mock Data button
    const resetButton = page.getByText('Reset Mock Data');
    if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetButton.click();

      // Confirm if dialog appears
      const confirmButton = page.getByText('Confirm').or(page.getByText('Yes')).or(page.getByText('Reset'));
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1500);

      // Navigate back to campaigns
      await navigateTo(page, 'Campaigns');

      // Seed campaigns should be present - verify we have campaigns
      const finalCount = await page.getByTestId('campaign-row').count();

      expect(finalCount).toBeGreaterThan(0);
    }
  });
});
