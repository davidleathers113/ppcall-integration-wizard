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
  for (let i = 0; i < 12; i++) {
    const saveButton = page.getByTestId('wizard-save-draft-button');
    if (await saveButton.isVisible().catch(() => false)) return;
    const continueButton = page.getByTestId('wizard-continue-button');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }
  throw new Error('Did not reach the Save Draft step');
}

/**
 * After the destination step is filled, advance to Call Handling and fill the
 * payout + conversion duration inputs that block the Continue button.
 */
async function fillCallHandlingStep(
  page: Page,
  payout: number,
  conversionDuration: number
) {
  await expect(page.getByTestId('wizard-step-call-handling')).toBeVisible();
  const numberInputs = page.getByTestId('wizard-step-call-handling').locator('input[type="number"]');
  await numberInputs.nth(0).fill(String(payout));
  await numberInputs.nth(1).fill(String(conversionDuration));
}

test.describe('Direct Target Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Destination step surfaces phone-number validation and blocks Continue', async ({
    page,
  }) => {
    const campaignName = await getFirstCampaignName(page);
    await startDirectTargetWizard(page, campaignName, 'Validation Surface', 'direct-number');

    await expect(page.getByTestId('wizard-step-destination')).toBeVisible();
    const continueButton = page.getByTestId('wizard-continue-button');
    const status = page.getByTestId('wizard-direct-number-status');

    // Empty → status "empty", Continue disabled.
    await expect(status).toHaveAttribute('data-status', 'empty');
    await expect(continueButton).toBeDisabled();

    // Garbage input → status "invalid", Continue still disabled.
    await page.getByTestId('wizard-direct-number-input').fill('abc');
    await expect(status).toHaveAttribute('data-status', 'invalid');
    await expect(continueButton).toBeDisabled();

    // Valid E.164 → status "valid", Continue enabled.
    await page.getByTestId('wizard-direct-number-input').fill('+18005551212');
    await expect(status).toHaveAttribute('data-status', 'valid');
    await expect(continueButton).toBeEnabled();
  });

  test('Destination step surfaces SIP validation and blocks Continue', async ({ page }) => {
    const campaignName = await getFirstCampaignName(page);
    await startDirectTargetWizard(page, campaignName, 'SIP Validation', 'direct-sip');

    await expect(page.getByTestId('wizard-step-destination')).toBeVisible();
    const status = page.getByTestId('wizard-direct-sip-status');
    const continueButton = page.getByTestId('wizard-continue-button');

    await expect(status).toHaveAttribute('data-status', 'empty');
    await expect(continueButton).toBeDisabled();

    await page.getByTestId('wizard-direct-sip-input').fill('not-a-sip');
    await expect(status).toHaveAttribute('data-status', 'invalid');
    await expect(continueButton).toBeDisabled();

    await page.getByTestId('wizard-direct-sip-input').fill('sip:buyer@example.com');
    await expect(status).toHaveAttribute('data-status', 'valid');
    await expect(continueButton).toBeEnabled();
  });

  test('Direct Number wizard shows Destination → Call Handling → Schedule & Caps sub-steps', async ({
    page,
  }) => {
    const campaignName = await getFirstCampaignName(page);
    await startDirectTargetWizard(page, campaignName, 'Sub-step Check', 'direct-number');

    // Destination step
    await expect(page.getByTestId('wizard-step-destination')).toBeVisible();
    await page.getByTestId('wizard-direct-number-input').fill('+18005551212');
    await page.getByTestId('wizard-continue-button').click();

    // Call Handling step
    await expect(page.getByTestId('wizard-step-call-handling')).toBeVisible();
    await fillCallHandlingStep(page, 35, 120);
    await page.getByTestId('wizard-continue-button').click();

    // Schedule & Caps step
    await expect(page.getByTestId('wizard-step-schedule-caps')).toBeVisible();
  });

  test('creates a Direct Number Target through the wizard', async ({ page }) => {
    const consoleErrors = setupConsoleMonitoring(page);
    const campaignName = await getFirstCampaignName(page);
    expect(campaignName.length).toBeGreaterThan(0);

    const integrationName = 'E2E Direct Number';
    await startDirectTargetWizard(page, campaignName, integrationName, 'direct-number');

    // Destination step
    await page.getByTestId('wizard-direct-number-input').fill('+18005551212');
    await page.getByTestId('wizard-continue-button').click();

    // Call Handling step
    await fillCallHandlingStep(page, 35, 120);
    await page.getByTestId('wizard-continue-button').click();

    // Schedule & Caps step exists for direct targets — walk to save.
    await expect(page.getByTestId('wizard-step-schedule-caps')).toBeVisible();

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
    await page.getByTestId('wizard-continue-button').click();
    await fillCallHandlingStep(page, 35, 120);
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
    await page.getByTestId('wizard-continue-button').click();
    await fillCallHandlingStep(page, 35, 120);
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
    await page.getByTestId('wizard-continue-button').click();

    await fillCallHandlingStep(page, 35, 120);
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

  test('CSV import with status=active downgrades the direct target to needs_testing', async ({
    page,
  }) => {
    const csv =
      'integration_name,campaign,direction,type,buyer_destination_kind,target_mode,number,connection_timeout_seconds,daily_cap,concurrency_cap,schedule_timezone,schedule_mode,payout,conversion_duration_seconds,status\n' +
      'E2E CSV Active Downgrade,HVAC Inbound,buyer,static_number,direct_number,number,+18005551414,30,100,5,America/New_York,always_open,35,120,active';

    await navigateTo(page, 'Bulk Import');
    await page.getByTestId('bulk-import-mode-csv').click();
    await page.getByTestId('bulk-import-textarea').fill(csv);
    await page.getByTestId('bulk-import-parse-button').click();
    const validateButton = page.getByTestId('bulk-import-validate-button');
    if (await validateButton.isVisible().catch(() => false)) {
      await validateButton.click();
    }
    // Row will have a "warning" severity (active_downgraded). Opt-in so it
    // becomes eligible for preview/import.
    await page.getByTestId('bulk-import-include-warnings').check();
    await page.getByTestId('bulk-import-preview-button').click();
    await page.getByTestId('bulk-import-import-button').click();
    await expect(page.getByTestId('bulk-import-result')).toBeVisible();

    await navigateTo(page, 'Integrations');
    await page.getByRole('button', { name: 'E2E CSV Active Downgrade' }).first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    const status = (await page.getByTestId('integration-status').textContent()) || '';
    const normalized = status.toLowerCase().split(' ').join('');
    expect(normalized.includes('active')).toBe(false);
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
