# SGD — Priorisation des tâches

> Mis à jour : 8 mai 2026 — Blocs A→G + J + K complétés. Bloc L complété (Moteur de Rotation Intelligent)  
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

## BLOC J — Finance v2 : Module complet multi-onglets

> Refonte totale de la page Finance pour couvrir les cotisations de tours, le Ziar Annuel, les événements (Thiant, Petit Ziar…) et le Social.  
> Référence : `exemple rotation.md`

### J — Backend Laravel / GraphQL

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| J1 | Ajouter `category` (grand / petit) + `weekly_amount` sur `members` — migration + fillable + GraphQL type | 🔴 CRITIQUE | ⬜ |
| J2 | Créer migration `finance_events` (id, dahira_id, name, type, target_amount, collected_amount, deadline, status) | 🔴 CRITIQUE | ⬜ |
| J3 | Refactorer migration `contributions` → `finance_transactions` : ajouter `event_id nullable`, `rotation_id nullable`, `type` enum (tour / ziar / thiant / social / autre) | 🔴 CRITIQUE | ⬜ |
| J4 | Créer modèles `FinanceEvent` + `FinanceTransaction` avec relations Dahira / Member / Rotation | 🔴 CRITIQUE | ⬜ |
| J5 | GraphQL mutations : `createFinanceEvent`, `updateFinanceEvent`, `deleteFinanceEvent`, `recordTourPayments` (bulk — valider plusieurs membres d'un tour en une requête) | 🔴 CRITIQUE | ⬜ |
| J6 | GraphQL queries : `financeEvents`, `tourPaymentStatus(rotation_id)`, `ziarAnnuelStats`, `socialStats` | 🔴 CRITIQUE | ⬜ |
| J7 | Logique métier : quand un paiement de tour est validé → créer automatiquement une transaction `type=ziar` qui crédite le Ziar Annuel | 🟠 HAUTE | ⬜ |
| J8 | Logique métier : calculer `collected_amount` sur `finance_events` en temps réel (trigger ou accessor Eloquent) | 🟠 HAUTE | ⬜ |
| J9 | GraphQL query `financeStats` : top cotisant, maison la plus régulière, taux global paiement, montant annuel prévisionnel, retards actuels | 🟡 MOYEN | ⬜ |

### J — Frontend Next.js
| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| J10 | Mettre à jour `types/index.ts` : `MemberCategory` → fait dans BLOC K | 🔴 CRITIQUE | ✅ |
| J11 | Créer `graphql/queries/finance-v2.ts` (voir BLOC K + rotations query enrichie) | 🔴 CRITIQUE | 🔄 |
| J12 | Créer `graphql/mutations/finance-v2.ts` : `RECORD_TOUR_PAYMENTS` bulk → backend à faire (J5) | 🔴 CRITIQUE | ⬜ |
| J13 | Refactorer `/dashboard/finance/page.tsx` → layout 5 onglets : **Tours · Ziar Annuel · Événements · Social · Statistiques** | 🔴 CRITIQUE | ✅ |
| J14 | **Onglet Tours** : liste des rotations cliquables → drawer avec tableau membres (catégorie, montant attendu, payé ✅/❌, saisie rapide, « Tout valider ») | 🔴 CRITIQUE | ✅ |
| J15 | **Onglet Ziar Annuel** : KPIs (total caisse, tours effectués, membres cotisants, en attente) + liste des cotisations | 🟠 HAUTE | ✅ |
| J16 | **Onglet Événements** : exemples statiques + message "bientôt" — backend `finance_events` requis pour version complète | 🟠 HAUTE | 🔄 |
| J17 | **Onglet Social** : filtre adiya/don + KPIs + table | 🟠 HAUTE | ✅ |
| J18 | **Onglet Statistiques** : top cotisants, taux paiement, prévisionnel IA, chart barres | 🟡 MOYEN | ✅ |
| J19 | UX saisie rapide mobile : inline edit, auto-save, navigation Tab entre cellules, snackbar succès | 🟡 MOYEN | ⬜ |
| J20 | Filtres transversaux : Mois / Maison / Membre / Type événement / Payé–Non payé + recherche instantanée | 🟡 MOYEN | ⬜ |

---

## BLOC K — Module Catégories de Membres

> Permet d'associer une cotisation hebdomadaire attendue par membre (Grand=200, Moyen=100, Petit=50 FCFA)

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| K1 | Migration `create_member_categories_table` (dahira_id, name, label, weekly_amount, color, is_default, sort_order) | 🔴 CRITIQUE | ✅ |
| K2 | Migration `add_member_category_id_to_members` (FK nullable → nullOnDelete) | 🔴 CRITIQUE | ✅ |
| K3 | Modèle `MemberCategory.php` avec TenantScope + fillable + casts | 🔴 CRITIQUE | ✅ |
| K4 | `Member.php` → ajouter `member_category_id` au fillable + relation `category()` | 🔴 CRITIQUE | ✅ |
| K5 | `DahiraMutation.php` → seed 3 catégories par défaut (Grand/Moyen/Petit) à la création d'une Dahira | 🟠 HAUTE | ✅ |
| K6 | `schema.graphql` → type `MemberCategory`, query `memberCategories`, mutations CRUD, inputs, `category` sur `Member`, `member_category_id` sur inputs | 🔴 CRITIQUE | ✅ |
| K7 | Frontend `types/index.ts` → interface `MemberCategory`, champ `category?` sur `Member` | 🔴 CRITIQUE | ✅ |
| K8 | Frontend `graphql/queries/categories.ts` + `mutations/categories.ts` | 🔴 CRITIQUE | ✅ |
| K9 | Frontend `/dashboard/categories/page.tsx` — CRUD catégories avec color picker | 🟠 HAUTE | ✅ |
| K10 | Sidebar → lien "Catégories" | 🟠 HAUTE | ✅ |
| K11 | `MemberForm.tsx` / `MemberModal.tsx` → sélecteur catégorie + `member_category_id` dans mutations | 🟠 HAUTE | ✅ |
| K12 | Liste membres → badge coloré catégorie (mobile + desktop colonne) | 🟡 MOYEN | ✅ |
| K13 | `GET_MEMBERS` query → inclure `category { id name label color weekly_amount }` | 🟡 MOYEN | ✅ |

---

## BLOC J — Finance v2 : Module complet multi-onglets

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

## BLOC L — Moteur de Rotation Intelligent

> Implémentation du moteur complet : score composite, replanning, rebuild, logs  
> Référence : `# 🎯 Solution globale à implémenter pour.md` + `prompt_amelioration_algo.md`

### L — Backend Laravel

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| L1 | Migration : `availability_status`, `absence_frequency`, `priority_score` sur `members` · `is_headquarters` sur `houses` · table `rotation_logs` · tables `rotation_rebuilds` + `rotation_rebuild_items` | 🔴 CRITIQUE | ✅ |
| L2 | `RotationService.php` — score composite membre (35% jours sans tour · 25% dispo · 20% absences · 15% récence · 5% suspension) remplace le tri simple | 🔴 CRITIQUE | ✅ |
| L3 | `RotationReplannerService.php` — `detectProblem` · `classifyGravity` · `generateSolutions` (swap/siège/report/smart_swap) · `scoreSolution` · `suggestBestSolution` | 🔴 CRITIQUE | ✅ |
| L4 | `RotationPlannerService.php` — `previewRebuild` · `applyRebuild` · `cancelRebuild` · zones verrouillée (<2 sem) / flexible | 🔴 CRITIQUE | ✅ |
| L5 | `RotationLogService.php` — `logChange` · `getHistory` · traçabilité complète | 🟠 HAUTE | ✅ |
| L6 | Statuts enrichis : Rotation (+`ongoing` `rescheduled` `headquarters`) · Member (`availability_status`: available/unavailable/travel/sick/suspended) | 🟠 HAUTE | ✅ |
| L7 | `schema.graphql` — nouveaux types/enums/mutations : `suggestSolution` · `previewRebuild` · `applyRebuild` · `cancelRebuild` · `setMemberAvailability` | 🟠 HAUTE | ✅ |

### L — Frontend Next.js

| # | Tâche | Priorité | Status |
|---|-------|----------|--------|
| L8 | Page Membres — badge + selector `availability_status` (disponible / absent / voyage / malade / suspendu) | 🟠 HAUTE | ⬜ |
| L9 | Page Rotations — bouton "Siège / Solution" sur chaque tour : modal avec solutions scorées et confirmation | 🟠 HAUTE | ⬜ |
| L10 | Page Rotations — bouton "🔄 Recréer le planning" : modal prévisualisation diff avant/après + modes + apply | 🟠 HAUTE | ⬜ |
| L11 | Page Rotations — historique des modifications par tour (onglet ou drawer) | 🟡 MOYEN | ⬜ |

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
