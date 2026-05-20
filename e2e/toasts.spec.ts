import { test, expect } from '@playwright/test';
import {
  navigateTo,
  createBuyerIntegrationThroughWizard,
  openFirstActivatableIntegration,
} from './helpers';

test.describe('Toast notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('campaign created surfaces a success toast', async ({ page }) => {
    await navigateTo(page, 'Campaigns');
    await page.getByTestId('create-campaign-button').click();
    const toast = page.getByTestId('toast-success').first();
    await expect(toast).toBeVisible();
    const text = (await toast.getByTestId('toast').textContent()) || '';
    expect(text.toLowerCase().includes('campaign')).toBeTruthy();
  });

  test('reset mock data surfaces an info toast', async ({ page }) => {
    await navigateTo(page, 'Developer/API');
    await page.getByTestId('reset-mock-data-button').click();
    await expect(page.getByTestId('toast-info').first()).toBeVisible();
  });

  test('draft integration created via wizard surfaces a success toast', async ({ page }) => {
    await navigateTo(page, 'Campaigns');
    const firstCampaignButton = page.getByTestId('campaign-row').first().getByRole('button').first();
    const campaignName = ((await firstCampaignButton.textContent()) || '').trim();

    await createBuyerIntegrationThroughWizard(page, {
      campaignName,
      integrationName: `Toast Test ${Date.now()}`,
      type: 'rtb',
      preset: 'custom',
    });

    await expect(page.getByTestId('toast-success').first()).toBeVisible();
  });

  test('test run + activation surface toast feedback', async ({ page }) => {
    await openFirstActivatableIntegration(page);

    await page.getByTestId('tab-test-console').click();
    await page.getByTestId('run-test-button').click();
    await expect(page.getByTestId('test-result-status')).toBeVisible();

    const successToast = page.getByTestId('toast-success').first();
    const errorToast = page.getByTestId('toast-error').first();
    await expect(successToast.or(errorToast)).toBeVisible();

    await page.getByTestId('tab-overview').click();
    const activate = page.getByTestId('activate-button');
    if (await activate.isDisabled().catch(() => false)) return;
    await activate.click();
    const success = page.getByTestId('toast-success').first();
    const warning = page.getByTestId('toast-warning').first();
    await expect(success.or(warning)).toBeVisible();
  });
});
