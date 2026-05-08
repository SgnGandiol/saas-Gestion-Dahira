Voici les **6 grandes familles** de cas, avec pour chacune la solution technique associée. En résumé :
lis ce fichier

D:\AppGestionDahira\cas_changement_planning_dahira.html

**Règle d'or pour choisir l'action :**

- Le tour est dans les **2 prochaines semaines** → planning verrouillé, on touche le moins possible (headquarters ou swap simple)
- Le tour est dans **2 à 8 semaines** → report ou smart_swap, on recalcule localement
- Au-delà ou si le planning est structurellement cassé → `rebuildSchedule()` avec prévisualisation obligatoire avant application

**Les cas qui déclenchent un rebuild global :**
absences répétées (3+), membre supprimé, maison supprimée, changement d'intervalle minimum, déséquilibre détecté, et maladie/épidémie. Ce sont les cas où une modification locale ne suffit plus.

Clique sur n'importe quel bouton "Voir l'implémentation" pour approfondir un cas précis.

Tu es un expert Laravel/PHP en algorithmique de planification.

Je développe un système de gestion de tours pour un Dahira (association religieuse sénégalaise).
Chaque semaine, une maison de membre accueille le groupe. Le planning doit être équitable,
intelligent et résistant aux imprévus.

Voici mon service actuel :

[COLLER ICI LE CONTENU DE RotationService.php]

Il implémente déjà :
- Sélection de maison par dette DRR (Deficit Round Robin)
- Respect d'un intervalle minimum entre tours
- Sélection du membre le moins récemment passé
- Création et mise à jour des rotations



Task 

Améliore et étends ce service en implémentant les 5 éléments suivants :

1. SCORE DE PRIORITÉ DYNAMIQUE
   Remplace le tri simple actuel par un score composite sur le membre :
     score = (+) jours sans tour (pondéré 35%)
           + (+) disponibilité confirmée (pondéré 25%)
           + (-) fréquence d'absences passées (pondéré 20%)
           + (-) tour reçu récemment (pondéré 15%)
           + (-) statut suspendu (pondéré 5%)
   Ajoute les champs nécessaires sur le modèle Member.

2. SERVICE RotationReplannerService
   Crée un nouveau service avec ces méthodes :
     detectProblem(Rotation $r, string $reason): array
     classifyGravity(array $problem): string  // 'low'|'medium'|'high'
     generateSolutions(Rotation $r): Collection
     scoreSolution(array $solution, Rotation $r): float
     suggestBestSolution(Rotation $r, string $reason): array
   
   Les solutions possibles sont : swap_next, headquarters, postpone, smart_swap, volunteer_house
   Le scoring de solution utilise : équité(40%) stabilité(30%) disponibilité(20%) distance(10%)

3. STATUTS ENRICHIS
   Étends les enums/constantes pour :
     Rotation : planned|confirmed|ongoing|completed|cancelled|rescheduled|headquarters
     Member   : available|unavailable|travel|sick|suspended
   Gère le cas "headquarters" : maison spéciale is_headquarters=true,
   finance + présence continuent normalement, planning non perturbé.

4. MÉTHODES DE RECONSTRUCTION
   Dans un nouveau RotationPlannerService, implémente :
     previewRebuild(int $dahiraId, string $from, int $weeks, string $mode): array
     applyRebuild(array $preview): Collection
     cancelRebuild(int $rebuildId): bool
   
   Avec deux zones distinctes :
     - Planning verrouillé : < 2 semaines → ne jamais modifier
     - Planning flexible   : >= 2 semaines → recalculable
   
   Les modes disponibles : balanced|stable|geographic|urgent

5. JOURNAL DES MODIFICATIONS
   Crée un RotationLogService qui trace chaque changement :
     logChange(Rotation $r, string $action, array $meta): void
   Et retourne un historique lisible :
     getHistory(int $rotationId): Collection


     RÈGLES ABSOLUES à respecter dans tout le code produit :

- Jamais appliquer un rebuild sans passer par previewRebuild() d'abord
- Jamais modifier un tour dans les 2 prochaines semaines (planning verrouillé)
- Jamais deux tours pour un même membre avant que tous les autres soient passés
- Toujours utiliser DB::transaction() pour les opérations multi-tables
- Toujours logger chaque modification dans rotation_logs
- Le cas "siège" ne rompt pas l'équité : comptabiliser normalement
- Éviter les requêtes N+1 : utiliser with() et des agrégats SQL
- Chaque méthode publique doit avoir un docblock clair


Produis dans l'ordre :

1. RotationService.php     → version améliorée avec score composite
2. RotationReplannerService.php → nouveau service complet
3. RotationPlannerService.php  → rebuild + preview + apply + cancel
4. RotationLogService.php      → journal des modifications
5. Migration PHP                → ajout des colonnes nécessaires
   (priority_score, availability_status, absence_frequency sur members)
   (is_headquarters sur houses)
   (rotation_logs table)

Pour chaque fichier : code complet, aucun placeholder "// TODO".
Commence par le fichier 1 et attends ma confirmation avant de passer au suivant.