## Exposé du sujet : Digitalisation de la gestion des Dahira au Sénégal via un SaaS multi-organisations

### 1. Contexte général

Au Sénégal, les **dahira** occupent une place centrale dans la vie religieuse et communautaire, particulièrement au sein de la confrérie Mouridiyya. Un dahira est souvent une association locale regroupant des disciples autour d’activités spirituelles, sociales, éducatives et solidaires.

Dans de nombreux quartiers, villages et villes, les dahira organisent régulièrement :

* des **rencontres religieuses hebdomadaires** (souvent le dimanche),
* des **tours de maisons** pour accueillir les assemblées,
* des **cotisations financières**,
* des **contributions solidaires**,
* la **répartition des tâches** (accueil, restauration, nettoyage, communication),
* le suivi des membres et des familles.

Aujourd’hui, une grande partie de cette gestion se fait encore sur **Excel**, cahiers papier ou via WhatsApp, ce qui crée plusieurs limites.

---

## 2. Problématique constatée

L’utilisation d’Excel devient rapidement inefficace lorsqu’un dahira grandit.

### Difficultés fréquentes :

#### Gestion des membres

* doublons,
* changements de numéro,
* nouveaux membres mal intégrés,
* difficulté à suivre les familles.

#### Gestion des tours de maison

* certaines maisons reçoivent trop souvent,
* d’autres sont oubliées,
* conflits sur l’ordre de passage,
* manque d’équité.

#### Gestion familiale

Exemple :

* un père,
* une mère,
* trois enfants adultes membres du dahira.

Si chacun est traité séparément, la famille peut recevoir plusieurs charges rapprochées.

#### Gestion financière

* cotisations non suivies,
* manque de visibilité sur la caisse,
* difficultés de reporting.

#### Communication

* annonces dispersées sur plusieurs groupes.

---

# 3. Vision du projet : SaaS de gestion des Dahira

Créer une plateforme SaaS (Software as a Service) permettant à plusieurs dahira d’utiliser le même système, chacun avec son espace sécurisé.

### Exemple :

* Dahira Touba Dakar
* Dahira Darou Marnane Pikine
* Dahira Étudiants Thiès
* Dahira Femmes Guédiawaye

Chaque structure gère ses données séparément.

---

# 4. Ma compréhension spécifique de la gestion des Dahira au Sénégal

La gestion d’un dahira n’est pas seulement administrative. Elle repose sur :

## A. Dimension spirituelle

Le tour de maison est souvent un acte d’honneur et de bénédiction. Le système doit respecter cette sensibilité.

## B. Dimension sociale

Le dahira relie :

* familles,
* voisins,
* amis,
* disciples.

Il faut donc penser en **foyers**, pas seulement en individus.

## C. Dimension équitable

La rotation doit être juste :

* espacer les tours entre maisons,
* éviter qu’une même concession soit trop sollicitée,
* répartir équitablement les responsabilités.

## D. Dimension hiérarchique

Souvent on retrouve :

* Président
* Secrétaire général
* Trésorier
* Responsable organisation
* Cellule jeunes
* Cellule femmes
* Commission sociale

Le SaaS doit intégrer rôles et permissions.

---

# 5. Fonctionnalités intelligentes à prévoir

## Gestion RH (membres)

### Profils membres :

* nom,
* téléphone,
* adresse,
* sexe,
* profession,
* statut actif/inactif,
* appartenance familiale.

### Foyer / Maison :

Créer une entité :

**Maison / Concession / Famille**

Liée à plusieurs membres.

---

## Gestion des tours hebdomadaires

### Algorithme intelligent :

Le système doit choisir automatiquement la prochaine maison selon :

* dernière date de passage,
* nombre de fois reçues,
* capacité d’accueil,
* disponibilité,
* priorité anciens membres,
* espacement minimum entre deux passages.

### Exemple :

Maison A a reçu il y a 2 semaines ❌
Maison B il y a 4 mois ✅

---

## Assignations / Tâches

Chaque dimanche :

* lecture Khassaïdes,
* accueil,
* thé/café,
* sonorisation,
* nettoyage,
* caisse,
* communication.

Le système répartit automatiquement selon rotation.

---

## Finance

### Modules :

