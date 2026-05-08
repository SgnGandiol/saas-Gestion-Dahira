# Gestion des imprévus — Proposition d'architecture

> Rédigé le 8 mai 2026  
> Contexte : quand on reporte, annule ou crée manuellement un tour, le reste du planning doit se réorganiser de façon cohérente. Aujourd'hui seule la date cible change ; les autres tours ne bougent pas.

---

## Le problème en une phrase

Le planning est une **file ordonnée de membres/maisons**. Quand une date change, les tours suivants doivent glisser automatiquement pour préserver l'ordre et l'équité — comme pousser ou retirer un élément dans une liste chaînée.

**Exemple concret :**
| Avant | Après report de 1 semaine |
|---|---|
| Baye Guene — 3 mai | Baye Guene — **10 mai** |
| Astou — 10 mai | Astou — **17 mai** |
| Moussa — 17 mai | Moussa — **24 mai** |
| Fatou — 24 mai | Fatou — **31 mai** |

---

## Champ "Motif" — présent dans toutes les opérations

Chaque action (reporter, annuler, créer) enregistre un motif. Ce motif est stocké dans `rotation_logs.meta` et affiché dans l'historique.

**Liste de motifs prédéfinis (avec champ libre "Autre") :**

| Catégorie | Motifs |
|---|---|
| Personne | Absence · Maladie · Voyage · Décès · Mariage / Baptême |
| Calendrier religieux | Ramadan · Magal · Gamou · Autre événement religieux |
| Logistique | Inondation · Problème de lieu · Manque de disponibilité |
| Planning | Erreur de planification · Rééquilibrage · Insertion spéciale |
| Autre | Champ texte libre |

Le motif sélectionné alimente aussi le `reason` envoyé à `RotationReplannerService` pour que l'algorithme de solutions intelligentes soit plus pertinent.

---

## L'option Siège — alternative à tout report ou annulation

**Principe :** au lieu de déplacer ou supprimer un tour, on le tient **au siège de la dahira**. La date reste la même, les autres tours ne bougent pas, mais l'accueil est assuré par la structure. C'est le mode `HEADQUARTERS`.

**Quand l'utiliser :**
- L'hôte prévu est absent mais on ne veut pas briser la cadence
- Semaine de grande fête (Magal, Gamou) : le siège accueille tout le monde
- La maison prévue a un problème logistique de dernière minute

**Effet sur le planning :**
- Le tour passe au statut `headquarters`
- La maison du tour devient la maison siège (`is_headquarters = true`)
- Les autres tours **ne bougent pas** (aucune cascade)
- L'hôte initialement prévu reprend sa place la semaine suivante (son tour est simplement décalé d'une position dans la file)

**Ce mode est disponible dans les trois opérations :**

| Opération | Comportement HEADQUARTERS |
|---|---|
| Repousser | On ne reporte pas : ce dimanche se tient au siège, les dates restent inchangées |
| Annuler | On n'annule pas : ce dimanche se tient au siège |
| Créer manuellement | On crée un tour siège à cette date sans toucher les autres |

---

## Les trois opérations concernées

### 1. Repousser (postpone)

**Modes disponibles :**

| Mode | Description | Effet sur le planning |
|---|---|---|
| `HEADQUARTERS` | Le tour se tient au siège cette date | Aucun décalage, membres inchangés |
| `CHAIN` | Tous les tours suivants glissent de +N semaines | Cascade complète |
| `SWAP` | Ce tour et le suivant échangent leurs dates | Seulement 2 tours impactés |
| `GAP` | Seul ce tour est reporté, les autres gardent leurs dates | Vide assumé dans le planning |

**Champs du formulaire :**
- Motif (liste + champ libre) — **obligatoire**
- Nouvelle date (pour CHAIN / SWAP / GAP)
- Nombre de semaines de report (pour CHAIN, défaut : 1)
- Mode de gestion du planning (radio)
- Prévisualisation avant confirmation

---

### 2. Annuler (cancel)

**Modes disponibles :**

