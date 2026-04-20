import { test as base, expect, Page } from '@playwright/test'

// Credentials de test (créés dans le seeder)
export const TEST_USER = {
  email:       'admin@touba.sn',
  password:    'password123',
  name:        'Admin Test',
  dahiraName:  'Dahira Touba Dakar',
}

// Helper : login via l'interface
export async function loginAs(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login')
  await page.getByLabel('Adresse email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: /Se connecter/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

// Fixture étendue avec login automatique
export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await loginAs(page)
    await use(page)
  },
})

export { expect }
