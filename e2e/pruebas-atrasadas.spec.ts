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
    await expect(page.getByRole('button', { name: 'Tabla' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await page.getByRole('button', { name: 'Calendario' }).click()
    await expect(
      page.getByRole('button', { name: 'Calendario' })
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByLabel('Filtrar pruebas atrasadas por curso')
    ).toBeVisible()
  })

  test('abre el detalle del estudiante desde la tabla', async ({ page }) => {
    await page.getByRole('button', { name: 'Tabla' }).click()
    const row = page.locator('tbody tr').first()
    if ((await row.count()) === 0) return

    const studentName = await row.locator('td').first().innerText()
    await row.getByRole('button', { name: 'Ver pruebas' }).click()

    const modal = page.getByTestId('modal-makeup-student-detail-dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByText(studentName, { exact: true })).toBeVisible()
    await expect(modal.getByRole('combobox').first()).toBeVisible()
  })

  test('permite editar la prueba registrada', async ({ page }) => {
    await page.getByRole('button', { name: 'Tabla' }).click()
    const row = page.locator('tbody tr').first()
    if ((await row.count()) === 0) return

    const editButton = row.getByRole('button', { name: /Editar/ }).first()
    if ((await editButton.count()) === 0) return
    await editButton.click()

    const modal = page.getByTestId('modal-makeup-exam-dialog')
    await expect(modal).toBeVisible()
    const tests = modal.locator('input[type="checkbox"]')
    if ((await tests.count()) === 0) return
    await expect(tests.first()).toBeEnabled()
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
      await expect(page.getByLabel('Observación general')).toBeVisible()

      const course = page.getByTestId('makeup-exam-course')
      if ((await course.locator('option').count()) <= 1) return
      await course.selectOption({ index: 1 })

      const student = page.getByTestId('makeup-exam-student')
      await expect(student).toBeEnabled()
      const tests = page.locator(
        '[data-testid="makeup-exam-tests"] input[type="checkbox"]'
      )
      const testCount = await tests.count()
      if (testCount > 0) {
        await tests.nth(0).check()
        await expect(
          page.getByTestId('makeup-exam-selected-tests')
        ).toBeVisible()
      }
      await page.getByRole('button', { name: 'Agregar manualmente' }).click()
      await expect(page.getByTestId('makeup-exam-manual-subject')).toBeVisible()
      await page.getByTestId('makeup-exam-manual-add').click()
      await expect(
        page.getByTestId('makeup-exam-manual-subject-1')
      ).toBeVisible()
      await page.getByTestId('makeup-exam-manual-subject').fill('Biología')
      await page
        .getByTestId('makeup-exam-manual-scheduled-date')
        .fill('2026-08-28')
      await page
        .getByTestId('makeup-exam-manual-notes')
        .fill('Coordinar con UTP')
      await page.getByTestId('makeup-exam-manual-subject-1').fill('Física')
      await page
        .getByTestId('makeup-exam-manual-scheduled-date-1')
        .fill('2026-08-29')
      await page
        .getByTestId('makeup-exam-manual-notes-1')
        .fill('Avisar al apoderado')
      if (testCount > 0) {
        await expect(
          page.getByTestId('makeup-exam-selected-tests')
        ).toBeVisible()
      }
      await page.getByRole('button', { name: 'Prueba registrada' }).click()
      if (testCount === 0) return
      if (testCount > 1) await tests.nth(1).check()
      await expect(
        page.getByText(
          new RegExp(`${testCount > 1 ? 2 : 1} pruebas? seleccionadas?`)
        )
      ).toBeVisible()
    }
  })

  test('muestra pruebas atrasadas en la Vista Docente', async ({ page }) => {
    await page.getByRole('button', { name: 'Vista Docente', exact: true }).click()
    await expect(page.locator('h1').filter({ hasText: 'Vista Docente' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Pruebas atrasadas' })
    ).toBeVisible()
  })
})
