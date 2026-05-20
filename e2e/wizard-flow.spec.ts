import { test, expect } from '@playwright/test';
import { setupConsoleMonitoring, navigateTo, createBuyerIntegrationThroughWizard } from './helpers';

test.describe('Integration Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create buyer integration through wizard', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);

    await navigateTo(page, 'Campaigns');
    const firstCampaignButton = page.getByTestId('campaign-row').first().getByRole('button').first();
    const campaignName = (await firstCampaignButton.textContent())?.trim() || '';
    expect(campaignName.length).toBeGreaterThan(0);

    const integrationName = 'E2E Wizard Buyer';
    await createBuyerIntegrationThroughWizard(page, {
      campaignName,
      integrationName,
      type: 'rtb',
      preset: 'generic_json_post',
      url: 'https://buyer.example.com/ping',
    });

    await expect(page.getByTestId('wizard-saved-step')).toBeVisible();

    // Open detail and confirm the integration was saved
    await page.getByTestId('wizard-open-detail-button').click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: integrationName })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('wizard should load and allow direction selection', async ({ page }) => {
    await navigateTo(page, 'Add Integration');
    await expect(page.getByTestId('wizard-page')).toBeVisible();

    await expect(page.getByTestId('wizard-direction-buyer')).toBeVisible();
    await expect(page.getByTestId('wizard-direction-publisher')).toBeVisible();
    await page.getByTestId('wizard-direction-buyer').click();

    const continueButton = page.getByTestId('wizard-continue-button');
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // Now on type step — buyer-direction options surface as direct/RTB labels.
    await expect(page.getByTestId('wizard-type-rtb')).toBeVisible();
    await expect(page.getByTestId('wizard-type-direct-number')).toBeVisible();
    await expect(page.getByTestId('wizard-type-direct-sip')).toBeVisible();
    await expect(page.getByTestId('wizard-type-webhook')).toBeVisible();
  });
});
