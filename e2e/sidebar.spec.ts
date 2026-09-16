import { expect, test } from '@playwright/test'

test('abre el login desde el sidebar movil y cierra el menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Abrir menú lateral' }).click()
  await page.getByRole('button', { name: 'Ingresar Staff' }).click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Cerrar menú lateral' })
  ).toHaveClass(/pointer-events-none/)
})
