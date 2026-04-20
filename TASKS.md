# SGD — Priorisation des tâches

> Mis à jour : 17 avril 2026 — Blocs A, B, C, D complétés  
> Stack : Laravel 12 · GraphQL · Next.js 16

---

## Légende

| Symbole | Status |
|---------|--------|
| ✅ | Terminé |
| 🔄 | En cours |
| ⬜ | À faire |
| ⛔ | Bloqué |

---

## BLOC A — Backend : Logique métier manquante

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| A1 | `RotationService.php` — algorithme 6 critères | CRITIQUE | ✅ |
| A2 | `RotationMutation.php` — `autoScheduleRotation` + `updateRotationStatus` | CRITIQUE | ✅ |
| A3 | `DashboardQuery.php` — stats agrégées (KPIs) | HAUTE | ✅ |
| A4 | `schema.graphql` — ajout `suggestNextHouse`, `autoScheduleRotation`, `dashboardStats` | HAUTE | ✅ |

---

## BLOC B — Frontend : Pages manquantes

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| B1 | `/dashboard/rotations/page.tsx` — liste + planification auto/manuelle | CRITIQUE | ✅ |
| B2 | `/dashboard/families/page.tsx` — CRUD familles + maisons | HAUTE | ✅ |
| B3 | `/dashboard/finance/page.tsx` — cotisations + dépenses + solde | HAUTE | ✅ |
| B4 | `/dashboard/assignments/page.tsx` — tâches par rotation | MOYENNE | ✅ |
| B5 | `/dashboard/settings/page.tsx` — profil Dahira | MOYENNE | ✅ |

---

## BLOC C — Frontend : KPIs Dashboard dynamiques

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| C1 | Query `GET_DASHBOARD_STATS` | HAUTE | ✅ |
| C2 | `dashboard/page.tsx` — connecter KPIs réels | HAUTE | ✅ |

---

## BLOC D — GraphQL Frontend : queries/mutations manquantes

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| D1 | `graphql/queries/rotations.ts` | HAUTE | ✅ |
| D2 | `graphql/queries/families.ts` | HAUTE | ✅ |
| D3 | `graphql/queries/finance.ts` | HAUTE | ✅ |
| D4 | `graphql/mutations/rotations.ts` | HAUTE | ✅ |
| D5 | `graphql/mutations/families.ts` | HAUTE | ✅ |
| D6 | `graphql/mutations/finance.ts` | HAUTE | ✅ |

---

## BLOC E — Phase 3 Multi-tenant

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| E1 | Middleware `ResolveTenantMiddleware` (sous-domaine / header X-Tenant-ID) | HAUTE | ✅ |
| E2 | `TenantManager` singleton + `TenantScope` Eloquent (7 modèles) | HAUTE | ✅ |
| E3 | Migration PostgreSQL Row-Level Security | MOYENNE | ✅ |
| E4 | Page d'accueil publique + `/register` onboarding Dahira | HAUTE | ✅ |
| E5 | `AppServiceProvider` singleton + `bootstrap/app.php` middleware | HAUTE | ✅ |
| E6 | CORS wildcard `*.sgd.sn` + `X-Tenant-ID` dans Apollo headers | HAUTE | ✅ |
| E7 | `TenantIsolationTest.php` — tests isolation cross-tenant | HAUTE | ✅ |
| E8 | Invitation membres (lien / SMS) | BASSE | ⬜ |

---

## BLOC F — Phase 4 Production DevOps

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| F1 | `docker-compose.prod.yml` + images multi-stage | HAUTE | ⬜ |
| F2 | Nginx wildcard SSL (`*.sgd.sn`) | HAUTE | ⬜ |
| F3 | Script backup PostgreSQL → S3 / B2 | HAUTE | ⬜ |
| F4 | CI/CD GitHub Actions (test → build → deploy) | MOYENNE | ⬜ |
| F5 | Monitoring Sentry + alertes | MOYENNE | ⬜ |

---

## Ordre d'exécution recommandé

```
BLOC A (backend logique métier)
  → BLOC D (queries/mutations frontend)
    → BLOC B (pages frontend)
      → BLOC C (dashboard KPIs)
        → BLOC E (multi-tenant)
          → BLOC F (devops)
```

---

## Dépendances critiques

- `B1` (rotations frontend) dépend de `A1` + `A2` + `A4`
- `C2` (dashboard KPIs) dépend de `A3` + `A4` + `C1`
- `E1`→`E3` doivent être faites avant tout déploiement multi-dahira
- `F1`→`F5` requiert que Phase 2 soit complète à 100%

---

## BLOC G — Code Review Backend (2026-04-20)

