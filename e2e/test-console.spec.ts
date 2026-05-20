import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Test Console', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows checklist, request preview, raw response, parsed result, history', async ({ page }) => {
    await navigateTo(page, 'Integrations');
    await page.getByTestId('integration-row').first().getByRole('button').first().click();
    await expect(page.getByTestId('integration-detail-page')).toBeVisible();

    await page.getByTestId('tab-test-console').click();

    // Tweak input tokens
    await page.getByTestId('test-input-caller-id').fill('+15558675309');
    await page.getByTestId('test-input-zip').fill('60601');
    await page.getByTestId('test-input-state').fill('IL');

    await page.getByTestId('run-test-button').click();

    // Result status appears once the simulated run completes
    await expect(page.getByTestId('test-result-status')).toBeVisible();

    // Checklist is rendered (open by default in this app)
    await expect(page.getByTestId('test-checklist')).toBeVisible();

    // Expand each section in turn and confirm it's rendered
    const sections = [
      'test-request-preview',
      'test-raw-response',
      'test-parsed-result',
    ];
    for (const testId of sections) {
      const section = page.getByTestId(testId);
      await expect(section).toBeVisible();
      await section.getByRole('button').first().click();
    }

    // Test history records this run
    await expect(page.getByTestId('test-history')).toBeVisible();
    await expect(page.getByTestId('test-history-row').first()).toBeVisible();
  });

  test('running a test emits a success or error toast', async ({ page }) => {
    await navigateTo(page, 'Integrations');
    await page.getByTestId('integration-row').first().getByRole('button').first().click();
    await page.getByTestId('tab-test-console').click();
    await page.getByTestId('run-test-button').click();
    await expect(page.getByTestId('test-result-status')).toBeVisible();
    const status = await page.getByTestId('test-result-status').getAttribute('data-status');
    if (status === 'passed') {
      await expect(page.getByTestId('toast-success').first()).toBeVisible();
    } else {
      await expect(page.getByTestId('toast-error').first()).toBeVisible();
    }
  });
});
