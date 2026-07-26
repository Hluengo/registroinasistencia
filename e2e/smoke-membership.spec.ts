import { test, expect } from '@playwright/test';

const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? 'staff@colegio.cl';
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD ?? '123456';

test.describe('Inasistencias - Phase 2 Membership Smoke', () => {
  test('login/logout with flag=false', async ({ page }) => {
    const errors: string[] = [];
    const membershipRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('request', (req) => {
      if (req.url().includes('rpc') || req.url().includes('membership')) {
        membershipRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Click "Ingresar Staff" in topbar (scope to main to avoid mobile duplicate)
    await page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill credentials
    await dialog.getByPlaceholder('staff@colegio.cl').fill(STAFF_EMAIL);
    await dialog.getByPlaceholder('••••••••').fill(STAFF_PASSWORD);
    await dialog.getByRole('button', { name: 'Ingresar', exact: true }).click();

    // Wait for auth + role resolution (refreshRole may take time)
    await page.waitForTimeout(5000);

    // Verify logged in — email visible in topbar (scope to main to avoid mobile duplicate)
    await expect(page.getByRole('main').getByText(STAFF_EMAIL)).toBeVisible({ timeout: 10000 });

    // Verify role label visible (exact match to avoid matching "staff@colegio.cl")
    await expect(page.getByRole('main').getByText('Staff', { exact: true })).toBeVisible({
      timeout: 5000,
    });

    // No membership-related errors
    expect(errors.filter((e) => /membership/i.test(e))).toEqual([]);

    // Logout
    await page.getByRole('main').getByRole('button', { name: 'Salir' }).click();
    await page.waitForTimeout(3000);

    // "Ingresar Staff" button visible again
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' })
    ).toBeVisible({
      timeout: 5000,
    });
  });
});
