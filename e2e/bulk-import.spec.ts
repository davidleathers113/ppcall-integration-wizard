import { test, expect } from '@playwright/test';

const VALID_CSV = `integration_name,campaign,direction,type,platform_preset,method,url,timeout_seconds,required_fields,accepted_path,accepted_value,destination_number_path,bid_path,reject_reason_path
E2E CSV Buyer,HVAC Inbound,buyer,rtb,generic_json_post,POST,https://buyer.example.com/ping,3,"caller_id,zip",$.accepted,true,$.phone_number,$.bid,$.reason`;

const VALID_JSON = `[
  {
    "integration_name": "E2E JSON Buyer",
    "campaign": "HVAC Inbound",
    "direction": "buyer",
    "type": "rtb",
    "method": "POST",
    "url": "https://buyer.example.com/api",
    "timeout_seconds": 3,
    "required_fields": "caller_id,zip",
    "accepted_path": "$.success",
    "destination_number_path": "$.phone"
  }
]`;

test.describe('Bulk Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /bulk import/i }).click();
  });

  test('should import valid CSV', async ({ page }) => {
    // Select CSV tab if present
    const csvTab = page.getByRole('tab', { name: /csv/i });
    if (await csvTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await csvTab.click();
    }

    // Find textarea for CSV input
    const textarea = page.locator('textarea').first();
    await textarea.fill(VALID_CSV);

    // Parse/validate
    const parseButton = page.getByRole('button', { name: /parse|validate/i });
    if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await parseButton.click();
      await page.waitForTimeout(500);
    }

    // Verify validation passed
    await expect(page.getByText(/ready|valid|1.*row/i)).toBeVisible({ timeout: 3000 });

    // Import
    const importButton = page.getByRole('button', { name: /import/i }).last();
    await importButton.click();

    // Wait for import to complete
    await page.waitForTimeout(1500);

    // Verify success message
    await expect(page.getByText(/imported|success|complete/i)).toBeVisible({ timeout: 5000 });

    // Navigate to integrations and verify it exists
    await page.getByRole('link', { name: /integrations/i }).click();
    await expect(page.getByText('E2E CSV Buyer')).toBeVisible({ timeout: 5000 });
  });

  test('should import valid JSON', async ({ page }) => {
    // Select JSON tab
    const jsonTab = page.getByRole('tab', { name: /json/i });
    await jsonTab.click();

    // Fill JSON
    const textarea = page.locator('textarea').first();
    await textarea.fill(VALID_JSON);

    // Parse
    const parseButton = page.getByRole('button', { name: /parse|validate/i });
    if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await parseButton.click();
      await page.waitForTimeout(500);
    }

    // Import
    const importButton = page.getByRole('button', { name: /import/i }).last();
    await importButton.click();

    await page.waitForTimeout(1500);

    // Verify success
    await expect(page.getByText(/imported|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('should reject invalid JSON', async ({ page }) => {
    const jsonTab = page.getByRole('tab', { name: /json/i });
    await jsonTab.click();

    // Enter invalid JSON
    const textarea = page.locator('textarea').first();
    await textarea.fill('{ invalid json }');

    // Try to parse
    const parseButton = page.getByRole('button', { name: /parse|validate/i });
    if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await parseButton.click();
      await page.waitForTimeout(500);
    }

    // Verify error message appears
    await expect(page.getByText(/error|invalid/i)).toBeVisible({ timeout: 3000 });

    // Import button should be disabled or not work
    const importButton = page.getByRole('button', { name: /import/i }).last();
    const isDisabled = await importButton.isDisabled().catch(() => true);

    expect(isDisabled).toBeTruthy();
  });

  test('imported integrations should not be active', async ({ page }) => {
    // Import a CSV
    const csvTab = page.getByRole('tab', { name: /csv/i });
    if (await csvTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await csvTab.click();
    }

    const textarea = page.locator('textarea').first();
    await textarea.fill(VALID_CSV.replace('E2E CSV Buyer', 'Status Check Import'));

    const parseButton = page.getByRole('button', { name: /parse|validate/i });
    if (await parseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await parseButton.click();
      await page.waitForTimeout(500);
    }

    const importButton = page.getByRole('button', { name: /import/i }).last();
    await importButton.click();
    await page.waitForTimeout(1500);

    // Navigate to integrations
    await page.getByRole('link', { name: /integrations/i }).click();

    // Find the imported integration
    await page.getByText('Status Check Import').waitFor({ timeout: 5000 });

    // Verify it's NOT active status
    const row = page.locator('text=Status Check Import').locator('..');

    // Should show draft or needs_testing, not active
    await expect(row.getByText(/draft|needs.*test/i)).toBeVisible({ timeout: 2000 });
  });
});
