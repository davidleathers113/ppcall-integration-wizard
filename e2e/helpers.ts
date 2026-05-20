import { Page, expect, Locator } from '@playwright/test';

/**
 * E2E Test Helpers for PPCall Integration Studio
 *
 * IMPORTANT: No regex is used anywhere in this file or in any e2e/*.spec.ts.
 * All selectors use data-testid. All string transforms use String methods
 * (split/join/includes/startsWith/endsWith/toLowerCase) per project policy.
 */

const NAV_TEST_IDS: Record<string, string> = {
  Dashboard: 'nav-dashboard',
  Campaigns: 'nav-campaigns',
  Integrations: 'nav-integrations',
  'Add Integration': 'nav-add-integration',
  'Bulk Import': 'nav-bulk-import',
  'Test Console': 'nav-test-console',
  'AI Assistant': 'nav-ai-assistant',
  'Developer/API': 'nav-developer',
  Activity: 'nav-activity',
};

const PAGE_TEST_IDS: Record<string, string> = {
  Dashboard: 'dashboard-page',
  Campaigns: 'campaigns-page',
  Integrations: 'integrations-page',
  'Add Integration': 'wizard-page',
  'Bulk Import': 'bulk-import-page',
  'Test Console': 'test-console-page',
  'AI Assistant': 'ai-assistant-page',
  'Developer/API': 'developer-docs-page',
  Activity: 'activity-page',
};

export async function navigateTo(page: Page, viewName: string) {
  const testId = NAV_TEST_IDS[viewName];
  if (!testId) {
    throw new Error(
      `Unknown view: ${viewName}. Available views: ${Object.keys(NAV_TEST_IDS).join(', ')}`
    );
  }
  await page.getByTestId(testId).click();
  const pageTestId = PAGE_TEST_IDS[viewName];
  if (pageTestId) {
    await expect(page.getByTestId(pageTestId)).toBeVisible();
  }
}

export async function resetMockData(page: Page) {
  if (!page.url().includes('127.0.0.1:5173')) {
    await page.goto('/');
  }
  await navigateTo(page, 'Developer/API');
  const resetButton = page.getByTestId('reset-mock-data-button');
  await resetButton.click();
  // Toast confirms the reset completed.
  await expect(page.getByTestId('toast-info')).toBeVisible();
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
}

/**
 * Wizard helper. Walks through the Add Integration wizard using only data-testids.
 * type controls which type to pick. preset controls which preset to choose (or "custom").
 */
interface CreateBuyerOptions {
  campaignName: string;
  integrationName: string;
  type?: 'rtb' | 'static_number' | 'sip' | 'webhook' | 'generic_api';
  preset?: string;
  url?: string;
}

