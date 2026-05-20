import { test, expect } from '@playwright/test';
import { setupConsoleMonitoring } from './helpers';

test.describe('Integration Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create buyer integration through wizard', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);

    // Navigate to Add Integration (look in sidebar or button)
    const addButton = page.getByRole('button', { name: /add integration/i }).or(
      page.getByRole('link', { name: /add integration|wizard/i })
    );
    await addButton.click();

    // Step 1: Direction - Choose Buyer
    await expect(page.getByText(/choose direction|buyer.*destination/i)).toBeVisible();
    await page.getByRole('button', { name: /buyer|destination/i }).first().click();

    // Move to next step
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 2: Type - Choose RTB
    await page.getByRole('button', { name: /rtb/i }).first().click();
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 3: Campaign and Name
    const campaignSelect = page.getByLabel(/campaign/i).or(page.locator('select').first());
    await campaignSelect.selectOption({ index: 1 }); // Select first campaign

    await page.getByLabel(/integration name|name/i).fill('E2E Test Buyer Integration');
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 4: Preset (if shown)
    const presetButton = page.getByRole('button', { name: /generic.*json.*post|custom/i });
    if (await presetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await presetButton.first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();
    }

    // Continue through any remaining configuration steps
    // Look for Save Draft or Finish
    let attempts = 0;
    while (attempts < 5) {
      const saveButton = page.getByRole('button', { name: /save draft|finish|create/i });
      if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveButton.click();
        break;
      }

      const nextButton = page.getByRole('button', { name: /next|continue/i });
      if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click();
        attempts++;
      } else {
        break;
      }
    }

    // Wait for success or navigation
    await page.waitForTimeout(1500);

    // Verify integration was created - either we're on detail page or we see success message
    const onDetailPage = await page.getByRole('heading', { name: /E2E Test Buyer Integration/i })
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    const successMessage = await page.getByText(/created|saved|success/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(onDetailPage || successMessage).toBeTruthy();

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should create draft with needs_testing status', async ({ page }) => {
    // Create integration through wizard
    const addButton = page.getByRole('button', { name: /add integration/i }).or(
      page.getByRole('link', { name: /add integration|wizard/i })
    );
    await addButton.click();

    // Quick flow - buyer/rtb
    await page.getByRole('button', { name: /buyer|destination/i }).first().click();
    await page.getByRole('button', { name: /next/i }).click();

    await page.getByRole('button', { name: /rtb/i }).first().click();
    await page.getByRole('button', { name: /next/i }).click();

    const campaignSelect = page.getByLabel(/campaign/i).or(page.locator('select').first());
    await campaignSelect.selectOption({ index: 1 });
    await page.getByLabel(/integration name|name/i).fill('Status Test Integration');
    await page.getByRole('button', { name: /next/i }).click();

    // Skip through steps to save
    for (let i = 0; i < 5; i++) {
      const saveButton = page.getByRole('button', { name: /save draft|finish/i });
      if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveButton.click();
        break;
      }
      await page.getByRole('button', { name: /next/i }).click().catch(() => {});
    }

    await page.waitForTimeout(1000);

    // Navigate to integrations list
    await page.getByRole('link', { name: /integrations/i }).click();

    // Find our integration
    await expect(page.getByText('Status Test Integration')).toBeVisible({ timeout: 5000 });

    // Verify status is NOT active
    const activeStatus = await page.getByText(/^active$/i)
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(activeStatus).toBeFalsy();

    // Should be draft or needs_testing
    const validStatus = await page.getByText(/draft|needs.*testing/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(validStatus).toBeTruthy();
  });
});
