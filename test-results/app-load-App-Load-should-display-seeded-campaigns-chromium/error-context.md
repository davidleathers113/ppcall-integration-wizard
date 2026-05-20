# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-load.spec.ts >> App Load >> should display seeded campaigns
- Location: e2e/app-load.spec.ts:23:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: /campaigns/i })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - heading "PPCall Studio" [level=1] [ref=e6]:
      - img [ref=e7]
      - generic [ref=e9]: PPCall Studio
    - navigation [ref=e10]:
      - list [ref=e11]:
        - listitem [ref=e12]:
          - button "Dashboard" [ref=e13]:
            - img [ref=e14]
            - text: Dashboard
        - listitem [ref=e19]:
          - button "Campaigns" [ref=e20]:
            - img [ref=e21]
            - text: Campaigns
        - listitem [ref=e25]:
          - button "Integrations" [ref=e26]:
            - img [ref=e27]
            - text: Integrations
        - listitem [ref=e29]:
          - button "Add Integration" [ref=e30]:
            - img [ref=e31]
            - text: Add Integration
        - listitem [ref=e33]:
          - button "Bulk Import" [ref=e34]:
            - img [ref=e35]
            - text: Bulk Import
        - listitem [ref=e38]:
          - button "Test Console" [ref=e39]:
            - img [ref=e40]
            - text: Test Console
        - listitem [ref=e42]:
          - button "AI Assistant" [ref=e43]:
            - img [ref=e44]
            - text: AI Assistant
        - listitem [ref=e47]:
          - button "Developer/API" [ref=e48]:
            - img [ref=e49]
            - text: Developer/API
        - listitem [ref=e54]:
          - button "Activity" [ref=e55]:
            - img [ref=e56]
            - text: Activity
    - generic [ref=e60]:
      - paragraph [ref=e61]: Mock Environment v1.0
      - paragraph [ref=e62]: © 2026 Self-Service PPCall Integration Studio
  - main [ref=e63]:
    - generic [ref=e65]:
      - generic [ref=e66]:
        - heading "Platform Overview" [level=2] [ref=e67]
        - paragraph [ref=e68]: Monitor your integration health and campaign performance.
      - generic [ref=e69]:
        - generic [ref=e72]:
          - img [ref=e73]
          - generic [ref=e76]: "2"
          - generic [ref=e77]: Active
        - generic [ref=e80]:
          - img [ref=e81]
          - generic [ref=e83]: "1"
          - generic [ref=e84]: Need Testing
        - generic [ref=e87]:
          - img [ref=e88]
          - generic [ref=e90]: "1"
          - generic [ref=e91]: Failing
        - generic [ref=e94]:
          - img [ref=e95]
          - generic [ref=e98]: "0"
          - generic [ref=e99]: Stale/Dormant
        - generic [ref=e102]:
          - img [ref=e103]
          - generic [ref=e106]: "3"
          - generic [ref=e107]: Used This Week
      - generic [ref=e108]:
        - generic [ref=e110]:
          - generic [ref=e112]:
            - heading "Integration Health" [level=3] [ref=e113]
            - paragraph [ref=e114]: Integrations requiring attention
          - generic [ref=e116]:
            - generic [ref=e117]:
              - generic [ref=e120]:
                - paragraph [ref=e121]: Coastal Plumbing Buyer
                - paragraph [ref=e122]: buyer • GENERIC_API
              - generic [ref=e123]: failing
            - generic [ref=e124]:
              - generic [ref=e127]:
                - paragraph [ref=e128]: SearchCalls Legal
                - paragraph [ref=e129]: publisher • RTB
              - generic [ref=e130]: needs testing
        - generic [ref=e131]:
          - generic [ref=e132]:
            - heading "Recent Activity" [level=3] [ref=e134]
            - img [ref=e136]
          - generic [ref=e141]:
            - generic [ref=e145]:
              - paragraph [ref=e146]: Sarah created Premier Home Services RTB.
              - paragraph [ref=e147]: 1/11/2026, 6:00:00 AM
            - generic [ref=e151]:
              - paragraph [ref=e152]: Test passed in 412ms.
              - paragraph [ref=e153]: 1/11/2026, 6:15:00 AM
            - generic [ref=e157]:
              - paragraph [ref=e158]: Integration activated.
              - paragraph [ref=e159]: 1/12/2026, 5:00:00 AM
            - generic [ref=e163]:
              - paragraph [ref=e164]: "Integration failed: 404 Not Found from buyer endpoint."
              - paragraph [ref=e165]: 5/18/2026, 6:05:00 AM
            - generic [ref=e169]:
              - paragraph [ref=e170]: "Integration marked stale: no traffic in 30+ days."
              - paragraph [ref=e171]: 5/14/2026, 8:00:00 PM
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
  17 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  18 | 
  19 |     // Verify no console errors occurred
  20 |     expect(consoleErrors).toHaveLength(0);
  21 |   });
  22 | 
  23 |   test('should display seeded campaigns', async ({ page }) => {
  24 |     await page.goto('/');
  25 | 
  26 |     // Navigate to campaigns
> 27 |     await page.getByRole('link', { name: /campaigns/i }).click();
     |                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
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