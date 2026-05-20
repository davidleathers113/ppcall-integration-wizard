import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Persistence and Reset', () => {
  test('localStorage persists across page reloads', async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'Campaigns');

    const beforeCount = await page.getByTestId('campaign-row').count();
    await page.getByTestId('create-campaign-button').click();
    await expect(page.getByTestId('toast-success').first()).toBeVisible();
    const afterCount = await page.getByTestId('campaign-row').count();
    expect(afterCount).toBe(beforeCount + 1);

    await page.reload();
    await navigateTo(page, 'Campaigns');

    const reloadCount = await page.getByTestId('campaign-row').count();
    expect(reloadCount).toBe(afterCount);
  });

  test('reset mock data clears custom data and restores seed', async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'Campaigns');

    const seedCount = await page.getByTestId('campaign-row').count();
    await page.getByTestId('create-campaign-button').click();
    await page.getByTestId('create-campaign-button').click();
    await expect(page.getByTestId('campaign-row')).toHaveCount(seedCount + 2);

    await navigateTo(page, 'Developer/API');
    await page.getByTestId('reset-mock-data-button').click();
    await expect(page.getByTestId('toast-info').first()).toBeVisible();

    await navigateTo(page, 'Campaigns');
    const finalCount = await page.getByTestId('campaign-row').count();
    expect(finalCount).toBe(seedCount);
  });
});
