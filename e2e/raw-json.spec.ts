import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Raw JSON Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'Integrations');
    await page.getByTestId('integration-row').first().getByRole('button').first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();
    await page.getByTestId('tab-raw-json').click();
    await expect(page.getByTestId('raw-json-textarea')).toBeVisible();
  });

  test('rejects invalid JSON', async ({ page }) => {
    await page.getByTestId('raw-json-textarea').fill('{ not valid json');
    await page.getByTestId('raw-json-apply-button').click();
    await expect(page.getByTestId('raw-json-error')).toBeVisible();
    await expect(page.getByTestId('toast-error').first()).toBeVisible();
  });

  test('rejects schema-invalid JSON', async ({ page }) => {
    // Strip required fields — `name` removed
    const textarea = page.getByTestId('raw-json-textarea');
    const original = (await textarea.inputValue()) || '';
    const parsed = JSON.parse(original);
    delete parsed.name;
    await textarea.fill(JSON.stringify(parsed, null, 2));

    await page.getByTestId('raw-json-apply-button').click();
    const error = page.getByTestId('raw-json-error');
    await expect(error).toBeVisible();
    const text = (await error.textContent()) || '';
    expect(text.toLowerCase().includes('missing')).toBeTruthy();
  });

  test('valid edit updates the integration name and emits activity', async ({ page }) => {
    const textarea = page.getByTestId('raw-json-textarea');
    const original = (await textarea.inputValue()) || '';
    const parsed = JSON.parse(original);
    const newName = `Raw JSON Renamed ${Date.now()}`;
    parsed.name = newName;
    await textarea.fill(JSON.stringify(parsed, null, 2));

    await page.getByTestId('raw-json-apply-button').click();
    await expect(page.getByTestId('toast-success').first()).toBeVisible();

    // Confirm rename reflected in overview header
    await page.getByTestId('tab-overview').click();
    await expect(page.getByRole('heading', { name: newName })).toBeVisible();

    // Confirm activity log captures the update
    await page.getByTestId('tab-activity').click();
    await expect(page.getByText('Raw JSON Editor', { exact: false }).first()).toBeVisible();
  });

  test('copy button emits a toast', async ({ page }) => {
    // Browser context grants clipboard automatically only when clipboard is requested via a user click.
    // We can still verify the path was triggered — either toast-success or toast-error appears.
    await page.getByTestId('raw-json-copy-button').click();
    const successToast = page.getByTestId('toast-success').first();
    const errorToast = page.getByTestId('toast-error').first();
    await expect(successToast.or(errorToast)).toBeVisible();
  });
});
