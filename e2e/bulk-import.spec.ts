import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

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
    await navigateTo(page, 'Bulk Import');
  });

  test('should import valid CSV', async ({ page }) => {
    await page.getByTestId('bulk-import-mode-csv').click();
    await page.getByTestId('bulk-import-textarea').fill(VALID_CSV);

    await page.getByTestId('bulk-import-parse-button').click();
    await expect(page.getByTestId('bulk-import-validate-button')).toBeVisible();

    await page.getByTestId('bulk-import-validate-button').click();
    await expect(page.getByTestId('bulk-import-preview-button')).toBeVisible();

    await page.getByTestId('bulk-import-preview-button').click();
    await expect(page.getByTestId('bulk-import-import-button')).toBeVisible();

    await page.getByTestId('bulk-import-import-button').click();
    await expect(page.getByTestId('bulk-import-result')).toBeVisible();
    await expect(page.getByTestId('bulk-import-success')).toBeVisible();
    await expect(page.getByTestId('toast-success').first()).toBeVisible();

    await navigateTo(page, 'Integrations');
    await expect(page.getByRole('button', { name: 'E2E CSV Buyer' })).toBeVisible();
  });

  test('should import valid JSON', async ({ page }) => {
    await page.getByTestId('bulk-import-mode-json').click();
    await page.getByTestId('bulk-import-textarea').fill(VALID_JSON);

    await page.getByTestId('bulk-import-parse-button').click();
    await expect(page.getByTestId('bulk-import-preview-button')).toBeVisible();

    await page.getByTestId('bulk-import-preview-button').click();
    await expect(page.getByTestId('bulk-import-import-button')).toBeVisible();

    await page.getByTestId('bulk-import-import-button').click();
    await expect(page.getByTestId('bulk-import-result')).toBeVisible();
    await expect(page.getByTestId('bulk-import-success')).toBeVisible();

    await navigateTo(page, 'Integrations');
    await expect(page.getByRole('button', { name: 'E2E JSON Buyer' })).toBeVisible();
  });

  test('should reject invalid JSON', async ({ page }) => {
    await page.getByTestId('bulk-import-mode-json').click();
    await page.getByTestId('bulk-import-textarea').fill('{ invalid json }');

    await page.getByTestId('bulk-import-parse-button').click();

    await expect(page.getByTestId('bulk-import-error')).toBeVisible();
    const importButton = page.getByTestId('bulk-import-import-button');
    const isVisible = await importButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(importButton).toBeDisabled();
    }
  });

  test('imported integrations should not be active', async ({ page }) => {
    await page.getByTestId('bulk-import-mode-csv').click();
    const labeled = VALID_CSV.split('E2E CSV Buyer').join('Status Check Import');
    await page.getByTestId('bulk-import-textarea').fill(labeled);

    await page.getByTestId('bulk-import-parse-button').click();
    await expect(page.getByTestId('bulk-import-validate-button')).toBeVisible();

    await page.getByTestId('bulk-import-validate-button').click();
    await expect(page.getByTestId('bulk-import-preview-button')).toBeVisible();

    await page.getByTestId('bulk-import-preview-button').click();
    await expect(page.getByTestId('bulk-import-import-button')).toBeVisible();

    await page.getByTestId('bulk-import-import-button').click();
    await expect(page.getByTestId('bulk-import-result')).toBeVisible();

    await navigateTo(page, 'Integrations');
    const row = page.getByTestId('integration-row').filter({
      has: page.getByRole('button', { name: 'Status Check Import' }),
    });
    await expect(row).toBeVisible();
    // Imported integrations land in draft/needs_testing — never active.
    await expect(row.getByText('active', { exact: true })).toHaveCount(0);
  });
});
