import { expect, test } from '@playwright/test'
import { loginAsStaff } from './helpers/auth'

test.describe('Pruebas atrasadas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page)
    await page
      .getByRole('button', { name: 'Pruebas Atrasadas', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Pruebas atrasadas' })
    ).toBeVisible()
  })

  test('muestra filtros, calendario y resumen', async ({ page }) => {
    await expect(page.getByText('Total del mes')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Calendario' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tabla' })).toBeVisible()
    await expect(
      page.getByLabel('Filtrar pruebas atrasadas por curso')
    ).toBeVisible()
  })

  test('abre el formulario de recuperación cuando hay estudiantes', async ({
    page,
  }) => {
    const button = page.getByRole('button', { name: 'Nueva recuperación' })
    await expect(button).toBeVisible()
    if (await button.isEnabled()) {
      await button.click()
      await expect(page.getByTestId('modal-makeup-exam-dialog')).toBeVisible()
      await expect(page.getByLabel('Estudiante')).toBeVisible()
      await expect(page.getByLabel('Asignatura')).toBeVisible()
    }
  })
})
