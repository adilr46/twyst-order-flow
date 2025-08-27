import { test, expect } from '@playwright/test';

const TEST_VENUE = 'demo-restaurant';
const TEST_TOKEN = 'demo123';
const TEST_ORDER_ID = 'order_demo_123';

test.describe('Diner Flow E2E Tests', () => {
  
  test('Test 1: Token Guard Redirect', async ({ page }) => {
    // Go to diner menu without token
    await page.goto(`/d/${TEST_VENUE}`);
    
    // Should redirect to scan-again page
    await expect(page).toHaveURL(new RegExp(`/scan-again\\?slug=${TEST_VENUE}`));
    
    // Should show scan again content
    await expect(page.locator('h1, h2').filter({ hasText: /scan|qr|nfc/i })).toBeVisible();
  });

  test('Test 2: Diner Menu with Token', async ({ page }) => {
    // Go to diner menu with token
    await page.goto(`/d/${TEST_VENUE}?t=${TEST_TOKEN}`);
    
    // Should show menu container
    await expect(page.locator('[role="main"], h1, h2').filter({ hasText: /menu|table/i })).toBeVisible();
    
    // Try to add an item to cart
    const addButton = page.locator('button').filter({ hasText: /add|cart|\+/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Look for cart or checkout button
      const checkoutButton = page.locator('button').filter({ hasText: /checkout|pay|order/i });
      if (await checkoutButton.isVisible()) {
        // Mock or skip Stripe - just verify checkout flow starts
        await checkoutButton.click();
        
        // Should navigate to checkout or show payment form
        await page.waitForTimeout(1000);
        // Mark as successful if no errors thrown
      }
    }
  });

  test('Test 3: Order Status Page', async ({ page }) => {
    // Navigate to order status
    await page.goto(`/order-status?orderId=${TEST_ORDER_ID}`);
    
    // Should render without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Should show status-related content
    const statusContent = page.locator('text=/pending|preparing|paid|status|order/i');
    await expect(statusContent.first()).toBeVisible();
  });

  test('Test 4: FOH Board', async ({ page }) => {
    // Go to FOH board
    await page.goto('/foh');
    
    // Should render without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Look for FOH-related content
    const fohContent = page.locator('h1, h2, [role="main"]').filter({ hasText: /foh|order|kitchen|board/i });
    await expect(fohContent.first()).toBeVisible();
    
    // Try to find and click refresh button
    const refreshButton = page.locator('button').filter({ hasText: /refresh|reload/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      // Should not throw runtime errors
      await page.waitForTimeout(500);
    }
  });

});


