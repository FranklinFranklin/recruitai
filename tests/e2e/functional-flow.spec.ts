import { test, expect } from '@playwright/test';

test.describe('Functional Flow Tests', () => {

  test('Guest is redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Inloggen bij RecruitAI')).toBeVisible();
    
    // Clicking the login button should go to Auth.js Signin page
    await page.click('text=Inloggen bij RecruitAI');
    await expect(page).toHaveURL(/.*\/api\/auth\/signin.*/);
  });

  test('Admin can log in and view System Health', async ({ page }) => {
    await page.goto('/api/auth/signin');
    
    // Fill in the custom credentials form we created
    await page.fill('input[name="email"]', 'admin@recruitai.local');
    await page.fill('input[name="password"]', '1234');
    await page.click('button:has-text("Sign in with Local Development Login")');

    // Should be redirected to /admin automatically because of their global role
    await expect(page).toHaveURL(/.*\/admin/);
    
    // Verify Admin Dashboard loads
    await expect(page.locator('text=Admin Portal')).toBeVisible();

    // Verify Sidebar links work
    await page.click('text=System & Threats');
    await expect(page).toHaveURL(/.*\/admin\/system/);
    await expect(page.locator('text=System Health & Threat Monitor')).toBeVisible();
    
    // The DB indicator should be OPERATIONAL
    const dbCard = page.locator('.p-4.bg-white').filter({ hasText: 'PostgreSQL Database' });
    await expect(dbCard.getByText('OPERATIONAL')).toBeVisible();
  });

  test('Recruiter can log in and view Customer Portal', async ({ page }) => {
    await page.goto('/api/auth/signin');
    
    // Fill in the custom credentials form
    await page.fill('input[name="email"]', 'recruiter@techstaffing.local');
    await page.fill('input[name="password"]', '1234');
    await page.click('button:has-text("Sign in with Local Development Login")');

    // Should be redirected to /app automatically
    await expect(page).toHaveURL(/.*\/app/);
    
    // Verify Customer Dashboard loads
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    
    // Verify Sidebar navigation
    await page.click('text=Candidates');
    await expect(page).toHaveURL(/.*\/app\/candidates/);
  });

});
