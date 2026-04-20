import { test, expect } from '@playwright/test'
import { TEST_USER, loginAs } from '../fixtures/auth'

test.describe('Authentification', () => {

  test('redirige vers /login depuis la racine', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Adresse email')).toBeVisible()
    await expect(page.getByLabel('Mot de passe')).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })

  test('affiche une erreur avec des identifiants incorrects', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Adresse email').fill('faux@test.sn')
    await page.getByLabel('Mot de passe').fill('mauvais_mdp')
    await page.getByRole('button', { name: /Se connecter/i }).click()
    await expect(page.getByText(/incorrects|invalide|erreur/i)).toBeVisible({ timeout: 8_000 })
  })

  test('connexion réussie redirige vers le dashboard', async ({ page }) => {
    await loginAs(page)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/Assalamu Alaikum/i)).toBeVisible()
  })

  test('affiche le nom du Dahira dans la sidebar après connexion', async ({ page }) => {
    await loginAs(page)
    await expect(page.getByText(TEST_USER.dahiraName)).toBeVisible()
  })

  test('déconnexion redirige vers /login', async ({ page }) => {
    await loginAs(page)
    await page.getByRole('button', { name: /Déconnexion/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

})
