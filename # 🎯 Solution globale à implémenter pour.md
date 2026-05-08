# 🎯 Solution globale à implémenter pour gérer intelligemment les tours du Dahira

Tu ne dois pas construire un simple calendrier.
Tu dois construire un :

```text id="mdv8go"
MOTEUR DE ROTATION INTELLIGENT
```

capable de :

* organiser les tours
* gérer les imprévus
* recalculer automatiquement
* préserver l’équité
* gérer finance + présence + historique

---

# 🏗️ 1. Architecture générale

Le système doit être divisé en 5 moteurs :

| Module            | Rôle                  |
| ----------------- | --------------------- |
| Rotation Engine   | génère les tours      |
| Replanning Engine | gère reports/imprévus |
| Fairness Engine   | garantit équité       |
| Finance Engine    | cotisations           |
| Event Engine      | événements spéciaux   |

---

# 🎯 2. Concept central : Queue intelligente

Ne jamais stocker uniquement des dates.

Tu dois avoir une :

```text id="s8e7rm"
FILE DE PRIORITÉ DYNAMIQUE
```

Chaque membre possède :

| Champ              | Description        |
| ------------------ | ------------------ |
| last_rotation_date | dernier tour       |
| total_rotations    | nombre tours       |
| availability       | disponible         |
| priority_score     | score intelligent  |
| suspension_status  | suspendu ou non    |
| preferred_periods  | périodes préférées |
| absence_frequency  | fréquence absences |

---

# 🎯 3. Moteur d’équité (LE PLUS IMPORTANT)

Règle absolue :

```text id="8bybh1"
Personne ne passe 2 fois avant qu’un autre n’ait passé.
```

Donc :

## Algorithme

À chaque génération :

```text id="rbh4cm"
Choisir le membre :
- le moins récemment passé
- disponible
- respectant min_interval
- meilleur score
```

---

# 🎯 4. Gestion intelligente des reports

Créer un moteur :

```text id="jtpd9y"
RotationReplannerService
```

qui :

## Étapes

### 1. Détecter problème

```text id="8mjlwm"
absence
pluie
décès
ramadan
swap
etc
```

---

### 2. Classifier gravité

| Niveau | Cas                |
| ------ | ------------------ |
| faible | permutation simple |
| moyen  | report             |
| élevé  | recalcul global    |

---

### 3. Générer solutions

Exemple :

```text id="03x2nf"
- swap_next
- headquarters
- postpone
- smart_swap
- volunteer_house
```

---

### 4. Scorer chaque solution

Critères :

| Critère              | Poids |
| -------------------- | ----- |
| équité               | 40    |
| stabilité calendrier | 30    |
| disponibilité        | 20    |
| distance             | 10    |

---

### 5. Proposer meilleure solution

---

# 🎯 5. Types de replanification à implémenter

## A — Simple swap

```text id="h7nnz7"
A ↔ B
```

---

## B — Smart swap

Chercher meilleur candidat dans plusieurs semaines.

---

## C — Siège

Ne modifie pas l’ordre.

---

## D — Global rebuild

Recalcul total futur planning.

---

## E — Temporary skip

Membre sauté temporairement.

---

# 🎯 6. Système de statut

## Rotation

```ts id="jlwm6u"
planned
confirmed
ongoing
completed
cancelled
rescheduled
headquarters
```

---

## Disponibilité membre

```ts id="07hzn7"
available
unavailable
travel
sick
suspended
```

---

# 🎯 7. Gestion du siège

Le siège doit être traité comme une “maison spéciale”.

```ts id="vk4x52"
is_headquarters = true
```

Ainsi :

* finance continue
* présence continue
* historique continue

---

# 🎯 8. Gestion des événements spéciaux

Créer :

```ts id="0a7u6z"
event_type:
tour
thiant
ziar
social
special
```

---

# 🎯 9. Finance intelligente

## Tour hebdomadaire

Cotisation obligatoire automatique selon catégorie.

```text id="kfr8p8"
Grand = 200f
Petit = 50/100f
```

Destination automatique :

```text id="t4hwtm"
fonds_ziar_annuel
```

---

## Autres événements

Objectif fixe :

```text id="35m8tp"
thiant = 40 000f
```

Cotisation libre progressive jusqu’à clôture.

---

# 🎯 10. UX PRINCIPALE

## Page finance

### À gauche

Grand card :

```text id="em7q9r"
TOUR DU DIMANCHE
Maison + responsable
Bouton cotisation rapide
Présence
Retards
```

---

### À droite

Liste compacte :

```text id="q1q4c7"
Tours futurs
```

---

# 🎯 11. Mode saisie ultra rapide

Le jour du tour :

```text id="lm8cgh"
✓ Papa Guene → payé
✓ Astou Faye → payé
✗ Modou absent
```

Saisie clavier/mobile ultra rapide.

---

# 🎯 12. Historique complet

Chaque modification doit être loggée.

```ts id="s4q6w8"
rotation_logs
```

Exemple :

```text id="8cgn7l"
Issa indisponible
→ siège choisi
→ planning inchangé
```

---

# 🎯 13. Recommandation IA / intelligente

Ajouter :

```text id="j2ntiq"
recommended_solution
confidence_score
```

---

# 🎯 14. Structure backend recommandée

## Services

```text id="9e3hxf"
RotationPlannerService
RotationFairnessService
RotationReplannerService
FinanceService
AttendanceService
EventService
```

---

# 🎯 15. Frontend Angular recommandé

## Modules

