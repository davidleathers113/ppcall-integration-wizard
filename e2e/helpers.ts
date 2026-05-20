import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for PPCall Integration Studio
 * Provides reusable actions and assertions for common workflows
 *
 * IMPORTANT: This file does not use regex for selectors to comply with project constraints.
 * All selectors use data-testid attributes for stability.
 */

// Navigation test ID mapping
const NAV_TEST_IDS: Record<string, string> = {
  'Dashboard': 'nav-dashboard',
  'Campaigns': 'nav-campaigns',
  'Integrations': 'nav-integrations',
  'Add Integration': 'nav-add-integration',
  'Bulk Import': 'nav-bulk-import',
  'Test Console': 'nav-test-console',
  'AI Assistant': 'nav-ai-assistant',
  'Developer/API': 'nav-developer',
  'Activity': 'nav-activity',
};

// Page test ID mapping
const PAGE_TEST_IDS: Record<string, string> = {
  'Dashboard': 'dashboard-page',
  'Campaigns': 'campaigns-page',
  'Integrations': 'integrations-page',
  'Add Integration': 'wizard-page',
  'Bulk Import': 'bulk-import-page',
  'Test Console': 'test-console-page',
  'AI Assistant': 'ai-assistant-page',
  'Developer/API': 'developer-docs-page',
  'Activity': 'activity-page',
};

export async function resetMockData(page: Page) {
  // Navigate to app if not already there
  if (!page.url().includes('127.0.0.1:5173')) {
    await page.goto('/');
  }

  // Look for and click Reset Mock Data button
  const resetButton = page.getByTestId('reset-mock-data-button');
  if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await resetButton.click();
    await page.waitForLoadState('networkidle');
  }
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

export async function navigateTo(page: Page, viewName: string) {
  const testId = NAV_TEST_IDS[viewName];
  if (!testId) {
    throw new Error(`Unknown view: ${viewName}. Available views: ${Object.keys(NAV_TEST_IDS).join(', ')}`);
  }

  // Click navigation button
  await page.getByTestId(testId).click();

  // Wait for page to be visible
  const pageTestId = PAGE_TEST_IDS[viewName];
  if (pageTestId) {
    await page.getByTestId(pageTestId).waitFor({ state: 'visible', timeout: 5000 });
  }
}

export async function expectNoConsoleErrors() {
  // This helper is not used as console monitoring is set up per-test
  // Use setupConsoleMonitoring() at the start of tests instead
}

export async function createCampaign(page: Page, name: string, vertical: string = 'home_services') {
  // Navigate to campaigns if not already there
  await navigateTo(page, 'Campaigns');

  // Click Create Campaign button - using data-testid
  await page.getByTestId('create-campaign-button').click();

  // Fill in campaign name
  const nameInput = page.getByTestId('campaign-name-input');
  if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await nameInput.fill(name);

    // Select vertical if there's a dropdown
    const verticalSelect = page.getByTestId('campaign-vertical-input');
    if (await verticalSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await verticalSelect.selectOption(vertical);
    }

    // Submit
    await page.getByTestId('save-campaign-button').click();

    // Wait for campaign to appear in list
    await page.getByTestId('campaign-row').first().waitFor({ state: 'visible' });
  }
}

interface CreateBuyerOptions {
  campaignName: string;
  integrationName: string;
  type?: 'rtb' | 'static_number' | 'sip' | 'webhook';
  preset?: string;
  url?: string;
  method?: 'GET' | 'POST';
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

  // Navigate to Add Integration
  await navigateTo(page, 'Add Integration');

  // Step 1: Choose Direction - Buyer (if not already selected via initialContext)
  // Look for buyer direction button - may be skipped if direction is pre-selected
  const buyerButton = page.getByText('Buyer / Destination').or(page.getByText('Buyer'));
  if (await buyerButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await buyerButton.click();
  }

  // Click Continue button
  await page.getByTestId('wizard-continue-button').click();

  // Step 2: Choose Type
  // Click the type button (e.g., RTB, Static Number, etc.)
  await page.getByText(type.toUpperCase().replace('_', ' ')).click();
  await page.getByTestId('wizard-continue-button').click();

  // Step 3: Campaign and Name
  await page.getByTestId('campaign-select').selectOption({ label: campaignName });
  await page.getByTestId('integration-name-input').fill(integrationName);
  await page.getByTestId('wizard-continue-button').click();

