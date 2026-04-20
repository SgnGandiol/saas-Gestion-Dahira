# Plan d'implémentation — SaaS Gestion des Dahira (SGD)

> **Date de démarrage :** Avril 2026  
> **Stack :** Laravel 12 · GraphQL · Next.js 16 · PostgreSQL · Docker  
> **Architecture :** Multi-tenant SaaS

---

## Vue d'ensemble

```
SGD/
├── backend/          ← Laravel 12 + GraphQL (Lighthouse)
├── frontend/         ← Next.js 16 App Router
├── docker/           ← Configs Nginx, SSL, scripts
├── docker-compose.yml
└── .env.example
```

---

## PHASE 1 — Backend Laravel + GraphQL

**Objectif :** API fonctionnelle avec authentification, modèles métier et premiers endpoints GraphQL.

### Étape 1.1 — Initialisation du projet Laravel

- [ ] Créer le projet Laravel 12 via Composer
- [ ] Configurer `.env` pour PostgreSQL
- [ ] Installer les dépendances essentielles :
  - `lighthouse-php/lighthouse` (GraphQL)
  - `laravel/sanctum` (Auth JWT-compatible)
  - `spatie/laravel-permission` (Rôles & permissions)
  - `stancl/tenancy` (Multi-tenant)

### Étape 1.2 — Dockerisation Backend

- [ ] `Dockerfile` pour Laravel (PHP 8.3-FPM)
- [ ] Service `app` (Laravel)
- [ ] Service `db` (PostgreSQL 16)
- [ ] Service `redis` (cache & queues)
- [ ] `docker-compose.yml` de développement
- [ ] Volume persistant pour PostgreSQL

### Étape 1.3 — Structure des dossiers

```
backend/
├── app/
│   ├── Models/
│   │   ├── Dahira.php
│   │   ├── User.php
│   │   ├── Member.php
│   │   ├── Family.php
│   │   ├── House.php
│   │   ├── Rotation.php
│   │   ├── Contribution.php
│   │   ├── Expense.php
│   │   └── Assignment.php
│   ├── GraphQL/
│   │   ├── Queries/
│   │   ├── Mutations/
│   │   └── Subscriptions/
│   ├── Services/
│   │   ├── RotationService.php
│   │   ├── ContributionService.php
│   │   └── TenantService.php
│   └── Policies/
├── database/
│   ├── migrations/
│   └── seeders/
└── graphql/
    └── schema.graphql
```

### Étape 1.4 — Modèles & Relations Eloquent

| Modèle        | Relations principales                              |
|---------------|----------------------------------------------------|
| `Dahira`      | hasMany Members, Houses, Expenses, Contributions   |
| `User`        | belongsTo Dahira, hasOne Member, roles/permissions |
| `Member`      | belongsTo Family, belongsTo Dahira                 |
| `Family`      | hasMany Members, hasOne House                      |
| `House`       | hasMany Rotations, belongsTo Family                |
| `Rotation`    | belongsTo House, belongsTo Dahira                  |
| `Contribution`| belongsTo Member, belongsTo Dahira                 |
| `Expense`     | belongsTo Dahira, belongsTo User                   |
| `Assignment`  | belongsTo Member, belongsTo Rotation               |

### Étape 1.5 — Migrations PostgreSQL

- [ ] `dahiras` — tenant principal
- [ ] `users` — comptes d'accès
- [ ] `members` — profils membres (nom, tel, sexe, statut)
- [ ] `families` — entité foyer
- [ ] `houses` — maisons/concessions
- [ ] `rotations` — historique tours hebdomadaires
- [ ] `contributions` — cotisations & adiya
- [ ] `expenses` — dépenses
- [ ] `assignments` — tâches du dimanche
- [ ] `roles` / `permissions` (spatie)

### Étape 1.6 — Authentification API

- [ ] Sanctum configuré pour API tokens
- [ ] Mutation `login` → retourne token
- [ ] Mutation `register` (premier admin du Dahira)
- [ ] Middleware `auth:sanctum` sur les routes GraphQL
- [ ] Gestion des rôles : `super_admin`, `admin`, `tresorier`, `secretaire`, `membre`

