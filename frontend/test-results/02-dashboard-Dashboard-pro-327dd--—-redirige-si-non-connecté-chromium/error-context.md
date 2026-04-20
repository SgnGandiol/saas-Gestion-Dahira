# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-dashboard.spec.ts >> Dashboard >> protège le dashboard — redirige si non connecté
- Location: tests\e2e\02-dashboard.spec.ts:20:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/dashboard
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '../fixtures/auth'
  2  | 
  3  | test.describe('Dashboard', () => {
  4  | 
  5  |   test('affiche les 4 cartes KPI', async ({ loggedInPage: page }) => {
  6  |     await expect(page.getByText('Membres actifs')).toBeVisible()
  7  |     await expect(page.getByText('Familles')).toBeVisible()
  8  |     await expect(page.getByText('Prochain tour')).toBeVisible()
  9  |     await expect(page.getByText('Caisse du mois')).toBeVisible()
  10 |   })
  11 | 
  12 |   test('affiche la sidebar avec tous les liens de navigation', async ({ loggedInPage: page }) => {
  13 |     await expect(page.getByRole('link', { name: /Tableau de bord/i })).toBeVisible()
  14 |     await expect(page.getByRole('link', { name: /Membres/i })).toBeVisible()
  15 |     await expect(page.getByRole('link', { name: /Familles/i })).toBeVisible()
  16 |     await expect(page.getByRole('link', { name: /Tours/i })).toBeVisible()
  17 |     await expect(page.getByRole('link', { name: /Finance/i })).toBeVisible()
  18 |   })
  19 | 
  20 |   test('protège le dashboard — redirige si non connecté', async ({ page }) => {
> 21 |     await page.goto('/dashboard')
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/dashboard
  22 |     await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  23 |   })
  24 | 
  25 | })
  26 | 
```