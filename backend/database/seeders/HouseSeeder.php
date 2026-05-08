<?php

namespace Database\Seeders;

use App\Models\Dahira;
use App\Models\House;
use Illuminate\Database\Seeder;

class HouseSeeder extends Seeder
{
    public function run(): void
    {
        $dahira = Dahira::first();

        if (! $dahira) {
            $this->command->warn('Aucun Dahira trouvé. Lancez DahiraSeeder d\'abord.');
            return;
        }

        $houses = [
    [
        'label'              => 'Keur Adama Loum',
        'address'            => 'Maison 01, Médina Fall',
        'neighborhood'       => 'Médina Fall',
        'capacity'           => 8,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 2,
        'last_received_at'   => '2026-02-14',
    ],
    [
        'label'              => 'Keur Issa Guene',
        'address'            => 'Maison 02, Médina Fall',
        'neighborhood'       => 'Médina Fall',
        'capacity'           => 8,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 3,
        'last_received_at'   => '2026-03-01',
    ],
    [
        'label'              => 'Keur Papa Guene',
        'address'            => 'Maison 03, Nguinth',
        'neighborhood'       => 'Nguinth',
        'capacity'           => 6,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 1,
        'last_received_at'   => '2026-01-20',
    ],
    [
        'label'              => 'Keur Baye Guene',
        'address'            => 'Maison 04, Nguinth',
        'neighborhood'       => 'Nguinth',
        'capacity'           => 6,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 0,
        'last_received_at'   => null,
    ],
    [
        'label'              => 'Keur Abdou Diop',
        'address'            => 'Maison 05, Randoulène',
        'neighborhood'       => 'Randoulène Sud',
        'capacity'           => 7,
        'is_available'       => true,
        'min_interval_weeks' => 6,
        'total_received'     => 4,
        'last_received_at'   => '2026-04-05',
    ],
    [
        'label'              => 'Keur Coura Loum',
        'address'            => 'Maison 06, Randoulène',
        'neighborhood'       => 'Randoulène Sud',
        'capacity'           => 5,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 2,
        'last_received_at'   => '2026-02-10',
    ],
    [
        'label'              => 'Keur Astou Faye',
        'address'            => 'Maison 07, Thiès Nord',
        'neighborhood'       => 'Thiès Nord',
        'capacity'           => 6,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 1,
        'last_received_at'   => '2025-12-10',
    ],
    [
        'label'              => 'Keur Adama Faye',
        'address'            => 'Maison 08, Thiès Nord',
        'neighborhood'       => 'Thiès Nord',
        'capacity'           => 5,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 3,
        'last_received_at'   => '2026-03-22',
    ],
    [
        'label'              => 'Keur Lamine Diane',
        'address'            => 'Maison 09, Thiès Sud',
        'neighborhood'       => 'Thiès Sud',
        'capacity'           => 5,
        'is_available'       => true,
        'min_interval_weeks' => 10,
        'total_received'     => 1,
        'last_received_at'   => '2025-11-01',
    ],
    [
        'label'              => 'Keur Modou Mbow',
        'address'            => 'Maison 10, Thiès Sud',
        'neighborhood'       => 'Thiès Sud',
        'capacity'           => 5,
        'is_available'       => true,
        'min_interval_weeks' => 10,
        'total_received'     => 2,
        'last_received_at'   => '2026-01-05',
    ],
    [
        'label'              => 'Keur Moussa Ndiaye',
        'address'            => 'Maison 11, Diamaguène',
        'neighborhood'       => 'Diamaguène',
        'capacity'           => 4,
        'is_available'       => true,
        'min_interval_weeks' => 12,
        'total_received'     => 0,
        'last_received_at'   => null,
    ],
    [
        'label'              => 'Keur Ousmane Sarr',
        'address'            => 'Maison 12, Diamaguène',
        'neighborhood'       => 'Diamaguène',
        'capacity'           => 4,
        'is_available'       => true,
        'min_interval_weeks' => 12,
        'total_received'     => 1,
        'last_received_at'   => '2025-10-15',
    ],
    [
        'label'              => 'Keur Ibrahima Fall',
        'address'            => 'Maison 13, Escale',
        'neighborhood'       => 'Escale',
        'capacity'           => 5,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 5,
        'last_received_at'   => '2026-04-10',
    ],
    [
        'label'              => 'Keur Pape Kane',
        'address'            => 'Maison 14, Escale',
        'neighborhood'       => 'Escale',
        'capacity'           => 4,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 1,
        'last_received_at'   => '2025-09-18',
    ],
    [
        'label'              => 'Keur Serigne Mbaye',
        'address'            => 'Maison 15, Keur Mousseu',
        'neighborhood'       => 'Keur Mousseu',
        'capacity'           => 6,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 0,
        'last_received_at'   => null,
    ],
    [
        'label'              => 'Keur Mamadou Thiaw',
        'address'            => 'Maison 16, Keur Mousseu',
        'neighborhood'       => 'Keur Mousseu',
        'capacity'           => 4,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 2,
        'last_received_at'   => '2026-02-25',
    ],
    [
        'label'              => 'Keur Cheikh Diagne',
        'address'            => 'Maison 17, Grand Standing',
        'neighborhood'       => 'Grand Standing',
        'capacity'           => 5,
        'is_available'       => true,
        'min_interval_weeks' => 6,
        'total_received'     => 3,
        'last_received_at'   => '2026-03-14',
    ],
    [
        'label'              => 'Keur Babacar Seck',
        'address'            => 'Maison 18, Grand Standing',
        'neighborhood'       => 'Grand Standing',
        'capacity'           => 4,
        'is_available'       => true,
        'min_interval_weeks' => 6,
        'total_received'     => 1,
        'last_received_at'   => '2026-01-28',
    ],
    [
        'label'              => 'Keur Samba Sy',
        'address'            => 'Maison 19, Cité Senghor',
        'neighborhood'       => 'Cité Senghor',
        'capacity'           => 6,
        'is_available'       => true,
        'min_interval_weeks' => 8,
        'total_received'     => 0,
        'last_received_at'   => null,
    ],
];

        foreach ($houses as $house) {
            House::withoutGlobalScopes()->firstOrCreate(
                ['dahira_id' => $dahira->id, 'label' => $house['label']],
                array_merge($house, ['dahira_id' => $dahira->id])
            );
        }

        $this->command->info(count($houses) . ' foyers créés.');
    }
}