export async function createBuyerIntegrationThroughWizard(
  page: Page,
  options: CreateBuyerOptions
) {
  const {
    campaignName,
    integrationName,
    type = 'rtb',
    preset = 'generic_json_post',
    url = 'https://buyer.example.com/ping',
  } = options;

  await navigateTo(page, 'Add Integration');

  // Step 1: Direction = buyer
  await page.getByTestId('wizard-direction-buyer').click();
  await page.getByTestId('wizard-continue-button').click();

  // Step 2: Type
  const typeTestId = `wizard-type-${type.split('_').join('-')}`;
  await page.getByTestId(typeTestId).click();
  await page.getByTestId('wizard-continue-button').click();

  // Step 3: Campaign + name
  await page.getByTestId('campaign-select').selectOption({ label: campaignName });
  await page.getByTestId('integration-name-input').fill(integrationName);
  await page.getByTestId('wizard-continue-button').click();

  // Step 4: Preset selection. Selecting a preset auto-advances to Configure.
  // Some preset keys are filtered out based on type — fall back to "custom"
  // which is always rendered as the last choice.
  const requestedPresetTestId = `wizard-preset-${preset.split('_').join('-')}`;
  const customPresetTestId = 'wizard-preset-custom';
  const requestedPreset = page.getByTestId(requestedPresetTestId);
  if (await requestedPreset.isVisible().catch(() => false)) {
    await requestedPreset.click();
  } else {
    await expect(page.getByTestId(customPresetTestId)).toBeVisible();
    await page.getByTestId(customPresetTestId).click();
  }

  // Step 5: Configure — for buyer + RTB/webhook/generic_api, wait for URL input then fill it.
  if (type === 'rtb' || type === 'webhook' || type === 'generic_api') {
    const urlInput = page.getByTestId('wizard-url-input');
    await expect(urlInput).toBeVisible();
    await urlInput.fill(url);
  }

  // Walk Continue → Continue → Continue until Save Draft is the rendered control.
  for (let i = 0; i < 8; i++) {
    const saveButton = page.getByTestId('wizard-save-draft-button');
    if (await saveButton.isVisible().catch(() => false)) break;
    const continueButton = page.getByTestId('wizard-continue-button');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  await expect(page.getByTestId('wizard-save-draft-button')).toBeVisible();
  await page.getByTestId('wizard-save-draft-button').click();
  await expect(page.getByTestId('wizard-saved-step')).toBeVisible();
}

export async function openIntegrationDetailByName(page: Page, name: string) {
  await navigateTo(page, 'Integrations');
  await page.getByRole('button', { name, exact: true }).first().click();
  await expect(page.getByTestId('integration-detail-page')).toBeVisible();
}

/**
 * Open the first integration whose detail page shows an enabled activate-button.
 * Useful for tests that exercise activation flow — skipping already-active ones.
 */
export async function openFirstActivatableIntegration(page: Page) {
  await navigateTo(page, 'Integrations');
  const rows = page.getByTestId('integration-row');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    await rows.nth(i).getByRole('button').first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    const isDisabled = await page
      .getByTestId('activate-button')
      .isDisabled()
      .catch(() => true);
    if (!isDisabled) return;
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('integrations-page')).toBeVisible();
  }
  throw new Error('No integration with enabled activate-button found');
}

export async function runIntegrationTestFromDetail(page: Page) {
  await page.getByTestId('tab-test-console').click();
  await page.getByTestId('run-test-button').click();
  await expect(page.getByTestId('test-result-status')).toBeVisible();
}

export async function getTestResultStatus(page: Page): Promise<string> {
  const status = await page
    .getByTestId('test-result-status')
    .getAttribute('data-status');
  return status || '';
}

export async function activateIntegration(page: Page) {
  await page.getByTestId('activate-button').click();
  await expect(page.getByTestId('integration-action-message')).toBeVisible();
}

export async function pasteCsvBulkImport(page: Page, csvText: string) {
  await navigateTo(page, 'Bulk Import');
  await page.getByTestId('bulk-import-mode-csv').click();
  await page.getByTestId('bulk-import-textarea').fill(csvText);
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
}

export async function pasteJsonBulkImport(page: Page, jsonText: string) {
  await navigateTo(page, 'Bulk Import');
  await page.getByTestId('bulk-import-mode-json').click();
  await page.getByTestId('bulk-import-textarea').fill(jsonText);
  await page.getByTestId('bulk-import-parse-button').click();
  const previewButton = page.getByTestId('bulk-import-preview-button');
  if (await previewButton.isVisible().catch(() => false)) {
    await previewButton.click();
  }
  const importButton = page.getByTestId('bulk-import-import-button');
  if (await importButton.isVisible().catch(() => false)) {
    await importButton.click();
    await expect(page.getByTestId('bulk-import-result')).toBeVisible();
  }
}

/**
 * Console monitoring: returns a string array that fills with error messages.
 * Call once per test.
 */
export function setupConsoleMonitoring(page: Page): string[] {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });
  return consoleErrors;
}

/**
 * Status assertion using the integration-status badge.
 * Normalizes both sides via toLowerCase + trim — no regex.
 */
export async function expectIntegrationStatus(page: Page, expectedStatus: string) {
  const badge: Locator = page.getByTestId('integration-status');
  await expect(badge).toBeVisible();
  const actual = (await badge.textContent()) || '';
  const normalize = (value: string) =>
    value.split(' ').join('').toLowerCase().trim();
  expect(normalize(actual)).toContain(normalize(expectedStatus));
}

/**
 * Wait for a toast of a given type to be visible. Returns the toast text.
 */
export async function expectToast(
  page: Page,
  type: 'success' | 'error' | 'warning' | 'info'
): Promise<string> {
  const toast = page.getByTestId(`toast-${type}`).first();
  await expect(toast).toBeVisible();
  const text = await toast.getByTestId('toast').textContent();
  return text || '';
}
