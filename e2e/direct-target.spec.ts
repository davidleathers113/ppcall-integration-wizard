import { test, expect, Page } from '@playwright/test';
import { navigateTo, setupConsoleMonitoring } from './helpers';

/**
 * Direct Target Mode E2E tests.
 *
 * Direct targets route calls to a number or SIP destination. They do NOT
 * make HTTP requests and do NOT use response parsing. The wizard should
 * skip request/parser steps, the configure tab should show direct-target
 * sections, and the test console should run direct-target checks.
 *
 * No regex anywhere in this file. All assertions use string methods.
 */

async function getFirstCampaignName(page: Page): Promise<string> {
  await navigateTo(page, 'Campaigns');
  const firstCampaignButton = page
    .getByTestId('campaign-row')
    .first()
    .getByRole('button')
    .first();
  const text = (await firstCampaignButton.textContent()) || '';
  return text.trim();
}

async function startDirectTargetWizard(
  page: Page,
  campaignName: string,
  integrationName: string,
  kind: 'direct-number' | 'direct-sip',
) {
  await navigateTo(page, 'Add Integration');
  await page.getByTestId('wizard-direction-buyer').click();
  await page.getByTestId('wizard-continue-button').click();

  await page.getByTestId(`wizard-type-${kind}`).click();
  await page.getByTestId('wizard-continue-button').click();

  await page.getByTestId('campaign-select').selectOption({ label: campaignName });
  await page.getByTestId('integration-name-input').fill(integrationName);
  await page.getByTestId('wizard-continue-button').click();

  // Step 4: preset - click "custom" or any visible preset
  const customPreset = page.getByTestId('wizard-preset-custom');
  await expect(customPreset).toBeVisible();
  await customPreset.click();
}

async function walkContinueUntilSave(page: Page) {
  for (let i = 0; i < 8; i++) {
    const saveButton = page.getByTestId('wizard-save-draft-button');
    if (await saveButton.isVisible().catch(() => false)) return;
    const continueButton = page.getByTestId('wizard-continue-button');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }
  throw new Error('Did not reach the Save Draft step');
}

