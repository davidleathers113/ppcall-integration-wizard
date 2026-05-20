import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for PPCall Integration Studio
 * Provides reusable actions and assertions for common workflows
 */

export async function resetMockData(page: Page) {
  // Navigate to app if not already there
  if (!page.url().includes('127.0.0.1:5173')) {
    await page.goto('/');
  }

  // Look for and click Reset Mock Data button (typically in settings or a menu)
  // This will vary based on implementation, but assuming it's accessible from dashboard
  const resetButton = page.getByRole('button', { name: /reset mock data/i });
  if (await resetButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await resetButton.click();
    await page.waitForTimeout(500); // Give localStorage time to update
  }
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

export async function navigateTo(page: Page, labelOrPath: string) {
  // Try finding a navigation link first
  const link = page.getByRole('link', { name: new RegExp(labelOrPath, 'i') });

  if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
    await link.click();
  } else {
    // Fallback to direct navigation
    await page.goto(labelOrPath.startsWith('/') ? labelOrPath : `/${labelOrPath}`);
  }

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
}

export async function expectNoConsoleErrors(page: Page) {
  // This helper is called at the end of tests to verify no console errors occurred
  // Note: You'd set up console monitoring at the start of the test
  const logs: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });

  // Check that no errors were logged
  expect(logs).toHaveLength(0);
}

export async function createCampaign(page: Page, name: string, vertical: string = 'home_services') {
  // Navigate to campaigns if not already there
  await navigateTo(page, 'Campaigns');

  // Click Create Campaign button
  const createButton = page.getByRole('button', { name: /create campaign/i });
  await createButton.click();

  // Fill in campaign name
  await page.getByLabel(/campaign name/i).fill(name);

  // Select vertical if there's a dropdown
  const verticalSelect = page.getByLabel(/vertical/i);
  if (await verticalSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await verticalSelect.selectOption(vertical);
  }

  // Submit
  await page.getByRole('button', { name: /create|save/i }).click();

  // Wait for campaign to appear in list
  await expect(page.getByText(name)).toBeVisible();
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
    method = 'POST'
  } = options;

  // Navigate to Add Integration
  await navigateTo(page, 'Add Integration');

  // Step 1: Choose Direction - Buyer
  await page.getByRole('button', { name: /buyer|destination/i }).click();
  await page.getByRole('button', { name: /next|continue/i }).click();

  // Step 2: Choose Type
  const typeButton = page.getByRole('button', { name: new RegExp(type, 'i') });
  await typeButton.click();
  await page.getByRole('button', { name: /next|continue/i }).click();

  // Step 3: Campaign and Name
  await page.getByLabel(/campaign/i).selectOption({ label: campaignName });
  await page.getByLabel(/integration name/i).fill(integrationName);
  await page.getByRole('button', { name: /next|continue/i }).click();

  // Step 4: Preset selection
  if (type === 'rtb' || type === 'webhook') {
    const presetButton = page.getByRole('button', { name: new RegExp(preset, 'i') });
    if (await presetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await presetButton.click();
    }
    await page.getByRole('button', { name: /next|continue/i }).click();
  }

  // Step 5: Configure (if not skipped by preset)
  const urlInput = page.getByLabel(/url|endpoint/i);
  if (await urlInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await urlInput.fill(url);

    const methodSelect = page.getByLabel(/method/i);
    if (await methodSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await methodSelect.selectOption(method);
    }

    await page.getByRole('button', { name: /next|continue/i }).click();
  }

  // Continue through remaining steps
  // Look for Save Draft or Finish button
  const saveButton = page.getByRole('button', { name: /save draft|finish|create/i });
  await saveButton.click();

  // Wait for confirmation or navigation
  await page.waitForTimeout(1000);
}

export async function runIntegrationTest(page: Page) {
  // Assumes we're on integration detail page with Test Console tab
  await page.getByRole('tab', { name: /test console/i }).click();

  // Click Run Test button
  const runButton = page.getByRole('button', { name: /run test|test integration/i });
  await runButton.click();

  // Wait for test to complete
  await page.waitForTimeout(2000);

  // Check for test results
  await expect(page.getByText(/test result|passed|failed/i)).toBeVisible();
}

export async function activateIntegration(page: Page) {
  // Look for Activate button
  const activateButton = page.getByRole('button', { name: /activate/i });
  await activateButton.click();

  // Confirm if there's a confirmation dialog
  const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
  if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await confirmButton.click();
  }

  // Wait for activation to complete
  await page.waitForTimeout(500);
}

export async function importCsv(page: Page, csvText: string) {
  // Navigate to Bulk Import
  await navigateTo(page, 'Bulk Import');

  // Look for CSV input mode
  const csvTab = page.getByRole('tab', { name: /csv/i });
  if (await csvTab.isVisible({ timeout: 1000 }).catch(() => false)) {
    await csvTab.click();
  }

  // Paste CSV text
  const textarea = page.getByRole('textbox', { name: /paste csv|csv content/i });
  await textarea.fill(csvText);

  // Click Parse/Validate
  const parseButton = page.getByRole('button', { name: /parse|validate/i });
  if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await parseButton.click();
    await page.waitForTimeout(500);
  }

  // Click Import
  const importButton = page.getByRole('button', { name: /import/i });
  await importButton.click();

  // Wait for import to complete
  await page.waitForTimeout(1000);
}

export async function importJson(page: Page, jsonText: string) {
  // Navigate to Bulk Import
  await navigateTo(page, 'Bulk Import');

  // Select JSON mode
  const jsonTab = page.getByRole('tab', { name: /json/i });
  await jsonTab.click();

  // Paste JSON text
  const textarea = page.getByRole('textbox', { name: /paste json|json content/i });
  await textarea.fill(jsonText);

  // Click Parse/Validate
  const parseButton = page.getByRole('button', { name: /parse|validate/i });
  if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await parseButton.click();
    await page.waitForTimeout(500);
  }

  // Click Import
  const importButton = page.getByRole('button', { name: /import/i });
  await importButton.click();

  // Wait for import to complete
  await page.waitForTimeout(1000);
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
