Crée un **module Finance complet, moderne et scalable** pour une application de gestion de Dahira / Rotations religieuses, avec **Angular 19 + Angular Material + TailwindCSS + Laravel GraphQL + PostgreSQL**, orienté **UX fluide, saisie rapide, statistiques intelligentes et gestion multi-événements**.

---

# 🎯 OBJECTIF GLOBAL

Le module Finance doit permettre de gérer :

## 1️⃣ Cotisations obligatoires des Tours Hebdomadaires

À chaque tour :

* Chaque **grand membre** doit cotiser **200 FCFA**
* Chaque **petit membre** doit cotiser **50 ou 100 FCFA** selon sa catégorie
* Cette somme est automatiquement affectée au :

### ➜ Fonds Ziar Annuel

Donc chaque tour alimente automatiquement la caisse annuelle.

---

## 2️⃣ Autres événements financiers

Créer aussi la gestion des cotisations pour :

### ✔ Thiant

Exemple :

* Budget fixé : **40 000 FCFA**
* Chaque membre cotise selon son rythme
* Date limite / clôture définie
* Suivi du reste à payer
* Pourcentage atteint

### ✔ Petit Ziar

### ✔ Social

(le social reste séparé du Ziar Annuel)

### ✔ Autres événements personnalisés

---

# 🧱 STRUCTURE UI / UX PRINCIPALE

Créer une page :

# 📌 Finance Dashboard

Avec onglets :

```text
[ Tours ] [ Ziar Annuel ] [ Événements ] [ Social ] [ Statistiques ]
```

---

# 1️⃣ ONGLET TOURS (Ultra important)

Afficher liste des tours :

```text
26 Avril 2026 - Maison Guene
03 Mai 2026 - Maison Abdou Diop
10 Mai 2026 - Maison Faye
```

Quand on clique :

### Drawer latéral / modal moderne :

```text
Tour du 26 Avril
Maison Guene
```

Puis tableau intelligent :

| Membre     | Catégorie | Montant attendu | Payé ? | Saisie rapide |
| ---------- | --------- | --------------- | ------ | ------------- |
| Papa Guene | Grand     | 200             | ✅      | input         |
| Baye Guene | Grand     | 200             | ❌      | input         |

### UX idéale :

* bouton :

```text
[Tout valider à 200]
```

* auto-remplissage
* clavier rapide
* navigation tab
* validation instantanée
* badge :

```text
2/5 payé
400 FCFA collecté
```

---

# 2️⃣ ONGLET ZIAR ANNUEL

Dashboard premium :

```text
Total caisse : 185 500 FCFA
Tours effectués : 26
Membres cotisants : 18
Retards : 3
```

Graphiques :

### 📈 Évolution mensuelle

### 📊 Contribution par membre

### 🥧 Répartition maisons

---

# 3️⃣ ONGLET ÉVÉNEMENTS

Liste :

```text
Thiant Gamou
Petit Ziar Médina
Construction
```

Bouton :

```text
+ Nouvel événement
```

Formulaire :

```text
Nom
Type
Budget cible
Date début
Date clôture
Description
```

---

### Exemple Thiant 40 000 FCFA

Vue :

```text
Collecté : 28 500
Reste : 11 500
71% atteint
Date clôture : 20 Juin
```

Puis tableau cotisation :

| Membre | Donné | Reste |
| ------ | ----- | ----- |

Boutons :

```text
+ Ajouter versement
Relancer retardataires
Clôturer événement
Exporter PDF
```

---

# 4️⃣ ONGLET SOCIAL

Séparé comptablement :

```text
Entrées
Dépenses
Aides accordées
Solde social
```

Exemple :

```text
Aide maladie : -10 000
Contribution sociale : +20 000
```

---

# 5️⃣ ONGLET STATISTIQUES

KPIs :

```text
Top cotisant
Maison la plus régulière
Taux global de paiement
Montant annuel prévisionnel
Retards actuels
```

Graphiques modernes.

---

# 🧠 UX HAUT NIVEAU À IMPLÉMENTER

## Saisie ultra rapide mobile + desktop

* inline edit
* checkbox payé
* input intelligent
* auto-save
* snackbar succès

## Filtres :

```text
Mois
Maison
Membre
Type événement
Payé / Non payé
```

## Recherche instantanée

## Dark mode élégant

## Responsive total

---

# 💾 BASE DE DONNÉES CONSEILLÉE

## tables :

### members

### tours

### finance_transactions

```text
id
member_id
rotation_id nullable
event_id nullable
type (tour, ziar, thiant, social)
amount
date
status
method
notes
```

### finance_events

```text
id
name
type
target_amount
current_amount
deadline
status
```

---

# ⚙️ BACKEND LOGIQUE

Quand paiement tour validé :

```php
create transaction(type='tour')
credit ziar_annuel_wallet
```

Quand versement Thiant :

```php
create transaction(type='thiant')
update progress
```

---

# 🎨 DESIGN SYSTEM

Couleurs :

```text
Vert = payé
Rouge = retard
Bleu = caisse
Or = Ziar Annuel
Violet = Social
```

Cards premium :

* rounded-2xl
* shadow-xl
* glassmorphism léger

---

# 🚀 BONUS INTELLIGENT

Ajouter IA prédictive :

```text
Si rythme actuel continue :
Ziar annuel atteindra 420 000 FCFA
```

---

# 📌 RÉSULTAT ATTENDU

Un module finance digne :

