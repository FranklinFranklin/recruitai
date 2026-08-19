import { test, expect } from '@playwright/test';

test.describe('Tenant Isolation', () => {
  test('Redirects unauthenticated users to login', async ({ page }) => {
    // Attempt to access protected customer portal
    await page.goto('/app');
    // Should be redirected to sign in by our requireTenantMember utility
    await expect(page).toHaveURL(/.*\/api\/auth\/signin.*/);
  });

  test('Redirects unauthenticated users from admin', async ({ page }) => {
    // Attempt to access protected admin portal
    await page.goto('/admin');
    // Should be redirected to sign in by our requireSystemAdmin utility
    await expect(page).toHaveURL(/.*\/api\/auth\/signin.*/);
  });
});