test.describe('Direct Target Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('creates a Direct Number Target through the wizard', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);
    const campaignName = await getFirstCampaignName(page);
    expect(campaignName.length).toBeGreaterThan(0);

    const integrationName = 'E2E Direct Number';
    await startDirectTargetWizard(page, campaignName, integrationName, 'direct-number');

    // Step 5: destination + payout + conversion
    await page.getByTestId('wizard-direct-number-input').fill('+18005551212');
    // Payout (NumberField - find by label fallback). Use placeholder by label is harder; instead select by tag.
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('35');
    await numberInputs.nth(1).fill('120');

    // Confirm step 6 ("Response Parsing") shows the "no parsing required" panel
    // by walking continue once and looking for the marker, then continuing again
    // until Save Draft appears.
    await page.getByTestId('wizard-continue-button').click();
    await expect(page.getByTestId('wizard-no-parsing-required')).toBeVisible();

    await walkContinueUntilSave(page);
    await page.getByTestId('wizard-save-draft-button').click();
    await expect(page.getByTestId('wizard-saved-step')).toBeVisible();

    // Open detail and verify integration was saved as draft (not active).
    await page.getByTestId('wizard-open-detail-button').click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: integrationName })).toBeVisible();
    const status = (await page.getByTestId('integration-status').textContent()) || '';
    const normalized = status.toLowerCase().split(' ').join('');
    expect(normalized.includes('active')).toBe(false);

    expect(consoleErrors).toHaveLength(0);
  });

  test('Direct Number Configure tab shows direct sections and hides HTTP sections', async ({
    page,
  }) => {
    const campaignName = await getFirstCampaignName(page);
    const integrationName = 'E2E Direct Number Config';
    await startDirectTargetWizard(page, campaignName, integrationName, 'direct-number');
    await page.getByTestId('wizard-direct-number-input').fill('+18005551212');
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('35');
    await numberInputs.nth(1).fill('120');
    await walkContinueUntilSave(page);
    await page.getByTestId('wizard-save-draft-button').click();
    await expect(page.getByTestId('wizard-saved-step')).toBeVisible();
    await page.getByTestId('wizard-open-detail-button').click();

    // Configure tab → expect direct sections, not RTB sections.
    await page.getByTestId('tab-configure').click();
    await expect(page.getByTestId('buyer-config-form')).toBeVisible();

    await expect(page.getByTestId('buyer-section-destination')).toBeVisible();
    await expect(page.getByTestId('buyer-section-call-handling')).toBeVisible();
    await expect(page.getByTestId('buyer-section-caps-schedule')).toBeVisible();
    await expect(page.getByTestId('buyer-section-duplicate-rules')).toBeVisible();
    await expect(page.getByTestId('buyer-section-revenue-recovery')).toBeVisible();
    await expect(page.getByTestId('buyer-section-shareable-tags')).toBeVisible();
    await expect(page.getByTestId('buyer-section-predictive-routing')).toBeVisible();

    // RTB-only sections must NOT be present.
    expect(await page.getByTestId('buyer-section-request').isVisible().catch(() => false)).toBe(
      false,
    );
    expect(
      await page.getByTestId('buyer-section-response-parsing').isVisible().catch(() => false),
    ).toBe(false);
    expect(await page.getByTestId('buyer-section-filters').isVisible().catch(() => false)).toBe(
      false,
    );
    expect(
      await page.getByTestId('buyer-section-revenue-errors').isVisible().catch(() => false),
    ).toBe(false);
    expect(await page.getByTestId('buyer-section-advanced').isVisible().catch(() => false)).toBe(
      false,
    );

    // Number editor input present and shows valid status.
    await expect(page.getByTestId('direct-target-number')).toBeVisible();
    await expect(page.getByTestId('direct-target-number-status')).toBeVisible();
  });

  test('Test Console for direct target runs direct-target checks, no HTTP checks', async ({
    page,
  }) => {
    const campaignName = await getFirstCampaignName(page);
    const integrationName = 'E2E Direct Number Test';
    await startDirectTargetWizard(page, campaignName, integrationName, 'direct-number');
    await page.getByTestId('wizard-direct-number-input').fill('+18005551212');
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('35');
    await numberInputs.nth(1).fill('120');
    await walkContinueUntilSave(page);
    await page.getByTestId('wizard-save-draft-button').click();
    await page.getByTestId('wizard-open-detail-button').click();

    await page.getByTestId('tab-test-console').click();
    await page.getByTestId('run-test-button').click();
    await expect(page.getByTestId('test-result-status')).toBeVisible();

    const checklist = page.getByTestId('test-checklist');
    const checklistText = (await checklist.textContent()) || '';
    const lowered = checklistText.toLowerCase();
    expect(lowered.includes('destination number')).toBe(true);
    expect(lowered.includes('payout')).toBe(true);
    expect(lowered.includes('conversion duration')).toBe(true);
    expect(lowered.includes('endpoint url')).toBe(false);
    expect(lowered.includes('http method')).toBe(false);
  });

  test('creates a Direct SIP Target through the wizard', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);
    const campaignName = await getFirstCampaignName(page);
    const integrationName = 'E2E Direct SIP';
    await startDirectTargetWizard(page, campaignName, integrationName, 'direct-sip');

    await page.getByTestId('wizard-direct-sip-input').fill('sip:buyer@example.com');
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('35');
    await numberInputs.nth(1).fill('120');

    await page.getByTestId('wizard-continue-button').click();
    await expect(page.getByTestId('wizard-no-parsing-required')).toBeVisible();

    await walkContinueUntilSave(page);
    await page.getByTestId('wizard-save-draft-button').click();
    await expect(page.getByTestId('wizard-saved-step')).toBeVisible();

    await page.getByTestId('wizard-open-detail-button').click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();

    // Test console — SIP checks present.
    await page.getByTestId('tab-test-console').click();
    await page.getByTestId('run-test-button').click();
    await expect(page.getByTestId('test-result-status')).toBeVisible();
    const checklistText =
      (await page.getByTestId('test-checklist').textContent()) || '';
    const lowered = checklistText.toLowerCase();
    expect(lowered.includes('sip address')).toBe(true);

    expect(consoleErrors).toHaveLength(0);
  });

  test('CSV import creates a Direct Number Target as needs_testing or draft', async ({
    page,
  }) => {
    // No status column — row should validate as "ready" and default to draft.
    const csv =
      'integration_name,campaign,direction,type,buyer_destination_kind,target_mode,number,connection_timeout_seconds,daily_cap,concurrency_cap,schedule_timezone,schedule_mode,payout,conversion_duration_seconds\n' +
      'E2E CSV Direct Number,HVAC Inbound,buyer,static_number,direct_number,number,+18005551313,30,100,5,America/New_York,always_open,35,120';

    await navigateTo(page, 'Bulk Import');
    await page.getByTestId('bulk-import-mode-csv').click();
    await page.getByTestId('bulk-import-textarea').fill(csv);
    await page.getByTestId('bulk-import-parse-button').click();
    const validateButton = page.getByTestId('bulk-import-validate-button');
    if (await validateButton.isVisible().catch(() => false)) {
      await validateButton.click();
    }
    const previewButton = page.getByTestId('bulk-import-preview-button');
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click();
    }
    await page.getByTestId('bulk-import-import-button').click();
    await expect(page.getByTestId('bulk-import-result')).toBeVisible();

    await navigateTo(page, 'Integrations');
    await expect(
      page.getByRole('button', { name: 'E2E CSV Direct Number' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'E2E CSV Direct Number' }).first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    const status = (await page.getByTestId('integration-status').textContent()) || '';
    const lowered = status.toLowerCase().split(' ').join('');
    // Imported direct targets cannot be active without a passing test.
    expect(lowered.includes('active')).toBe(false);
  });

  test('AI Assistant produces a Direct Number proposal from natural-language input', async ({
    page,
  }) => {
    await navigateTo(page, 'AI Assistant');
    const instructions =
      'Send calls to +18005551212. Buyer pays $35 after 120 seconds. ' +
      'Hours are Monday through Friday 8am to 6pm Eastern. Daily cap is 100.';

    await page.getByTestId('ai-instructions-textarea').fill(instructions);
    await page.getByTestId('ai-generate-button').click();
    await expect(page.getByTestId('ai-proposal')).toBeVisible({ timeout: 5000 });

    const proposalText = (await page.getByTestId('ai-proposal').textContent()) || '';
    const lowered = proposalText.toLowerCase();
    expect(lowered.includes('direct_number')).toBe(true);
    expect(proposalText.includes('+18005551212')).toBe(true);

    await page.getByTestId('ai-draft-name-input').fill('AI Direct Number');
    await page.getByTestId('ai-apply-button').click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Direct Number' })).toBeVisible();
  });
});
