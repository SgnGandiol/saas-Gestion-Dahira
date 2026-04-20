import { test, expect, loginAs } from '../fixtures/auth'

test.describe('Gestion des membres', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto('/dashboard/members')
    await page.waitForURL('**/dashboard/members')
  })

  test('navigue vers la page membres', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/members/)
    await expect(page.getByRole('heading', { name: /Membres/i })).toBeVisible()
  })

  test('affiche le bouton "Ajouter un membre"', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Ajouter un membre/i })).toBeVisible()
  })

  test('affiche la barre de recherche', async ({ page }) => {
    await expect(page.getByPlaceholder(/Rechercher un membre/i)).toBeVisible()
  })

  test('la recherche filtre les résultats', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher un membre/i).fill('zzz_inexistant_zzz')
    await expect(page.getByText(/Aucun membre trouvé/i)).toBeVisible()
  })

  test('ouvre modale pour créer un membre', async ({ page }) => {
    await page.getByRole('button', { name: /Ajouter un membre/i }).click()
    await expect(page.getByText('Ajouter un membre')).toBeVisible()
    await expect(page.getByLabel('Prénom')).toBeVisible()
    await expect(page.getByLabel('Nom')).toBeVisible()
  })

  test('crée un nouveau membre avec succès', async ({ page }) => {
    // Ouvrir modale
    await page.getByRole('button', { name: /Ajouter un membre/i }).click()
    await expect(page.getByText('Ajouter un membre')).toBeVisible()

    // Remplir formulaire
    await page.getByLabel('Prénom').fill('TpstMamadou')
    await page.getByLabel('Nom').fill('Test')
    await page.getByLabel('Sexe').selectOption('male')

    // Soumettre
    await page.getByRole('button', { name: /Ajouter le membre/i }).click()

    // Vérifier fermeture et ajout
    await page.waitForTimeout(500)
    await expect(page.getByText('Ajouter un membre')).not.toBeVisible()
    await expect(page.getByText('TpstMamadou Test')).toBeVisible()
  })
})