### Étape 1.7 — Schéma GraphQL (Lighthouse)

```graphql
# Queries principales
type Query {
  me: User
  dahira(id: ID!): Dahira
  members(dahira_id: ID!): [Member]
  houses(dahira_id: ID!): [House]
  rotations(dahira_id: ID!): [Rotation]
  contributions(dahira_id: ID!): [Contribution]
  expenses(dahira_id: ID!): [Expense]
}

# Mutations principales
type Mutation {
  login(email: String!, password: String!): AuthPayload
  createMember(input: MemberInput!): Member
  createHouse(input: HouseInput!): House
  scheduleRotation(dahira_id: ID!): Rotation
  recordContribution(input: ContributionInput!): Contribution
  createExpense(input: ExpenseInput!): Expense
  assignTask(input: AssignmentInput!): Assignment
}
```

### Étape 1.8 — Algorithme de Rotation Intelligent

Critères de sélection automatique de la prochaine maison :

1. Date du dernier passage (priorité aux maisons non visitées depuis longtemps)
2. Nombre total de passages (équité)
3. Capacité d'accueil déclarée
4. Disponibilité (flag booléen)
5. Espacement minimum configurable (ex. : 8 semaines)
6. Ancienneté du membre chef de famille

**Livrable Phase 1 :** API GraphQL opérationnelle, testable via GraphQL Playground.

---

## PHASE 2 — Frontend Next.js

**Objectif :** Interface web moderne, responsive, connectée à l'API GraphQL.

### Étape 2.1 — Initialisation Next.js 16

- [ ] Projet Next.js App Router (TypeScript)
- [ ] `Dockerfile` frontend
- [ ] Ajout au `docker-compose.yml`
- [ ] Variables d'environnement (`NEXT_PUBLIC_GRAPHQL_URL`)

### Étape 2.2 — Stack Frontend

- [ ] **Apollo Client** — connexion GraphQL
- [ ] **Tailwind CSS** — styling
- [ ] **shadcn/ui** — composants UI
- [ ] **React Hook Form + Zod** — formulaires & validation
- [ ] **Zustand** — state management léger
- [ ] **next-auth** — gestion session côté client

### Étape 2.3 — Structure des dossiers

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← tableau de bord
│   │   ├── members/
│   │   ├── families/
│   │   ├── rotations/
│   │   ├── finance/
│   │   └── settings/
│   └── layout.tsx
├── components/
│   ├── ui/                       ← shadcn components
│   ├── members/
│   ├── rotations/
│   └── finance/
├── lib/
│   ├── apollo.ts
│   ├── auth.ts
│   └── utils.ts
└── graphql/
    ├── queries/
    └── mutations/
