# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-load.spec.ts >> App Load >> should load app successfully with no console errors
- Location: e2e/app-load.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /dashboard/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /dashboard/i })

```

```yaml
- complementary:
  - heading "PPCall Studio" [level=1]
  - navigation:
    - list:
      - listitem:
        - button "Dashboard"
      - listitem:
        - button "Campaigns"
      - listitem:
        - button "Integrations"
      - listitem:
        - button "Add Integration"
      - listitem:
        - button "Bulk Import"
      - listitem:
        - button "Test Console"
      - listitem:
        - button "AI Assistant"
      - listitem:
        - button "Developer/API"
      - listitem:
        - button "Activity"
  - paragraph: Mock Environment v1.0
  - paragraph: © 2026 Self-Service PPCall Integration Studio
- main:
  - heading "Platform Overview" [level=2]
  - paragraph: Monitor your integration health and campaign performance.
  - text: 2 Active 1 Need Testing 1 Failing 0 Stale/Dormant 3 Used This Week
  - heading "Integration Health" [level=3]
  - paragraph: Integrations requiring attention
  - paragraph: Coastal Plumbing Buyer
  - paragraph: buyer • GENERIC_API
  - text: failing
  - paragraph: SearchCalls Legal
  - paragraph: publisher • RTB
  - text: needs testing
  - heading "Recent Activity" [level=3]
  - paragraph: Sarah created Premier Home Services RTB.
  - paragraph: 1/11/2026, 6:00:00 AM
  - paragraph: Test passed in 412ms.
  - paragraph: 1/11/2026, 6:15:00 AM
  - paragraph: Integration activated.
  - paragraph: 1/12/2026, 5:00:00 AM
  - paragraph: "Integration failed: 404 Not Found from buyer endpoint."
  - paragraph: 5/18/2026, 6:05:00 AM
  - paragraph: "Integration marked stale: no traffic in 30+ days."
  - paragraph: 5/14/2026, 8:00:00 PM
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { setupConsoleMonitoring } from './helpers';
  3  | 
  4  | test.describe('App Load', () => {
  5  |   test('should load app successfully with no console errors', async ({ page }) => {
  6  |     const consoleErrors = setupConsoleMonitoring(page);
  7  | 
  8  |     await page.goto('/');
  9  | 
  10 |     // Verify app loaded
  11 |     await expect(page).toHaveTitle(/PPCall Integration Studio|Integration Studio/i);
  12 | 
  13 |     // Verify sidebar rendered
  14 |     await expect(page.getByRole('navigation')).toBeVisible();
  15 | 
  16 |     // Verify dashboard is default view
> 17 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  18 | 
  19 |     // Verify no console errors occurred
  20 |     expect(consoleErrors).toHaveLength(0);
  21 |   });
  22 | 
  23 |   test('should display seeded campaigns', async ({ page }) => {
  24 |     await page.goto('/');
  25 | 
  26 |     // Navigate to campaigns
  27 |     await page.getByRole('link', { name: /campaigns/i }).click();
  28 | 
  29 |     // Verify campaign list renders
  30 |     await expect(page.getByRole('heading', { name: /campaigns/i })).toBeVisible();
  31 | 
  32 |     // Verify at least one seeded campaign exists
  33 |     const campaignRows = page.locator('[data-testid="campaign-row"]').or(
  34 |       page.locator('table tbody tr, [role="row"]')
  35 |     );
  36 | 
  37 |     await expect(campaignRows.first()).toBeVisible({ timeout: 5000 });
  38 |   });
  39 | 
  40 |   test('should display seeded integrations', async ({ page }) => {
  41 |     await page.goto('/');
  42 | 
  43 |     // Navigate to integrations
  44 |     await page.getByRole('link', { name: /integrations/i }).click();
  45 | 
  46 |     // Verify integration list renders
  47 |     await expect(page.getByRole('heading', { name: /integrations/i })).toBeVisible();
  48 | 
  49 |     // Verify at least one integration exists
  50 |     const integrationRows = page.locator('[data-testid="integration-row"]').or(
  51 |       page.locator('table tbody tr, .integration-item')
  52 |     );
  53 | 
  54 |     await expect(integrationRows.first()).toBeVisible({ timeout: 5000 });
  55 |   });
  56 | 
  57 |   test('should navigate between main sections', async ({ page }) => {
  58 |     await page.goto('/');
  59 | 
  60 |     // Dashboard
  61 |     await page.getByRole('link', { name: /dashboard/i }).click();
  62 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  63 | 
  64 |     // Campaigns
  65 |     await page.getByRole('link', { name: /campaigns/i }).click();
  66 |     await expect(page.getByRole('heading', { name: /campaigns/i })).toBeVisible();
  67 | 
  68 |     // Integrations
  69 |     await page.getByRole('link', { name: /integrations/i }).click();
  70 |     await expect(page.getByRole('heading', { name: /integrations/i })).toBeVisible();
  71 | 
  72 |     // Test Console
  73 |     const testConsoleLink = page.getByRole('link', { name: /test console/i });
  74 |     if (await testConsoleLink.isVisible({ timeout: 1000 }).catch(() => false)) {
  75 |       await testConsoleLink.click();
  76 |       await expect(page.getByRole('heading', { name: /test console/i })).toBeVisible();
  77 |     }
  78 | 
  79 |     // Activity
  80 |     const activityLink = page.getByRole('link', { name: /activity/i });
  81 |     if (await activityLink.isVisible({ timeout: 1000 }).catch(() => false)) {
  82 |       await activityLink.click();
  83 |       await expect(page.getByRole('heading', { name: /activity/i })).toBeVisible();
  84 |     }
  85 |   });
  86 | });
  87 | 
```