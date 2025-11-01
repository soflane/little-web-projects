import { test, expect } from '@playwright/test';

test('should create a ticket with advanced features', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Fill title
  await page.fill('input[placeholder="Enter ticket title"]', 'Test Ticket');

  // Select email (simulate dropdown, but for e2e, type custom)
  await page.click('input[placeholder="Search or select email..."]');
  await page.fill('input[placeholder="Search or select email..."]', 'test@example.com');

  // Select priority
  await page.selectOption('select', '2'); // Medium

  // Type in Quill
  await page.focus('.ql-editor');
  await page.type('.ql-editor', 'Test note with formatting');

  // Format with Quill (bold)
  await page.click('.ql-bold');
  await page.type('.ql-editor', ' bold text');

  // Submit
  await page.click('button:has-text("Create Ticket")');

  // Wait for success
  await expect(page.locator('text=Ticket')).toBeVisible();
  await expect(page.locator('button:has-text("View in Zammad")')).toBeVisible();

  // Click view button
  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    page.click('button:has-text("View in Zammad")')
  ]);
  await expect(newPage.url()).toContain('/ticket/zoom/');

  // Create another
  await page.click('button:has-text("Create Another")');
  await expect(page.locator('input[placeholder="Enter ticket title"]')).toBeVisible();
});