* cotisations mensuelles,
* adiya,
* dépenses,
* caisse disponible,
* dettes/créances,
* rapports mensuels.

---

## Communication

* SMS rappel du tour,
* notifications,
* liste présence,
* annonces.

---

# 6. Architecture SaaS recommandée

### Multi-tenant

Un seul système pour plusieurs dahira.

### Chaque dahira possède :

* membres,
* finances,
* calendrier,
* rapports.

### Stack idéale pour vous :

* Angular
* Laravel ou NestJS
* PostgreSQL
* Keycloak
* PWA mobile

---

# 7. Opportunité économique

Au Sénégal il existe :

* milliers de dahira mourides,
* tidianes,
* layènes,
* associations islamiques.

Très peu disposent d’outils modernes adaptés localement.

Vous pouvez devenir **premier acteur spécialisé ERP religieux communautaire**.

---

# 8. Nom possible du projet

* DahiraSoft
* Xidmat SaaS
* BayeFall Manager
* ToubaConnect
* Ndiguel RH
* Khidma Pro

---

# 9. Mon avis stratégique

Ce projet a **fort potentiel réel**, car il part d’un problème vécu, pas d’une idée théorique.

Quand un produit résout un problème que vous vivez personnellement, vous connaissez :

* les frustrations,
* les vrais besoins,
* les usages locaux,
* les mots métier.

C’est un avantage énorme.

---

# 10. Recommandation forte

Commencez par un **MVP simple** :

### Version 1 :

* membres
* familles
* rotation tour
* cotisations
* tableau de bord

Puis évoluez.

---

# 11. Conclusion

Vous ne créez pas juste un logiciel.
Vous modernisez une organisation religieuse historique tout en respectant sa culture.

C’est un projet à impact :

* religieux
* social
* organisationnel
* économique
* technologique

---


Je veux construire une plateforme SaaS moderne de gestion des Dahira au Sénégal.

Technologies obligatoires :

- Backend : Laravel API
- API Query Language : GraphQL
- Frontend : Next.js
- Base de données : PostgreSQL
- Conteneurisation : Docker + Docker Compose
- Authentification : JWT ou Sanctum (prévoir évolutif Keycloak plus tard)
- Architecture propre, scalable et professionnelle

Le projet consiste à gérer plusieurs Dahira (multi-tenant SaaS), chaque Dahira possède :

- ses membres
- familles / maisons
- tours hebdomadaires
- cotisations
- dépenses
- assignations des tâches
- rôles administratifs

Je veux que tu m’accompagnes étape par étape comme un CTO senior.

IMPORTANT :
Tu dois avancer par PHASES claires.
Tu attends ma validation avant passer à la suivante.

Ordre obligatoire :

# PHASE 1 — Backend Laravel + GraphQL

Commence par :

1. Création du projet Laravel
2. Installation PostgreSQL
3. Dockerisation Laravel + PostgreSQL
4. Configuration .env
5. Installation GraphQL Laravel
6. Structure propre des dossiers
7. Création modèles principaux :

- Dahira
- User
- Member
- Family
- House
- Rotation
- Contribution
- Expense
- Assignment

8. Relations Eloquent
9. Migration PostgreSQL propres
10. Authentification API
11. Première Query GraphQL
12. Première Mutation GraphQL

Puis pause.

# PHASE 2 — Frontend Next.js

Après validation :

1. Création projet Next.js App Router
2. Dockerisation frontend
3. Connexion GraphQL Apollo Client
4. Structure scalable folders
5. Auth pages
6. Dashboard admin
7. CRUD membres
8. Gestion familles
9. Gestion tours

Puis pause.

# PHASE 3 — SaaS Multi Tenant

1. Chaque Dahira isolé
2. Sous-domaines ou tenant_id
3. Permissions
4. Roles admin / trésorier / secrétaire

Puis pause.

# PHASE 4 — Production DevOps

1. Docker production
2. Nginx reverse proxy
3. SSL
4. VPS deployment
5. Backup PostgreSQL
6. CI/CD GitHub Actions

Règles :

- Toujours expliquer pourquoi on fait chaque étape
- Donner code propre
- Donner commandes terminal exactes
- Respecter best practices 2026
- Laravel 12+
- Next.js 16+
- PostgreSQL latest
- Docker moderne

Commence maintenant par PHASE 1 uniquement.