```text id="z0upc6"
dashboard
rotations
finance
events
statistics
planning
```

---

# 🎯 16. UX Admin parfaite

Quand problème détecté :

```text id="3clz8z"
⚠ Issa absent

Solutions :
1. Modou Fall (92%)
2. Siège Dahira (89%)
3. Reporter (71%)

[Appliquer]
```

---

# 🎯 17. Niveau professionnel recommandé

## Ne jamais modifier brutalement le planning.

Toujours :

```text id="fjlwmq"
preview_changes()
```

avant application.

---

# 🎯 18. Le plus important

Tu dois considérer que :

```text id="vddjlwm"
Le planning est vivant.
```

Donc :

* adaptable
* recalculable
* historisé
* intelligent
* équitable

---

# 💎 Architecture finale recommandée

```text id="z7dztt"
Dahira Management System
│
├── Rotation Engine
├── Smart Replanner
├── Fairness Engine
├── Finance Engine
├── Event Engine
├── Attendance Engine
└── Analytics Engine
```





Oui — c’est même une fonctionnalité centrale du système.

Tu dois avoir un bouton :

```text id="r1zhxa"
[ Recréer le planning ]
```

mais avec un vrai moteur intelligent derrière, pas juste “supprimer et régénérer”.

---

# 🎯 Objectif du bouton

Le bouton doit permettre de :

* recalculer les prochains tours
* rééquilibrer les membres
* intégrer les absences
* intégrer nouveaux membres
* corriger injustices
* stabiliser le planning

---

# 🎯 Cas où on utilise “Recréer le planning”

## ✅ Nouveau membre ajouté

Le système doit l’insérer intelligemment.

---

## ✅ Plusieurs reports ont désorganisé le calendrier

Reconstruction propre.

---

## ✅ Plusieurs absences successives

Rééquilibrage.

---

## ✅ Maison supprimée

Redistribution.

---

## ✅ Nouveau règlement

Exemple :

```text id="5bw7xj"
min_interval_weeks passe de 6 → 8
```

---

## ✅ Après Ramadan / Magal

Reconstruction saisonnière.

---

## ✅ Planning devenu injuste

Exemple :

```text id="7j6n4d"
Certains ont déjà reçu 2 tours.
```

---

# 🎯 UX idéale

## Bouton principal

```text id="oq0p73"
🔄 Recréer le planning
```

---

# 🎯 Popup intelligent

```text id="0yhtvd"
Recréer le planning

Période :
[ 3 mois ]
[ 6 mois ]
[ 12 mois ]

Mode :
(•) Équilibré
( ) Stable
( ) Rapide
( ) Optimisé géographiquement

Inclure :
[x] Absences connues
[x] Nouveaux membres
[x] Min interval
[x] Événements religieux

[Prévisualiser]
```

---

# 🎯 IMPORTANT : Prévisualisation obligatoire

Ne jamais appliquer directement.

## Montrer :

```text id="mdgxma"
Avant :
26 avril → Issa
03 mai → Modou

Après :
26 avril → Modou
03 mai → Siège
10 mai → Issa
```

---

# 🎯 Options du moteur

## 1. Mode équilibré

Priorité :

```text id="jlwm4m"
équité maximale
```

---

## 2. Mode stable

Change le moins possible.

---

## 3. Mode géographique

Optimise proximité.

---

## 4. Mode urgence

Reconstruit rapidement.

---

# 🎯 Backend recommandé

Créer :

```php id="lzmvq8"
RotationPlannerService
```

Méthodes :

```php id="v8twzi"
generateSchedule()
rebuildSchedule()
previewRebuild()
scoreMember()
applyRebuild()
```

---

# 🎯 Algorithme conseillé

Pour chaque date :

## Étape 1

Récupérer candidats valides.

---

## Étape 2

Éliminer :

* suspendus
* absents
* déjà passés récemment

---

## Étape 3

Calcul score :

```text id="t3mptm"
+ ancienneté sans tour
+ disponibilité
+ stabilité
+ proximité
+ capacité

- absence fréquente
- tour récent
```

---

## Étape 4

Choisir meilleur score.

---

# 🎯 Très important

Le système doit distinguer :

## Planning verrouillé

Tours proches :

```text id="jlwm89"
prochaines 2 semaines
```

ne doivent presque jamais changer.

---

## Planning flexible

Tours lointains peuvent être recalculés.

---

# 🎯 Structure DB utile

## rotation_rebuilds

```ts id="jlwm8p"
id
trigger_reason
mode
started_at
applied_at
created_by
```

---

## rotation_rebuild_items

```ts id="jlwm6j"
old_rotation_id
old_member_id
new_member_id
old_date
new_date
change_type
```

---

# 🎯 UX admin avancé

## Affichage impacts

```text id="jlwm2s"
✔ 12 tours rééquilibrés
✔ 3 nouveaux membres intégrés
✔ 2 conflits corrigés
✔ stabilité 91%
```

---

# 🎯 Règle professionnelle

Toujours permettre :

```text id="jlwm5t"
Annuler la reconstruction
```

---

# 🎯 Fonctionnalité premium

Ajouter :

```text id="jlwm7r"
Simulation mode
```

Tester avant application réelle.

---

# 💎 Conclusion

Le bouton :

```text id="jlwm1w"
🔄 Recréer le planning
```

doit devenir :

```text id="jlwm0e"
un moteur intelligent de réorganisation automatique du Dahira
```

et sera l’une des fonctionnalités les plus puissantes de ton application.
