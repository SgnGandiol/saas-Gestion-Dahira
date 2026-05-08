Je veux implémenter un MODULE INTELLIGENT DE REPLANIFICATION DES TOURS (rotations hebdomadaires entre maisons).

CONTEXTE MÉTIER :
- Chaque dimanche, un tour est organisé dans une maison.
- Chaque membre appartient à une maison.
- Une maison peut contenir plusieurs membres.
- Tous les membres doivent passer équitablement.
- Personne ne doit recevoir 2 tours avant qu’un autre n’ait reçu le sien.
- En cas d’imprévu, le système doit recalculer intelligemment le planning.

OBJECTIF :
Créer un moteur de replanification automatique avec plusieurs scénarios.

==================================================
CAS À GÉRER
==================================================

CAS A — Membre indisponible longtemps à l’avance
Exemple :
26 avril = Issa
03 mai = Modou

Issa prévient 10 jours avant.

Solution :
26 avril = Modou
03 mai = Issa

--------------------------------------------------

CAS B — Absence dernière minute
Le membre annule samedi soir pour dimanche.

Solution :
26 avril = Siège Dahira

Le reste du planning reste inchangé.

--------------------------------------------------

CAS C — Maison indisponible mais membre disponible
Travaux / manque de place / décès familial.

Solution :
Tour déplacé :
- siège dahira
ou
- maison liée

Le membre garde son tour.

--------------------------------------------------

CAS D — Échange entre deux membres

Issa veut mai
Modou veut avril

Solution :
Swap entre deux dates.

--------------------------------------------------

CAS E — Retards répétés / absences fréquentes

Solution :
- baisser priorité
- suspendre temporairement
- validation admin obligatoire

--------------------------------------------------

CAS F — Grand événement religieux

Ramadan / Magal / Gamou / Tabaski

Solution :
- pause planning
- tours au siège
- regroupement

--------------------------------------------------

CAS G — Pluie / urgence / impossibilité générale

Solution :
Tour automatique au siège ou report.

--------------------------------------------------

CAS H — Nouvelle maison ajoutée

Solution :
Insérer intelligemment sans casser l’équité.

--------------------------------------------------

CAS I — Maison supprimée / membre quitte dahira

Solution :
Retirer de la rotation et recalcul automatique.

==================================================
RÈGLES MÉTIER IMPORTANTES
==================================================

1. Tout le monde doit passer.
2. Aucun membre ne passe 2 fois avant un autre.
3. Le dahira doit toujours pouvoir se tenir.
4. Priorité à la stabilité du planning.
5. Respect du min_interval_weeks entre deux passages.
6. Historique conservé.

==================================================
ALGORITHME INTELLIGENT SOUHAITÉ
==================================================

Chaque candidat reçoit un score :

+ disponibilité
+ ancienneté sans tour
+ maison grande capacité
+ proximité géographique
+ peu de passages récents
+ stabilité du calendrier

- déjà passé récemment
- absent fréquent
- changement trop perturbant

Choisir le meilleur score.
