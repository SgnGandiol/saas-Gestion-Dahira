<?php

namespace Database\Seeders;

use App\Models\Dahira;
use App\Models\House;
use App\Models\Member;
use App\Models\MemberCategory;
use Illuminate\Database\Seeder;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $dahira = Dahira::first();

        if (! $dahira) {
            $this->command->warn('Aucun Dahira trouvé. Lancez DahiraSeeder d\'abord.');
            return;
        }

        $houses = House::withoutGlobalScopes()
            ->where('dahira_id', $dahira->id)
            ->get()
            ->keyBy('label');

        $categories = MemberCategory::withoutGlobalScopes()
            ->where('dahira_id', $dahira->id)
            ->get()
            ->keyBy('name');

        $T = $categories->get('taalibe')?->id;
        $M = $categories->get('moussou')?->id;
        $E = $categories->get('etudiant')?->id;
        $B = $categories->get('bienfaiteur')?->id;

        // Format : first_name, last_name, gender, phone, profession, house (label exact), category, joined_at
        $members = [

            // ── Keur Adama Loum (5 membres) ──────────────────────────────────
            ['first_name' => 'Adama',        'last_name' => 'Loum',    'gender' => 'male',   'phone' => '+221771001001', 'profession' => 'Menuisier',      'house' => 'Keur Adama Loum',    'category' => $T, 'joined_at' => '2021-03-10'],
            ['first_name' => 'Mariama',      'last_name' => 'Loum',    'gender' => 'female', 'phone' => '+221761001002', 'profession' => 'Ménagère',       'house' => 'Keur Adama Loum',    'category' => $M, 'joined_at' => '2021-03-10'],
            ['first_name' => 'Moussa',       'last_name' => 'Loum',    'gender' => 'male',   'phone' => '+221701001003', 'profession' => 'Étudiant',       'house' => 'Keur Adama Loum',    'category' => $E, 'joined_at' => '2024-09-01'],
            ['first_name' => 'Binta',        'last_name' => 'Loum',    'gender' => 'female', 'phone' => '+221761001004', 'profession' => 'Étudiante',      'house' => 'Keur Adama Loum',    'category' => $E, 'joined_at' => '2025-01-15'],
            ['first_name' => 'Saliou',       'last_name' => 'Loum',    'gender' => 'male',   'phone' => '+221771001005', 'profession' => 'Apprenti',       'house' => 'Keur Adama Loum',    'category' => $T, 'joined_at' => '2023-06-01'],

            // ── Keur Issa Guene (4 membres) ──────────────────────────────────
            ['first_name' => 'Papa Issa',    'last_name' => 'Guene',   'gender' => 'male',   'phone' => '+221771002001', 'profession' => 'Développeur',    'house' => 'Keur Issa Guene',    'category' => $B, 'joined_at' => '2021-01-10'],
            ['first_name' => 'Awa',          'last_name' => 'Guene',   'gender' => 'female', 'phone' => '+221761002002', 'profession' => 'Ménagère',       'house' => 'Keur Issa Guene',    'category' => $M, 'joined_at' => '2021-01-10'],
            ['first_name' => 'Baye',         'last_name' => 'Guene',   'gender' => 'male',   'phone' => '+221701002003', 'profession' => 'Étudiant',       'house' => 'Keur Issa Guene',    'category' => $E, 'joined_at' => '2023-10-01'],
            ['first_name' => 'Seynabou',     'last_name' => 'Guene',   'gender' => 'female', 'phone' => '+221761002004', 'profession' => 'Étudiante',      'house' => 'Keur Issa Guene',    'category' => $E, 'joined_at' => '2024-10-01'],

            // ── Keur Papa Guene (3 membres) ──────────────────────────────────
            ['first_name' => 'Cheikh',       'last_name' => 'Guene',   'gender' => 'male',   'phone' => '+221771003001', 'profession' => 'Commerçant',     'house' => 'Keur Papa Guene',    'category' => $T, 'joined_at' => '2022-05-20'],
            ['first_name' => 'Khady',        'last_name' => 'Guene',   'gender' => 'female', 'phone' => '+221761003002', 'profession' => 'Coiffeuse',      'house' => 'Keur Papa Guene',    'category' => $M, 'joined_at' => '2022-05-20'],
            ['first_name' => 'Ousmane',      'last_name' => 'Guene',   'gender' => 'male',   'phone' => '+221771003003', 'profession' => 'Chauffeur',      'house' => 'Keur Papa Guene',    'category' => $T, 'joined_at' => '2023-02-01'],

            // ── Keur Baye Guene (2 membres) ──────────────────────────────────
            ['first_name' => 'Serigne',      'last_name' => 'Guene',   'gender' => 'male',   'phone' => '+221771004001', 'profession' => 'Marabout',       'house' => 'Keur Baye Guene',    'category' => $T, 'joined_at' => '2020-11-15'],
            ['first_name' => 'Ndéye',        'last_name' => 'Guene',   'gender' => 'female', 'phone' => '+221761004002', 'profession' => 'Ménagère',       'house' => 'Keur Baye Guene',    'category' => $M, 'joined_at' => '2020-11-15'],

            // ── Keur Abdou Diop (6 membres) ──────────────────────────────────
            ['first_name' => 'Abdou',        'last_name' => 'Diop',    'gender' => 'male',   'phone' => '+221771005001', 'profession' => 'Chauffeur',      'house' => 'Keur Abdou Diop',    'category' => $T, 'joined_at' => '2020-05-11'],
            ['first_name' => 'Coura',        'last_name' => 'Diop',    'gender' => 'female', 'phone' => '+221761005002', 'profession' => 'Restauratrice',  'house' => 'Keur Abdou Diop',    'category' => $M, 'joined_at' => '2020-05-11'],
            ['first_name' => 'Ousmane',      'last_name' => 'Diop',    'gender' => 'male',   'phone' => '+221701005003', 'profession' => 'Étudiant',       'house' => 'Keur Abdou Diop',    'category' => $E, 'joined_at' => '2025-01-05'],
            ['first_name' => 'Daba',         'last_name' => 'Diop',    'gender' => 'female', 'phone' => '+221761005004', 'profession' => 'Étudiante',      'house' => 'Keur Abdou Diop',    'category' => $E, 'joined_at' => '2024-09-15'],
            ['first_name' => 'Malick',       'last_name' => 'Diop',    'gender' => 'male',   'phone' => '+221771005005', 'profession' => 'Mécanicien',     'house' => 'Keur Abdou Diop',    'category' => $T, 'joined_at' => '2022-03-08'],
            ['first_name' => 'Penda',        'last_name' => 'Diop',    'gender' => 'female', 'phone' => '+221761005006', 'profession' => 'Commerçante',    'house' => 'Keur Abdou Diop',    'category' => $M, 'joined_at' => '2021-07-20'],

            // ── Keur Coura Loum (3 membres) ──────────────────────────────────
            ['first_name' => 'El Hadji',     'last_name' => 'Loum',    'gender' => 'male',   'phone' => '+221771006001', 'profession' => 'Électricien',    'house' => 'Keur Coura Loum',    'category' => $T, 'joined_at' => '2022-08-10'],
            ['first_name' => 'Rokhaya',      'last_name' => 'Loum',    'gender' => 'female', 'phone' => '+221761006002', 'profession' => 'Ménagère',       'house' => 'Keur Coura Loum',    'category' => $M, 'joined_at' => '2022-08-10'],
            ['first_name' => 'Ibrahima',     'last_name' => 'Loum',    'gender' => 'male',   'phone' => '+221701006003', 'profession' => 'Étudiant',       'house' => 'Keur Coura Loum',    'category' => $E, 'joined_at' => '2025-02-01'],

            // ── Keur Astou Faye (4 membres) ──────────────────────────────────
            ['first_name' => 'Momar',        'last_name' => 'Faye',    'gender' => 'male',   'phone' => '+221771007001', 'profession' => 'Agriculteur',    'house' => 'Keur Astou Faye',    'category' => $T, 'joined_at' => '2019-04-01'],
            ['first_name' => 'Astou',        'last_name' => 'Faye',    'gender' => 'female', 'phone' => '+221761007002', 'profession' => 'Comptable',      'house' => 'Keur Astou Faye',    'category' => $M, 'joined_at' => '2019-04-01'],
            ['first_name' => 'Assane',       'last_name' => 'Faye',    'gender' => 'male',   'phone' => '+221771007003', 'profession' => 'Maçon',          'house' => 'Keur Astou Faye',    'category' => $T, 'joined_at' => '2022-01-15'],
            ['first_name' => 'Yacine',       'last_name' => 'Faye',    'gender' => 'female', 'phone' => '+221761007004', 'profession' => 'Infirmière',     'house' => 'Keur Astou Faye',    'category' => $M, 'joined_at' => '2023-09-10'],

            // ── Keur Adama Faye (2 membres) ──────────────────────────────────
            ['first_name' => 'Adama',        'last_name' => 'Faye',    'gender' => 'male',   'phone' => '+221771008001', 'profession' => 'Tailleur',       'house' => 'Keur Adama Faye',    'category' => $T, 'joined_at' => '2023-03-05'],
            ['first_name' => 'Sokhna',       'last_name' => 'Faye',    'gender' => 'female', 'phone' => '+221761008002', 'profession' => 'Ménagère',       'house' => 'Keur Adama Faye',    'category' => $M, 'joined_at' => '2023-03-05'],

            // ── Keur Lamine Diane (5 membres) ────────────────────────────────
            ['first_name' => 'Lamine',       'last_name' => 'Diane',   'gender' => 'male',   'phone' => '+221771009001', 'profession' => 'Enseignant',     'house' => 'Keur Lamine Diane',  'category' => $B, 'joined_at' => '2020-09-01'],
            ['first_name' => 'Aissatou',     'last_name' => 'Diane',   'gender' => 'female', 'phone' => '+221761009002', 'profession' => 'Sage-femme',     'house' => 'Keur Lamine Diane',  'category' => $M, 'joined_at' => '2020-09-01'],
            ['first_name' => 'Mamadou',      'last_name' => 'Diane',   'gender' => 'male',   'phone' => '+221701009003', 'profession' => 'Étudiant',       'house' => 'Keur Lamine Diane',  'category' => $E, 'joined_at' => '2023-10-15'],
            ['first_name' => 'Fatou',        'last_name' => 'Diane',   'gender' => 'female', 'phone' => '+221761009004', 'profession' => 'Étudiante',      'house' => 'Keur Lamine Diane',  'category' => $E, 'joined_at' => '2024-10-15'],
            ['first_name' => 'Babacar',      'last_name' => 'Diane',   'gender' => 'male',   'phone' => '+221771009005', 'profession' => 'Apprenti',       'house' => 'Keur Lamine Diane',  'category' => $T, 'joined_at' => '2025-03-01'],

            // ── Keur Modou Mbow (3 membres) ──────────────────────────────────
            ['first_name' => 'Modou',        'last_name' => 'Mbow',    'gender' => 'male',   'phone' => '+221771010001', 'profession' => 'Plombier',       'house' => 'Keur Modou Mbow',    'category' => $T, 'joined_at' => '2021-07-07'],
            ['first_name' => 'Marème',       'last_name' => 'Mbow',    'gender' => 'female', 'phone' => '+221761010002', 'profession' => 'Vendeuse',       'house' => 'Keur Modou Mbow',    'category' => $M, 'joined_at' => '2021-07-07'],
            ['first_name' => 'Cheikh',       'last_name' => 'Mbow',    'gender' => 'male',   'phone' => '+221771010003', 'profession' => 'Commerçant',     'house' => 'Keur Modou Mbow',    'category' => $T, 'joined_at' => '2022-11-20'],

            // ── Keur Moussa Ndiaye (2 membres) ───────────────────────────────
            ['first_name' => 'Moussa',       'last_name' => 'Ndiaye',  'gender' => 'male',   'phone' => '+221771011001', 'profession' => 'Technicien',     'house' => 'Keur Moussa Ndiaye', 'category' => $T, 'joined_at' => '2022-04-12'],
            ['first_name' => 'Aminata',      'last_name' => 'Ndiaye',  'gender' => 'female', 'phone' => '+221761011002', 'profession' => 'Pharmacienne',   'house' => 'Keur Moussa Ndiaye', 'category' => $M, 'joined_at' => '2022-04-12'],

            // ── Keur Ousmane Sarr (4 membres) ────────────────────────────────
            ['first_name' => 'Ousmane',      'last_name' => 'Sarr',    'gender' => 'male',   'phone' => '+221771012001', 'profession' => 'Agent bancaire', 'house' => 'Keur Ousmane Sarr',  'category' => $T, 'joined_at' => '2021-06-05'],
            ['first_name' => 'Adja',         'last_name' => 'Sarr',    'gender' => 'female', 'phone' => '+221761012002', 'profession' => 'Institutrice',   'house' => 'Keur Ousmane Sarr',  'category' => $M, 'joined_at' => '2021-06-05'],
            ['first_name' => 'Alioune',      'last_name' => 'Sarr',    'gender' => 'male',   'phone' => '+221701012003', 'profession' => 'Étudiant',       'house' => 'Keur Ousmane Sarr',  'category' => $E, 'joined_at' => '2024-10-01'],
            ['first_name' => 'Rama',         'last_name' => 'Sarr',    'gender' => 'female', 'phone' => '+221761012004', 'profession' => 'Coiffeuse',      'house' => 'Keur Ousmane Sarr',  'category' => $M, 'joined_at' => '2023-01-18'],

            // ── Keur Ibrahima Fall (5 membres) ───────────────────────────────
            ['first_name' => 'Ibrahima',     'last_name' => 'Fall',    'gender' => 'male',   'phone' => '+221771013001', 'profession' => 'Ingénieur',      'house' => 'Keur Ibrahima Fall', 'category' => $B, 'joined_at' => '2018-09-01'],
            ['first_name' => 'Sokhna',       'last_name' => 'Fall',    'gender' => 'female', 'phone' => '+221761013002', 'profession' => 'Médecin',        'house' => 'Keur Ibrahima Fall', 'category' => $M, 'joined_at' => '2018-09-01'],
            ['first_name' => 'Pape',         'last_name' => 'Fall',    'gender' => 'male',   'phone' => '+221771013003', 'profession' => 'Informaticien',  'house' => 'Keur Ibrahima Fall', 'category' => $T, 'joined_at' => '2021-04-20'],
            ['first_name' => 'Khady',        'last_name' => 'Fall',    'gender' => 'female', 'phone' => '+221761013004', 'profession' => 'Étudiante',      'house' => 'Keur Ibrahima Fall', 'category' => $E, 'joined_at' => '2024-09-01'],
            ['first_name' => 'Bamba',        'last_name' => 'Fall',    'gender' => 'male',   'phone' => '+221771013005', 'profession' => 'Architecte',     'house' => 'Keur Ibrahima Fall', 'category' => $T, 'joined_at' => '2022-07-15'],

            // ── Keur Pape Kane (2 membres) ───────────────────────────────────
            ['first_name' => 'Pape',         'last_name' => 'Kane',    'gender' => 'male',   'phone' => '+221771014001', 'profession' => 'Transporteur',   'house' => 'Keur Pape Kane',     'category' => $T, 'joined_at' => '2023-05-01'],
            ['first_name' => 'Dieynaba',     'last_name' => 'Kane',    'gender' => 'female', 'phone' => '+221761014002', 'profession' => 'Ménagère',       'house' => 'Keur Pape Kane',     'category' => $M, 'joined_at' => '2023-05-01'],

            // ── Keur Serigne Mbaye (6 membres) ───────────────────────────────
            ['first_name' => 'Serigne',      'last_name' => 'Mbaye',   'gender' => 'male',   'phone' => '+221771015001', 'profession' => 'Marabout',       'house' => 'Keur Serigne Mbaye', 'category' => $B, 'joined_at' => '2017-03-15'],
            ['first_name' => 'Yaye',         'last_name' => 'Mbaye',   'gender' => 'female', 'phone' => '+221761015002', 'profession' => 'Ménagère',       'house' => 'Keur Serigne Mbaye', 'category' => $M, 'joined_at' => '2017-03-15'],
            ['first_name' => 'Tapha',        'last_name' => 'Mbaye',   'gender' => 'male',   'phone' => '+221771015003', 'profession' => 'Commerçant',     'house' => 'Keur Serigne Mbaye', 'category' => $T, 'joined_at' => '2020-01-10'],
            ['first_name' => 'Ndéye',        'last_name' => 'Mbaye',   'gender' => 'female', 'phone' => '+221761015004', 'profession' => 'Couturière',     'house' => 'Keur Serigne Mbaye', 'category' => $M, 'joined_at' => '2021-08-05'],
            ['first_name' => 'Omar',         'last_name' => 'Mbaye',   'gender' => 'male',   'phone' => '+221701015005', 'profession' => 'Étudiant',       'house' => 'Keur Serigne Mbaye', 'category' => $E, 'joined_at' => '2024-09-01'],
            ['first_name' => 'Mame',         'last_name' => 'Mbaye',   'gender' => 'female', 'phone' => '+221761015006', 'profession' => 'Étudiante',      'house' => 'Keur Serigne Mbaye', 'category' => $E, 'joined_at' => '2025-01-20'],

            // ── Keur Mamadou Thiaw (3 membres) ───────────────────────────────
            ['first_name' => 'Mamadou',      'last_name' => 'Thiaw',   'gender' => 'male',   'phone' => '+221771016001', 'profession' => 'Bijoutier',      'house' => 'Keur Mamadou Thiaw', 'category' => $T, 'joined_at' => '2021-10-10'],
            ['first_name' => 'Coumba',       'last_name' => 'Thiaw',   'gender' => 'female', 'phone' => '+221761016002', 'profession' => 'Ménagère',       'house' => 'Keur Mamadou Thiaw', 'category' => $M, 'joined_at' => '2021-10-10'],
            ['first_name' => 'Aliou',        'last_name' => 'Thiaw',   'gender' => 'male',   'phone' => '+221771016003', 'profession' => 'Soudeur',        'house' => 'Keur Mamadou Thiaw', 'category' => $T, 'joined_at' => '2023-04-18'],

            // ── Keur Cheikh Diagne (4 membres) ───────────────────────────────
            ['first_name' => 'Cheikh',       'last_name' => 'Diagne',  'gender' => 'male',   'phone' => '+221771017001', 'profession' => 'Avocat',         'house' => 'Keur Cheikh Diagne', 'category' => $B, 'joined_at' => '2019-06-20'],
            ['first_name' => 'Aminata',      'last_name' => 'Diagne',  'gender' => 'female', 'phone' => '+221761017002', 'profession' => 'Juriste',        'house' => 'Keur Cheikh Diagne', 'category' => $M, 'joined_at' => '2019-06-20'],
            ['first_name' => 'Khalifa',      'last_name' => 'Diagne',  'gender' => 'male',   'phone' => '+221771017003', 'profession' => 'Notaire',        'house' => 'Keur Cheikh Diagne', 'category' => $T, 'joined_at' => '2022-02-10'],
            ['first_name' => 'Ndéye Fatou',  'last_name' => 'Diagne',  'gender' => 'female', 'phone' => '+221761017004', 'profession' => 'Secrétaire',     'house' => 'Keur Cheikh Diagne', 'category' => $M, 'joined_at' => '2023-11-01'],

            // ── Keur Babacar Seck (2 membres) ────────────────────────────────
            ['first_name' => 'Babacar',      'last_name' => 'Seck',    'gender' => 'male',   'phone' => '+221771018001', 'profession' => 'Chauffeur',      'house' => 'Keur Babacar Seck',  'category' => $T, 'joined_at' => '2023-07-15'],
            ['first_name' => 'Rokhaya',      'last_name' => 'Seck',    'gender' => 'female', 'phone' => '+221761018002', 'profession' => 'Ménagère',       'house' => 'Keur Babacar Seck',  'category' => $M, 'joined_at' => '2023-07-15'],

            // ── Keur Samba Sy (5 membres) ─────────────────────────────────────
            ['first_name' => 'Samba',        'last_name' => 'Sy',      'gender' => 'male',   'phone' => '+221771019001', 'profession' => 'Commerçant',     'house' => 'Keur Samba Sy',      'category' => $T, 'joined_at' => '2020-08-01'],
            ['first_name' => 'Marème',       'last_name' => 'Sy',      'gender' => 'female', 'phone' => '+221761019002', 'profession' => 'Vendeuse',       'house' => 'Keur Samba Sy',      'category' => $M, 'joined_at' => '2020-08-01'],
            ['first_name' => 'Idrissa',      'last_name' => 'Sy',      'gender' => 'male',   'phone' => '+221771019003', 'profession' => 'Maçon',          'house' => 'Keur Samba Sy',      'category' => $T, 'joined_at' => '2021-12-10'],
            ['first_name' => 'Dieynaba',     'last_name' => 'Sy',      'gender' => 'female', 'phone' => '+221701019004', 'profession' => 'Étudiante',      'house' => 'Keur Samba Sy',      'category' => $E, 'joined_at' => '2024-09-15'],
            ['first_name' => 'Gora',         'last_name' => 'Sy',      'gender' => 'male',   'phone' => '+221771019005', 'profession' => 'Électricien',    'house' => 'Keur Samba Sy',      'category' => $T, 'joined_at' => '2022-05-22'],

            // ── Sans foyer attribué (membres itinérants) ──────────────────────
            ['first_name' => 'Seydou',       'last_name' => 'Badji',   'gender' => 'male',   'phone' => '+221771020001', 'profession' => 'Artisan',        'house' => null,                 'category' => $T, 'joined_at' => '2025-02-01'],
            ['first_name' => 'Oumou',        'last_name' => 'Diakhaby','gender' => 'female', 'phone' => '+221761020002', 'profession' => 'Couturière',     'house' => null,                 'category' => $M, 'joined_at' => '2025-03-10'],
            ['first_name' => 'Boubacar',     'last_name' => 'Manga',   'gender' => 'male',   'phone' => '+221771020003', 'profession' => 'Pêcheur',        'house' => null,                 'category' => $T, 'joined_at' => '2025-04-01'],
        ];

        $count = 0;
        foreach ($members as $data) {
            $houseId = null;
            if ($data['house'] !== null) {
                $houseId = $houses->get($data['house'])?->id;
            }

            Member::withoutGlobalScopes()->firstOrCreate(
                [
                    'dahira_id'  => $dahira->id,
                    'first_name' => $data['first_name'],
                    'last_name'  => $data['last_name'],
                ],
                [
                    'dahira_id'          => $dahira->id,
                    'house_id'           => $houseId,
                    'member_category_id' => $data['category'],
                    'first_name'         => $data['first_name'],
                    'last_name'          => $data['last_name'],
                    'phone'              => $data['phone'],
                    'gender'             => $data['gender'],
                    'profession'         => $data['profession'],
                    'joined_at'          => $data['joined_at'],
                    'is_active'          => true,
                ]
            );
            $count++;
        }

        $this->command->info($count . ' membres créés.');
    }
}
