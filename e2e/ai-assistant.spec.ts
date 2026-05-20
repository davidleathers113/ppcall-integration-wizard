import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

const INSTRUCTIONS =
  'POST to https://buyer.example.com/ping with caller_id, zip, and state. ' +
  'If accepted=true, use phone_number as the transfer destination. ' +
  'Bid is returned as payout. Reject reason is returned as reason.';

test.describe('AI Assistant', () => {
  test('generates a proposal and applies it as a draft', async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'AI Assistant');
    await expect(page.getByTestId('ai-assistant-page')).toBeVisible();

    await page.getByTestId('ai-instructions-textarea').fill(INSTRUCTIONS);
    await page.getByTestId('ai-generate-button').click();

    // Proposal block appears once analysis completes
    await expect(page.getByTestId('ai-proposal')).toBeVisible();

    // Configure draft name + campaign
    const draftName = `AI Draft ${Date.now()}`;
    await page.getByTestId('ai-draft-name-input').fill(draftName);

    // Select first campaign option
    const campaignSelect = page.getByTestId('ai-campaign-select');
    await campaignSelect.selectOption({ index: 0 });

    await page.getByTestId('ai-apply-button').click();

    // Success toast confirms draft created
    await expect(page.getByTestId('toast-success').first()).toBeVisible();

    // App opens the integration detail
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: draftName })).toBeVisible();

    // Open Raw JSON tab and verify URL was extracted into config
    await page.getByTestId('tab-raw-json').click();
    const jsonText = (await page.getByTestId('raw-json-textarea').inputValue()) || '';
    expect(jsonText.includes('https://buyer.example.com/ping')).toBeTruthy();
  });
});
