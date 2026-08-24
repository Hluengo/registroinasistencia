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
      await expect(page.getByTestId('makeup-exam-course')).toBeVisible()
      await expect(page.getByLabel('Estudiante')).toBeVisible()

      const course = page.getByTestId('makeup-exam-course')
      if ((await course.locator('option').count()) <= 1) return
      await course.selectOption({ index: 1 })

      const student = page.getByTestId('makeup-exam-student')
      await expect(student).toBeEnabled()
      await page.getByRole('button', { name: 'Agregar manualmente' }).click()
      await expect(page.getByTestId('makeup-exam-manual-subject')).toBeVisible()
      await expect(
        page.getByTestId('makeup-exam-manual-original-date')
      ).toBeVisible()
      await page.getByRole('button', { name: 'Prueba registrada' }).click()
      const tests = page.locator(
        '[data-testid="makeup-exam-tests"] input[type="checkbox"]'
      )
      const testCount = await tests.count()
      if (testCount === 0) return
      await tests.nth(0).check()
      if (testCount > 1) await tests.nth(1).check()
      await expect(
        page.getByText(
          new RegExp(`${testCount > 1 ? 2 : 1} pruebas? seleccionadas?`)
        )
      ).toBeVisible()
    }
  })
})
