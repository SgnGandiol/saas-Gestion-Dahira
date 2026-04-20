# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-dashboard.spec.ts >> Dashboard >> affiche les 4 cartes KPI
- Location: tests\e2e\02-dashboard.spec.ts:5:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | import { test as base, expect, Page } from '@playwright/test'
  2  | 
  3  | // Credentials de test (créés dans le seeder)
  4  | export const TEST_USER = {
  5  |   email:       'admin@touba.sn',
  6  |   password:    'password123',
  7  |   name:        'Admin Test',
  8  |   dahiraName:  'Dahira Touba Dakar',
  9  | }
  10 | 
  11 | // Helper : login via l'interface
  12 | export async function loginAs(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
> 13 |   await page.goto('/login')
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  14 |   await page.getByLabel('Adresse email').fill(email)
  15 |   await page.getByLabel('Mot de passe').fill(password)
  16 |   await page.getByRole('button', { name: /Se connecter/i }).click()
  17 |   await page.waitForURL('**/dashboard', { timeout: 10_000 })
  18 | }
  19 | 
  20 | // Fixture étendue avec login automatique
  21 | export const test = base.extend<{ loggedInPage: Page }>({
  22 |   loggedInPage: async ({ page }, use) => {
  23 |     await loginAs(page)
  24 |     await use(page)
  25 |   },
  26 | })
  27 | 
  28 | export { expect }
  29 | 
```