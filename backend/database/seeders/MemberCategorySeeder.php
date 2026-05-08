<?php

namespace Database\Seeders;

use App\Models\Dahira;
use App\Models\MemberCategory;
use Illuminate\Database\Seeder;

class MemberCategorySeeder extends Seeder
{
    public function run(): void
    {
        $dahira = Dahira::first();

        if (! $dahira) {
            $this->command->warn('Aucun Dahira trouvé. Lancez DahiraSeeder d\'abord.');
            return;
        }

        $categories = [
            [
                'name'          => 'taalibe',
                'label'         => 'Taalibé',
                'weekly_amount' => 500,
                'color'         => '#10b981',
                'is_default'    => true,
                'sort_order'    => 1,
            ],
            [
                'name'          => 'moussou',
                'label'         => 'Moussou (Dame)',
                'weekly_amount' => 500,
                'color'         => '#f59e0b',
                'is_default'    => false,
                'sort_order'    => 2,
            ],
            [
                'name'          => 'etudiant',
                'label'         => 'Étudiant',
                'weekly_amount' => 250,
                'color'         => '#3b82f6',
                'is_default'    => false,
                'sort_order'    => 3,
            ],
            [
                'name'          => 'bienfaiteur',
                'label'         => 'Bienfaiteur',
                'weekly_amount' => 1000,
                'color'         => '#8b5cf6',
                'is_default'    => false,
                'sort_order'    => 4,
            ],
        ];

        foreach ($categories as $cat) {
            MemberCategory::firstOrCreate(
                ['dahira_id' => $dahira->id, 'name' => $cat['name']],
                array_merge($cat, ['dahira_id' => $dahira->id])
            );
        }

        $this->command->info('Catégories de membres créées.');
    }
}
