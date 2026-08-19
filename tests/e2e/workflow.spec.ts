import { test, expect } from '@playwright/test';

test.describe('RecruitAI End-to-End Tests', () => {

  test('Routing: Landing page exists and renders correctly', async ({ page }) => {
    // Navigate to root
    await page.goto('/');
    
    // Check that we stay on the landing page (no redirect if not logged in)
    await expect(page).toHaveURL(/.*localhost:3000\/?$/);
    
    // Check that the login screen text is present
    await expect(page.locator('text=RecruitAI').first()).toBeVisible();
    await expect(page.locator('text=Veilig AI Recruitment Platform')).toBeVisible();
    
    // Check that the login button exists (we know it says "Inloggen bij RecruitAI")
    const signInButton = page.locator('text=Inloggen bij RecruitAI');
    await expect(signInButton).toBeVisible();
    
    // Verify GDPR text at the bottom
    await expect(page.locator('text=Strictly Confidential & GDPR Compliant')).toBeVisible();
  });

  test('Security: Unauthenticated users are redirected to login when accessing /app', async ({ page }) => {
    // Navigate to a protected route
    await page.goto('/app/approvals');
    
    // Should redirect to Auth.js signin page (the default NextAuth page)
    await expect(page).toHaveURL(/.*api\/auth\/signin.*/);
  });

});
