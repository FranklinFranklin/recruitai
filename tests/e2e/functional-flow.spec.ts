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
    await expect(page.locator('text=System Health & Overview')).toBeVisible();
  });

  test('Recruiter can log in and view Customer Portal', async ({ page }) => {
    await page.goto('/api/auth/signin');
    
    // Fill in the custom credentials form
    await page.fill('input[name="email"]', 'recruiter@techstaffing.local');
    await page.fill('input[name="password"]', '1234');
    await page.click('button:has-text("Sign in with Local Development Login")');

    // Verify Customer Dashboard loads
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('Admin can use Switch Account to return to sign in', async ({ page }) => {
    await page.goto('/api/auth/signin');
    await page.fill('input[name="email"]', 'admin@recruitai.local');
    await page.fill('input[name="password"]', '1234');
    await page.click('button:has-text("Sign in with Local Development Login")');
    await expect(page).toHaveURL(/.*\/admin/);

    const switchBtn = page.locator('button:has-text("Switch Account")');
    await expect(switchBtn).toBeVisible();
    await switchBtn.click();
    await expect(page).toHaveURL(/.*\/api\/auth\/signin/);
  });

  test('Recruiter can use Switch Account to return to sign in', async ({ page }) => {
    await page.goto('/api/auth/signin');
    await page.fill('input[name="email"]', 'recruiter@techstaffing.local');
    await page.fill('input[name="password"]', '1234');
    await page.click('button:has-text("Sign in with Local Development Login")');
    await expect(page).toHaveURL(/.*\/app/);

    const switchBtn = page.locator('button:has-text("Switch Account"), button:has-text("Ander account")');
    await expect(switchBtn).toBeVisible();
    await switchBtn.click();
    await expect(page).toHaveURL(/.*\/api\/auth\/signin/);
  });
});
