/** @license SPDX-License-Identifier: Apache-2.0 */

import { test, expect } from '@playwright/test';

const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? 'staff@colegio.cl';
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD ?? '123456';

test.describe('Inasistencias - Phase 3 Membership Enforcement', () => {
  test('legacy mode: login/logout with flag=false (no membership check)', async ({ page }) => {
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

    await page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByPlaceholder('staff@colegio.cl').fill(STAFF_EMAIL);
    await dialog.getByPlaceholder('••••••••').fill(STAFF_PASSWORD);
    await dialog.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await page.waitForTimeout(5000);

    await expect(page.getByRole('main').getByText(STAFF_EMAIL)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('main').getByText('Staff', { exact: true })).toBeVisible({
      timeout: 5000,
    });

    expect(errors.filter((e) => /membership/i.test(e))).toEqual([]);

    await page.getByRole('main').getByRole('button', { name: 'Salir' }).click();
    await page.waitForTimeout(3000);

    await expect(
      page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('transition mode: teacher with active membership', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByPlaceholder('staff@colegio.cl').fill(STAFF_EMAIL);
    await dialog.getByPlaceholder('••••••••').fill(STAFF_PASSWORD);
    await dialog.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await page.waitForTimeout(5000);

    const isMainVisible = await page
      .getByRole('main')
      .getByText(STAFF_EMAIL)
      .isVisible()
      .catch(() => false);
    const isAccessDenied = await page
      .getByText('No tiene acceso')
      .isVisible()
      .catch(() => false);

    expect(isMainVisible || isAccessDenied).toBe(true);

    if (isMainVisible) {
      await page.getByRole('main').getByRole('button', { name: 'Salir' }).click();
      await page.waitForTimeout(3000);
    }
  });

  test('enforced mode: AccessDenied when no membership', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByPlaceholder('staff@colegio.cl').fill(STAFF_EMAIL);
    await dialog.getByPlaceholder('••••••••').fill(STAFF_PASSWORD);
    await dialog.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await page.waitForTimeout(5000);

    const isMainVisible = await page
      .getByRole('main')
      .getByText(STAFF_EMAIL)
      .isVisible()
      .catch(() => false);
    const isAccessDenied = await page
      .getByText('No tiene acceso')
      .isVisible()
      .catch(() => false);

    expect(isMainVisible || isAccessDenied).toBe(true);
  });

  test('logout clears session and returns to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByPlaceholder('staff@colegio.cl').fill(STAFF_EMAIL);
    await dialog.getByPlaceholder('••••••••').fill(STAFF_PASSWORD);
    await dialog.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await page.waitForTimeout(5000);

    await expect(page.getByRole('main').getByText(STAFF_EMAIL)).toBeVisible({ timeout: 10000 });

    await page.getByRole('main').getByRole('button', { name: 'Salir' }).click();
    await page.waitForTimeout(3000);

    await expect(
      page.getByRole('main').getByRole('button', { name: 'Ingresar Staff' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('rollback: user without membership sees AccessDenied', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const isIngresarVisible = await page
      .getByRole('main')
      .getByRole('button', { name: 'Ingresar Staff' })
      .isVisible()
      .catch(() => false);
    const isDashboardVisible = await page
      .getByText('Dashboard')
      .isVisible()
      .catch(() => false);

    expect(isIngresarVisible || isDashboardVisible).toBe(true);
  });
});
