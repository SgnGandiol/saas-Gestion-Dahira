import { test, expect } from '../fixtures/auth'

test.describe('Dashboard', () => {

  test('affiche les 4 cartes KPI', async ({ loggedInPage: page }) => {
    await expect(page.getByText('Membres actifs')).toBeVisible()
    await expect(page.getByText('Familles')).toBeVisible()
    await expect(page.getByText('Prochain tour')).toBeVisible()
    await expect(page.getByText('Caisse du mois')).toBeVisible()
  })

  test('affiche la sidebar avec tous les liens de navigation', async ({ loggedInPage: page }) => {
    await expect(page.getByRole('link', { name: /Tableau de bord/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Membres/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Familles/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Tours/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Finance/i })).toBeVisible()
  })

  test('protège le dashboard — redirige si non connecté', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

})
