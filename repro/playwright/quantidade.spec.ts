import { test, expect } from '@playwright/test'

test('quantidade input should not accept letters', async ({ page }) => {
  // login
  await page.goto('/')
  await page.getByPlaceholder('Email').fill('davinanuque@gmail.coM')
  await page.getByPlaceholder('Senha').fill('1234')
  await page.getByRole('button', { name: /entrar|login/i }).click()

  // navigate to admin dashboard page where modal exists
  await page.goto('/admin/dashboard')

  // open the modal/manage dialog if needed: try clicking a button that opens it
  const manageBtn = page.getByRole('button', { name: /gerenciar moedas/i })
  if (await manageBtn.count() > 0) await manageBtn.first().click()

  const input = page.locator('#quantidade')
  await expect(input).toBeVisible()

  // type letters
  await input.fill('')
  await input.type('abcde')
  // value should be empty
  await expect(input).toHaveValue('')

  // paste letters
  await input.fill('')
  await input.evaluate((el: HTMLInputElement) => el.focus())
  await page.keyboard.insertText('e')
  // still empty
  await expect(input).toHaveValue('')

  // type digits should work
  await input.fill('')
  await input.type('123')
  await expect(input).toHaveValue('123')
})