| Mode | Description | Effet sur le planning |
|---|---|---|
| `HEADQUARTERS` | Converti en tour au siège au lieu d'être annulé | Aucune cascade, le tour reste |
| `FILL` | Les tours suivants avancent d'une semaine | La cadence est maintenue |
| `GAP` | Les tours suivants ne bougent pas | Vide dans le planning |

**Champs du formulaire :**
- Motif (liste + champ libre) — **obligatoire**
- Mode de gestion du planning (radio)
- Prévisualisation si FILL (tableau avant/après)

---

### 3. Créer manuellement (insert)

**Modes disponibles si la date est déjà prise :**

| Mode | Description | Effet sur le planning |
|---|---|---|
| `HEADQUARTERS` | Créer un tour siège à cette date, sans toucher l'existant | Deux tours ce dimanche : siège + existant → ❌ incohérent |
| `INSERT` | Insérer le nouveau tour, tous les suivants glissent de +1 semaine | Cascade d'une semaine |
| `REPLACE` | L'existant est annulé, le nouveau prend sa place | Un seul tour, l'existant est perdu |

> Note : si la date est libre, on crée directement sans choisir de mode.

**Champs du formulaire :**
- Motif / Notes — **optionnel** (c'est une création volontaire)
- Membre hôte
- Date
- Mode si conflit (radio, visible uniquement si la date est prise)

---

## Règles communes (invariants)

1. **Zone verrouillée (< 14 jours)** : un tour dans les 2 prochaines semaines ne peut pas être décalé automatiquement. Un avertissement est affiché et une confirmation explicite est demandée. Le mode `HEADQUARTERS` reste toujours disponible sans restriction.
2. **Profondeur de cascade** : la cascade s'arrête au premier tour entrant dans la zone verrouillée. Les tours au-delà sont signalés à l'utilisateur comme "non déplacés".
3. **Pas de doublon de date** : si après cascade deux tours tombent le même jour, on décale de +7j supplémentaires.
4. **Dry-run obligatoire** : toute cascade (CHAIN / FILL) montre un tableau avant/après avant d'appliquer. HEADQUARTERS, GAP et SWAP n'ont pas de cascade donc pas de dry-run.
5. **Log complet** : chaque action est enregistrée dans `rotation_logs` avec :
   - `action` : `postponed` | `cancelled` | `converted_to_headquarters` | `cascade_applied`
   - `meta` : `{ mode, motif, motif_detail, shift_weeks, affected_rotation_ids }`

---

## Architecture backend

### Nouveau service : `RotationCascadeService`

```
backend/app/Services/RotationCascadeService.php
```

**Méthodes publiques :**

```php
// Retourne le diff sans toucher la BDD
previewCascade(
    int    $dahiraId,
    int    $fromRotationId,
    string $mode,          // 'chain' | 'fill' | 'swap'
    int    $shiftWeeks = 1
): array

// Applique en transaction + log
applyCascade(array $preview, string $motif, ?string $motifDetail): Collection

// Convertit en tour siège
convertToHeadquarters(Rotation $rotation, string $motif, ?string $motifDetail): Rotation

// Annule avec gestion du planning
cancelWithMode(Rotation $rotation, string $mode, string $motif, ?string $motifDetail): array
```

**Algorithme CHAIN :**
```
1. Récupérer tous les tours planned/confirmed APRÈS from_rotation, triés par date
2. Séparer : zone flexible (>= 14 jours) | zone verrouillée (< 14 jours)
3. Pour chaque tour flexible :
   a. new_date = old_date + shiftWeeks × 7 jours
   b. Si new_date déjà prise → new_date += 7 (résolution de conflit)
4. Retourner { flexible: [...], locked: [...] } (dry-run)
5. Si appliqué : UPDATE batch + log avec motif
```

**Algorithme FILL (annulation + avance) :**
```
1. Marquer le tour cible cancelled + log motif
2. Récupérer tous les tours suivants dans la zone flexible
3. Pour chaque tour : new_date = old_date - 7 jours
4. Arrêter si new_date < aujourd'hui
5. Retourner diff
```

**Algorithme HEADQUARTERS :**
```
1. Récupérer la maison siège (House where is_headquarters = true, dahira_id = X)
2. Si aucune maison siège → exception métier "Aucun siège configuré"
3. rotation.house_id = siège.id
4. rotation.status   = 'headquarters'
5. rotation.notes    = motif
6. Log : converted_to_headquarters
7. Retourner rotation
```

### Mise à jour du schéma GraphQL

```graphql
enum CascadeMode {
  HEADQUARTERS   # tenir au siège, aucun décalage
  CHAIN          # décalage en chaîne
  SWAP           # échange avec le suivant
  GAP            # vide assumé, pas de cascade
  FILL           # avancer les suivants (annulation)
  INSERT         # insérer + décaler (création)
  REPLACE        # remplacer (comportement actuel)
}

enum RotationMotif {
  ABSENCE
  SICKNESS
  TRAVEL
  DEATH
  WEDDING
  RAMADAN
  MAGAL
  GAMOU
  RELIGIOUS_EVENT
  FLOOD
  LOGISTICS
  PLANNING_ERROR
  REBALANCE
  OTHER
}

input CascadeInput {
  from_rotation_id: ID!
  mode: CascadeMode!
  shift_weeks: Int         # pour CHAIN, défaut 1
  motif: RotationMotif!
  motif_detail: String     # champ libre si motif = OTHER
}

# Dry-run — renvoie le diff sans appliquer
query previewCascade(dahira_id: ID!, input: CascadeInput!): CascadePreview!

# Applique
mutation applyCascade(dahira_id: ID!, input: CascadeInput!): CascadeResult!

# Repousser enrichi (remplace rescheduleRotation)
mutation rescheduleRotation(
  id: ID!
  scheduled_date: Date     # null si HEADQUARTERS
  mode: CascadeMode!
  motif: RotationMotif!
  motif_detail: String
): CascadeResult!

# Annuler enrichi (remplace updateRotationStatus pour 'cancelled')
mutation cancelRotation(
  id: ID!
  mode: CascadeMode!       # HEADQUARTERS | FILL | GAP
  motif: RotationMotif!
  motif_detail: String
): CascadeResult!
```

**Types de retour :**

```graphql
type CascadePreviewItem {
  rotation_id: ID!
  member_name: String
  house_label: String
  old_date: Date!
  new_date: Date!
  is_locked: Boolean!
}

type CascadeMeta {
  mode: CascadeMode!
  total_affected: Int!
  locked_skipped: Int!
  shift_weeks: Int
  motif: RotationMotif!
}

type CascadePreview {
  items: [CascadePreviewItem!]!
  meta: CascadeMeta!
  has_locked_warning: Boolean!
}

type CascadeResult {
  applied_count: Int!
  skipped_locked: Int!
  headquarters_rotation: Rotation   # rempli si mode = HEADQUARTERS
  rotations: [Rotation!]!
}
```

---

## Architecture frontend

### Modal "Repousser" — refonte complète

```
┌─────────────────────────────────────────────────┐
│ ↕  Repousser — Baye Guene (3 mai)               │
├─────────────────────────────────────────────────┤
│  Motif *                                        │
│  [ Absence          ▼ ]                         │
│  [ Détail (optionnel)_________________ ]        │
├─────────────────────────────────────────────────┤
│  Comment gérer le planning ?                    │
│                                                 │
│  ◉ Tenir au siège cette date    ← HEADQUARTERS  │
│    Aucun décalage, le tour reste dimanche 3 mai │
│                                                 │
│  ○ Décaler tout le monde        ← CHAIN        │
│    [ +1 semaine ▼ ]  → nouveau 10 mai          │
│                                                 │
│  ○ Échanger avec le suivant     ← SWAP         │
│    Astou (10 mai) ↔ Baye Guene (3 mai)         │
│                                                 │
│  ○ Laisser un vide              ← GAP          │
│    Aucune dahira le 3 mai                       │
├─────────────────────────────────────────────────┤
│  [ Prévisualiser les changements ]   (si CHAIN) │
│  ┌─────────────────────────────────────────┐   │
│  │  Baye Guene   3 mai  →  10 mai         │   │
│  │  Astou       10 mai  →  17 mai         │   │
│  │  Moussa      17 mai  →  24 mai         │   │
│  │  ⚠ Fatou (24 mai) — zone verrouillée  │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  [ Annuler ]          [ Confirmer (3 modif.) ]  │
└─────────────────────────────────────────────────┘
```

### Dialog "Annuler" — refonte

```
┌─────────────────────────────────────────────────┐
│ ✕  Annuler — Astou (10 mai)                     │
├─────────────────────────────────────────────────┤
│  Motif *                                        │
│  [ Ramadan / Magal  ▼ ]                         │
│  [ Détail (optionnel)_________________ ]        │
├─────────────────────────────────────────────────┤
│  Que faire à la place ?                         │
│                                                 │
│  ◉ Tenir au siège cette date    ← HEADQUARTERS  │
│    La dahira a lieu quand même au siège         │
│                                                 │
│  ○ Avancer les suivants         ← FILL         │
│    Moussa passe au 10 mai, etc.                 │
│                                                 │
│  ○ Laisser un vide              ← GAP          │
│    Pas de dahira ce dimanche                    │
├─────────────────────────────────────────────────┤
│  [ Retour ]           [ Confirmer ]             │
└─────────────────────────────────────────────────┘
```

### Modal "Créer manuellement" — enrichissement

Ajouter un champ motif/notes (optionnel) et, si la date est prise, le choix du mode :

```
─── Si la date est déjà prise ───────────────────
  ◉ Insérer et décaler les suivants   ← INSERT
    Les tours existants glissent d'une semaine

  ○ Remplacer le tour existant         ← REPLACE
    [Nom existant] (10 mai) sera annulé
─────────────────────────────────────────────────
```

---

## Ordre de réalisation suggéré

| # | Tâche | Effort |
|---|---|---|
| 1 | Migration : ajouter `motif` + `motif_detail` dans `rotation_logs` | 1h |
| 2 | `RotationCascadeService` — `getChainFrom`, `previewCascade`, `applyCascade` | 1j |
| 3 | `RotationCascadeService` — `convertToHeadquarters`, `cancelWithMode` | ½j |
| 4 | GraphQL : `CascadeMode`, `RotationMotif`, `CascadeInput`, types de retour | ½j |
| 5 | GraphQL : query `previewCascade` + mutations `rescheduleRotation`, `cancelRotation` | ½j |
| 6 | Frontend — mutations et types TS (`cascades.ts`) | ½j |
| 7 | Frontend — Modal "Repousser" redessiné avec motif + mode + preview | 1j |
| 8 | Frontend — Dialog "Annuler" avec motif + mode | ½j |
| 9 | Frontend — Modal "Créer" enrichi (motif optionnel + mode si conflit) | ½j |
| 10 | Frontend — Affichage du motif dans l'historique (History drawer) | ¼j |
| 11 | Tests : 6 scénarios (CHAIN, SWAP, GAP, FILL, HEADQUARTERS × annulation, HQ × report) | ½j |

**Total estimé : ~6 jours**

---

## Ce qu'on ne change PAS

- L'algorithme DRR (sélection maison) et composite score (sélection membre) → intacts.
- La zone verrouillée 14 jours → inchangée (HEADQUARTERS reste disponible même dans la zone).
- `RotationPlannerService` (rebuild global) → complémentaire, pas remplacé.
- Les statuts existants → inchangés (`headquarters` existe déjà dans l'enum).
- Le champ `is_headquarters` sur `House` → déjà en BDD, on s'en sert directement.

---

## Question ouverte à trancher

**Que se passe-t-il si aucune maison siège n'est configurée et l'utilisateur choisit HEADQUARTERS ?**

- Option A : Erreur bloquante "Configurez d'abord une maison siège" + lien vers la page Maisons  
- Option B : Créer automatiquement un tour sans maison assignée (status `headquarters`, house = null)  
- Option C : Proposer à l'utilisateur de choisir une maison de remplacement dans la liste

**Recommandation** : Option A — forcer la configuration d'un siège est une bonne pratique ; le message d'erreur renvoie directement à la page concernée.