> Corrections issues du code review complet du backend Laravel/GraphQL

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| G1 | ✅ Supprimer credentials hardcodés du seeder → lire `SUPER_ADMIN_EMAIL/PASSWORD` depuis `.env` | 🔴 CRITIQUE | ✅ |
| G2 | ✅ Désactiver introspection GraphQL automatiquement en `production` | 🔴 CRITIQUE | ✅ |
| G3 | Ajouter contrainte unique `(house_id, scheduled_date)` en migration (doublons rotations) | 🔴 CRITIQUE | ⬜ |
| G4 | ✅ Ajouter `@rules` validation sur tous les inputs GraphQL (email, phone, montants, enums) | 🟠 HAUTE | ✅ |
| G5 | ✅ Fixer pagination Lighthouse : `max_count: 100`, `default_count: 20` (était `null` = DoS) | 🟠 HAUTE | ✅ |
| G6 | ✅ Ajouter rate limiting `throttle:graphql` 60 req/min sur la route `/graphql` | 🟠 HAUTE | ✅ |
| G7 | ✅ Désactiver debug Lighthouse (`INCLUDE_TRACE`) hors environnement local | 🟠 HAUTE | ✅ |
| G8 | Ajouter `SoftDeletes` au modèle `Member` (incohérence avec les autres modèles) | 🟠 HAUTE | ⬜ |
| G9 | Ajouter contrainte unique sur `dahiras.slug` en migration (race condition inscription) | 🟠 HAUTE | ⬜ |
| G10 | Ajouter cascade delete `assignments` → quand un `Member` est supprimé | 🟠 HAUTE | ⬜ |
| G11 | Écrire tests PHPUnit : auth, tenant scoping, algorithme de rotation | 🟡 MOYEN | ⬜ |
| G12 | Optimiser `dashboardStats` : cache + éviter N+1 queries | 🟡 MOYEN | ⬜ |
| G13 | Sanitiser messages d'erreur de `autoScheduleRotation` (ne pas exposer logique interne) | 🟡 MOYEN | ⬜ |
| G14 | Ajouter gestion des timezones (casts Carbon explicites sur les champs date) | 🟡 MOYEN | ⬜ |
| G15 | Vérifier `.env` dans `.gitignore`, ajouter `@description` aux types GraphQL | 🟢 BAS | ⬜ |

---

## BLOC H — Code Review Frontend (2026-04-20)

> Corrections issues du code review complet du frontend Next.js/React/Apollo

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| H1 | ✅ Supprimer `NEXTAUTH_SECRET` hardcodé de `.env.local`, créer `.env.example` avec placeholder | 🔴 CRITIQUE | ✅ |
| H2 | ✅ Créer `middleware.ts` Next.js pour protéger `/dashboard/*` côté serveur | 🔴 CRITIQUE | ✅ |
| H3 | ✅ Token écrit en cookie `SameSite=Strict` en plus du localStorage (middleware peut le lire) | 🔴 CRITIQUE | ✅ |
| H4 | Ajouter `error.tsx` dans `/dashboard/` (Error Boundary) — crash total sans fallback UI | 🟠 HAUTE | ⬜ |
| H5 | Remplacer tous les `alert()` par des toasts Radix UI (déjà installé) | 🟠 HAUTE | ⬜ |
| H6 | Implémenter RBAC côté front : masquer Finance/Settings/Assignments selon le rôle | 🟠 HAUTE | ⬜ |
| H7 | Implémenter pagination UI sur toutes les listes (membres, familles, finances) — bloqué page 1 | 🟠 HAUTE | ⬜ |
| H8 | Remplacer tous les types `any` par les types de `types/index.ts` | 🟡 MOYEN | ⬜ |
| H9 | Créer composant `<Toast>` global (succès, erreur, confirmation) | 🟡 MOYEN | ⬜ |
| H10 | Ajouter skeleton loaders pour les chargements initiaux de pages | 🟡 MOYEN | ⬜ |
| H11 | Implémenter `optimisticResponse` Apollo sur les mutations (delete, update) | 🟡 MOYEN | ⬜ |
| H12 | Extraire l'état des formulaires modaux (8+ `useState` dans Finance) en custom hooks | 🟡 MOYEN | ⬜ |
| H13 | Gérer les erreurs réseau dans `lib/apollo.ts` avec feedback utilisateur | 🟡 MOYEN | ⬜ |
| H14 | Validation client : montants (min 0.01), capacités (min 1), dates futures pour rotations | 🟡 MOYEN | ⬜ |
| H15 | Remplacer `confirm()` natifs par modales Radix Dialog accessibles | 🟡 MOYEN | ⬜ |
| H16 | Écrire tests Playwright E2E : login, créer membre, planifier rotation, contribution | 🟢 BAS | ⬜ |
| H17 | Ajouter Firefox/Safari dans `playwright.config.ts` | 🟢 BAS | ⬜ |
| H18 | Supprimer dépendances inutilisées : `clsx`, `@radix-ui/react-avatar` | 🟢 BAS | ⬜ |
| H19 | Ajouter `aria-label` sur les inputs de recherche et icônes interactives | 🟢 BAS | ⬜ |
| H20 | Navigation clavier dans les modales (Escape, Tab order logique) | 🟢 BAS | ⬜ |

---

## BLOC I — Fonctionnalités futures

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| I1 | Export CSV/PDF : membres, contributions, dépenses | 🟡 MOYEN | ⬜ |
| I2 | Notifications email/SMS lors d'une rotation planifiée | 🟡 MOYEN | ⬜ |
| I3 | Logs d'audit (qui a modifié quoi et quand) | 🟡 MOYEN | ⬜ |
| I4 | Import en masse de membres via CSV | 🟡 MOYEN | ⬜ |
| I5 | Rotations récurrentes automatiques (planning multi-semaines) | 🟢 BAS | ⬜ |
| I6 | Filtres avancés sur les listes (quartier, statut, période) | 🟢 BAS | ⬜ |
| I7 | Graphiques dashboard (évolution cotisations, taux de présence) | 🟢 BAS | ⬜ |

---

## CHECKLIST AVANT MISE EN PRODUCTION

- [ ] `NEXTAUTH_SECRET` changé et injecté via CI/CD
- [ ] `LIGHTHOUSE_SECURITY_DISABLE_INTROSPECTION=true` en production
- [ ] `SUPER_ADMIN_EMAIL/PASSWORD` définis dans `.env` de production
- [ ] HTTPS activé sur le serveur
- [ ] CORS backend restreint au domaine frontend uniquement
- [ ] Backups base de données configurés et testés
- [ ] Monitoring d'erreurs configuré (Sentry recommandé)
- [ ] Protection DDoS active (Cloudflare)
- [ ] Tests E2E passent sur staging
- [ ] Variables d'environnement vérifiées (aucun `.env.local` commité)
