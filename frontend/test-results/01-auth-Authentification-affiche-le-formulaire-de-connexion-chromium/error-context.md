# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-auth.spec.ts >> Authentification >> affiche le formulaire de connexion
- Location: tests\e2e\01-auth.spec.ts:11:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { TEST_USER, loginAs } from '../fixtures/auth'
  3  | 
  4  | test.describe('Authentification', () => {
  5  | 
  6  |   test('redirige vers /login depuis la racine', async ({ page }) => {
  7  |     await page.goto('/')
  8  |     await expect(page).toHaveURL(/\/login/)
  9  |   })
  10 | 
  11 |   test('affiche le formulaire de connexion', async ({ page }) => {
> 12 |     await page.goto('/login')
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  13 |     await expect(page.getByLabel('Adresse email')).toBeVisible()
  14 |     await expect(page.getByLabel('Mot de passe')).toBeVisible()
  15 |     await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  16 |   })
  17 | 
  18 |   test('affiche une erreur avec des identifiants incorrects', async ({ page }) => {
  19 |     await page.goto('/login')
  20 |     await page.getByLabel('Adresse email').fill('faux@test.sn')
  21 |     await page.getByLabel('Mot de passe').fill('mauvais_mdp')
  22 |     await page.getByRole('button', { name: /Se connecter/i }).click()
  23 |     await expect(page.getByText(/incorrects|invalide|erreur/i)).toBeVisible({ timeout: 8_000 })
  24 |   })
  25 | 
  26 |   test('connexion réussie redirige vers le dashboard', async ({ page }) => {
  27 |     await loginAs(page)
  28 |     await expect(page).toHaveURL(/\/dashboard/)
  29 |     await expect(page.getByText(/Assalamu Alaikum/i)).toBeVisible()
  30 |   })
  31 | 
  32 |   test('affiche le nom du Dahira dans la sidebar après connexion', async ({ page }) => {
  33 |     await loginAs(page)
  34 |     await expect(page.getByText(TEST_USER.dahiraName)).toBeVisible()
  35 |   })
  36 | 
  37 |   test('déconnexion redirige vers /login', async ({ page }) => {
  38 |     await loginAs(page)
  39 |     await page.getByRole('button', { name: /Déconnexion/i }).click()
  40 |     await expect(page).toHaveURL(/\/login/)
  41 |   })
  42 | 
  43 | })
  44 | 
```