```

### Étape 2.4 — Pages & Fonctionnalités

| Page             | Fonctionnalités                                      |
|------------------|------------------------------------------------------|
| `/login`         | Auth, redirection selon rôle                        |
| `/dashboard`     | KPIs : membres actifs, caisse, prochain tour        |
| `/members`       | Liste, ajout, édition, désactivation                |
| `/families`      | Gestion foyers, rattachement membres                |
| `/rotations`     | Calendrier tours, historique, prochaine maison      |
| `/finance`       | Cotisations, dépenses, solde caisse, rapports       |
| `/assignments`   | Tâches du dimanche, rotation automatique            |
| `/settings`      | Profil Dahira, membres équipe dirigeante            |

**Livrable Phase 2 :** Application web complète, fonctionnelle end-to-end.

---

## PHASE 3 — Multi-Tenant SaaS

**Objectif :** Isolation complète des données par Dahira, gestion des abonnements.

### Étape 3.1 — Stratégie Multi-Tenant

Approche retenue : **`tenant_id` column-based** (simple, scalable, PostgreSQL Row-Level Security optionnel)

- [ ] Colonne `dahira_id` sur toutes les tables métier
- [ ] Middleware `ResolveTenant` — détecte le tenant via :
  - Sous-domaine : `touba-dakar.sgd.sn`
  - Header : `X-Tenant-ID`
  - Token JWT (claim `dahira_id`)
- [ ] Scope global Eloquent `TenantScope` — filtre automatique

### Étape 3.2 — Isolation & Sécurité

- [ ] PostgreSQL Row-Level Security (RLS) activé
- [ ] Politique RLS par `dahira_id`
- [ ] Tests d'isolation : un tenant ne peut pas lire les données d'un autre
- [ ] Super-admin plateforme (accès cross-tenant pour support)

### Étape 3.3 — Rôles & Permissions

| Rôle            | Droits                                              |
|-----------------|-----------------------------------------------------|
| `super_admin`   | Accès total plateforme                              |
| `admin`         | Gestion complète du Dahira                          |
| `tresorier`     | Finance uniquement (cotisations, dépenses)          |
| `secretaire`    | Membres, familles, rotations                        |
| `organisateur`  | Assignations, rotations                             |
| `membre`        | Lecture seule de son profil                         |

### Étape 3.4 — Onboarding Dahira

- [ ] Page d'inscription publique → création Dahira + admin
- [ ] Invitation membres par lien ou SMS
- [ ] Plan freemium (jusqu'à 50 membres gratuit)

**Livrable Phase 3 :** Plusieurs Dahira indépendants sur la même plateforme.

---

## PHASE 4 — Production DevOps

**Objectif :** Déploiement sécurisé, automatisé et monitoré sur VPS.

### Étape 4.1 — Docker Production

- [ ] `docker-compose.prod.yml` séparé du dev
- [ ] Variables d'environnement via secrets (pas de `.env` en prod)
- [ ] Images optimisées (multi-stage build)
- [ ] Laravel Octane (Swoole) pour performances

### Étape 4.2 — Nginx Reverse Proxy

- [ ] Nginx container dédié
- [ ] Virtual hosts par sous-domaine tenant
- [ ] Headers sécurité (HSTS, CSP, X-Frame-Options)
- [ ] Rate limiting API

### Étape 4.3 — SSL & Domaines

- [ ] Certificats Let's Encrypt via Certbot
- [ ] Wildcard SSL pour `*.sgd.sn`
- [ ] Renouvellement automatique

### Étape 4.4 — Backup PostgreSQL

- [ ] Script backup quotidien automatique
- [ ] Stockage S3 / Backblaze B2
- [ ] Rétention 30 jours
- [ ] Test de restauration mensuel

### Étape 4.5 — CI/CD GitHub Actions

```yaml
Workflow :
  push main → tests PHPUnit → build Docker → push registry → deploy VPS
```

- [ ] Tests automatisés (PHPUnit + Pest)
- [ ] Linting (PHP CS Fixer, ESLint)
- [ ] Build & push image Docker Hub / GHCR
- [ ] Déploiement zero-downtime (rolling update)

### Étape 4.6 — Monitoring

- [ ] Logs centralisés (Laravel Telescope en dev, Sentry en prod)
- [ ] Alertes email/SMS sur erreurs critiques
- [ ] Uptime monitoring (Better Uptime ou UptimeRobot)

**Livrable Phase 4 :** Plateforme en production, sécurisée et automatisée.

---

## Récapitulatif des livrables

| Phase | Description                    | Statut     |
|-------|--------------------------------|------------|
| 1     | Backend Laravel + GraphQL      | A démarrer |
| 2     | Frontend Next.js               | En attente |
| 3     | Multi-tenant SaaS              | En attente |
| 4     | Production DevOps              | En attente |

---

## Modèle de données — Schéma simplifié

```
Dahira
  └── Users (admin, trésorier, secrétaire...)
  └── Members
        └── Family
              └── House
                    └── Rotations
  └── Contributions (cotisations, adiya)
  └── Expenses (dépenses)
  └── Assignments (tâches dimanche)
```

---

## Règles de développement

- Toujours expliquer le **pourquoi** avant le **comment**
- Code propre, commenté, testé
- Commandes terminal exactes et reproductibles
- Best practices 2026 (Laravel 12+, Next.js 16+, PostgreSQL 16+)
- Avancer **phase par phase**, validation obligatoire avant de passer à la suivante
- Pas de sur-engineering — MVP d'abord, évolutions ensuite

---

*Généré le 16 avril 2026 — SGD v1.0*
