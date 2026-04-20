## Verdict direct : l’algorithme de planification contient une erreur majeure de fairness

Ton JSON montre un problème évident :

> **Maison Guene (2 membres) est sur-planifiée de façon excessive**, avec plusieurs passages consécutifs ou trop rapprochés.

C’est la signature d’un bug logique dans le moteur de sélection.

---

# 1. Preuve visible dans les données

## Maison Guene apparaît :

* 26 Avril
* 07 Juin
* 14 Juin
* 21 Juin
* 02 Août
* 09 Août
* 16 Août
* 27 Sept
* 04 Oct
* 11 Oct

➡️ **10 passages sur 27 rotations**

Avec seulement **2 membres**.

C’est disproportionné.

---

# 2. Erreur la plus grave : passages consécutifs

## Juin :

* 07 Juin
* 14 Juin
* 21 Juin

Trois dimanches de suite.

## Août :

* 02 Août
* 09 Août
* 16 Août

Encore trois dimanches de suite.

## Sept/Oct :

* 27 Sept
* 04 Oct
* 11 Oct

Trois dimanches de suite encore.

➡️ Cela ne respecte aucune règle d’espacement par maison.

---

# 3. Diagnostic technique probable

Ton moteur choisit probablement :

```text id="e9d7r1"
choisir maison avec membre le moins récemment servi
```

Et comme Maison Guene a 2 membres alternés :

* Baye
* Papa

Le système croit :

* Baye reposé
* Papa reposé

Donc il reprend la même maison.

Mais il oublie :

> **La maison entière a déjà reçu récemment.**

---

# 4. Erreur conceptuelle

Tu as appliqué la rotation **au niveau membre seulement**, sans cooldown maison.

Donc :

| Semaine | Maison | Membre |
| ------- | ------ | ------ |
| S1      | Guene  | Baye   |
| S2      | Guene  | Papa   |
| S3      | Guene  | Baye   |

Le moteur pense varier.
Mais socialement c’est la même concession 3 fois.

---

# 5. Deuxième erreur : absence de quota relatif

Maison Guene :

* 2 membres

Maison Faye :

* 2 membres

Maison Diop :

* 2 membres

Maison Medoune :

* 0 membre

Maison Diane :

* 1 membre

Maison Mbow :

* 1 membre

Même avec cela, Guene domine trop le planning.

Donc il manque un score :

```text id="z4m1j8"
house_rotation_count
```

---

# 6. Troisième erreur : Maison Medoune planifiée sans membre

Maison Medoune apparaît plusieurs fois avec :

```json id="z5stl1"
members:[]
member:null
```

Cela signifie que le moteur planifie une maison non exploitable.

Bug métier important.

---

# 7. Ce que l’algorithme aurait dû faire

Après :

* 07 Juin Maison Guene

Il fallait bloquer Maison Guene pendant X semaines.

Exemple :

```text id="iq3h5r"
house_cooldown = 4 semaines
```

Donc impossible le 14 Juin.

---

# 8. Règle correcte recommandée

Le score final doit combiner :

score = member_fairness + house_fairness + cooldown\ penalty

---

# 9. Ce qu’il faut stocker

## Houses

* last_rotation_at
* rotation_count
* cooldown_until

## Members

* last_assigned_at
* assignment_count

---

# 10. Algorithme corrigé

## Étape 1

Exclure maisons :

* sans membre actif
* en cooldown

## Étape 2

Parmi restantes, choisir maison la moins servie récemment.

## Étape 3

Dans cette maison, choisir membre le moins sollicité.

---

# 11. Résultat attendu

Au lieu de :

Guene, Guene, Guene

On aurait :

* Guene
* Diop
* Faye
* Diane
* Mbow
* Guene

---

# 12. Résumé des erreurs trouvées

## ❌ Bug 1

Pas de cooldown maison.

## ❌ Bug 2

Rotation centrée membre seulement.

## ❌ Bug 3

Pas de limite de fréquence maison.

## ❌ Bug 4

Maison vide planifiée.

## ❌ Bug 5

Fairness globale absente.

---

# 13. Niveau produit

Ton moteur n’est pas mauvais.
Il est simplement passé d’un extrême :

### ancien modèle

centré maison

à

### nouveau modèle

centré membre

Il faut maintenant le **modèle hybride équilibré**.

---

# 14. Recommandation immédiate

Ajoute cette règle simple :

```text id="x4m9pd"
Une maison ne peut pas être choisie 2 fois dans les 4 prochaines rotations
```

Cela corrige déjà 80% du problème.

---