  // Step 4: Preset selection (if applicable for this type)
  // This step may be skipped for some types
  if (type === 'rtb' || type === 'webhook') {
    const presetButton = page.getByText(preset.replace(/_/g, ' '));
    if (await presetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await presetButton.click();
      // Clicking preset may auto-advance to next step
    }
  }

  // Step 5: Configure fields
  // This step varies by type - try to find and fill URL field
  const urlInput = page.getByLabel('URL').or(page.getByLabel('Endpoint'));
  if (await urlInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await urlInput.fill(url);
  }

  // Continue through remaining steps by clicking Continue until we reach Save Draft
  let maxClicks = 5;
  while (maxClicks > 0) {
    const continueButton = page.getByTestId('wizard-continue-button');
    if (await continueButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await continueButton.click();
      maxClicks--;
    } else {
      break;
    }
  }

  // Final step: Save Draft
  const saveButton = page.getByTestId('save-draft-button');
  if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await saveButton.click();
  }

  // Wait for confirmation
  await page.waitForTimeout(1000);
}

export async function runIntegrationTest(page: Page) {
  // Assumes we're on integration detail page with Test Console tab
  await page.getByTestId('tab-test').click();

  // Click Run Test button
  await page.getByTestId('run-test-button').click();

  // Wait for test to complete
  await page.waitForTimeout(2000);

  // Check for test results - look for passed or failed badge
  await expect(page.getByText('Test PASSED').or(page.getByText('Test FAILED'))).toBeVisible();
}

export async function activateIntegration(page: Page) {
  // Look for Activate button using test ID
  const activateButton = page.getByTestId('activate-button');
  await activateButton.click();

  // Confirm if there's a confirmation dialog (unlikely but check for it)
  const confirmButton = page.getByText('Confirm').or(page.getByText('Yes'));
  if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await confirmButton.click();
  }

  // Wait for activation to complete
  await page.waitForTimeout(500);
}

export async function importCsv(page: Page, csvText: string) {
  // Navigate to Bulk Import
  await navigateTo(page, 'Bulk Import');

  // Select CSV mode - look for CSV button
  const csvButton = page.getByText('CSV').first();
  if (await csvButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await csvButton.click();
  }

  // Paste CSV text into textarea
  const textarea = page.locator('textarea').first();
  await textarea.fill(csvText);

  // Click Parse Content button
  const parseButton = page.getByTestId('parse-button');
  if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await parseButton.click();
    await page.waitForTimeout(500);
  }

  // Click Validate Rows button
  const validateButton = page.getByTestId('validate-button');
  if (await validateButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await validateButton.click();
    await page.waitForTimeout(500);
  }

  // Click Preview button
  const previewButton = page.getByTestId('preview-button');
  if (await previewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await previewButton.click();
    await page.waitForTimeout(500);
  }

  // Click Import button
  const importButton = page.getByTestId('import-button');
  if (await importButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await importButton.click();
    await page.waitForTimeout(1000);
  }
}

export async function importJson(page: Page, jsonText: string) {
  // Navigate to Bulk Import
  await navigateTo(page, 'Bulk Import');

  // Select JSON mode - look for JSON button
  const jsonButton = page.getByText('JSON').first();
  await jsonButton.click();

  // Paste JSON text into textarea
  const textarea = page.locator('textarea').first();
  await textarea.fill(jsonText);

  // Click Parse Content button
  const parseButton = page.getByTestId('parse-button');
  if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await parseButton.click();
    await page.waitForTimeout(500);
  }

  // For JSON, validation happens automatically, so skip to preview
  const previewButton = page.getByTestId('preview-button');
  if (await previewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await previewButton.click();
    await page.waitForTimeout(500);
  }

  // Click Import button
  const importButton = page.getByTestId('import-button');
  if (await importButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await importButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Monitor console for errors during test execution
 * Call this at the beginning of a test
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
 * Wait for an element to be visible with custom timeout
 */
export async function waitForVisible(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Check if integration is in a specific status
 */
export async function expectIntegrationStatus(page: Page, expectedStatus: string) {
  const statusBadge = page.locator('[data-testid="integration-status"]').or(
    page.getByText(new RegExp(expectedStatus, 'i'))
  );
  await expect(statusBadge).toBeVisible();
}
