<?php

namespace App\GraphQL\Mutations;

use App\Models\Dahira;
use App\Models\MemberCategory;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class DahiraMutation
{
    public function create(null $root, array $args): Dahira
    {
        $baseSlug = Str::slug($args['name']);
        $slug = $baseSlug;

        if (Dahira::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . Str::lower(Str::random(5));
        }

        $dahira = Dahira::create([
            'name'        => $args['name'],
            'slug'        => $slug,
            'city'        => $args['city'] ?? null,
            'country'     => $args['country'] ?? 'Sénégal',
            'phone'       => $args['phone'] ?? null,
            'email'       => $args['email'] ?? null,
            'description' => $args['description'] ?? null,
            'is_active'   => $args['is_active'] ?? true,
        ]);

        $admin = User::create([
            'name'      => $args['admin_name'],
            'email'     => $args['admin_email'],
            'password'  => Hash::make($args['admin_password']),
            'dahira_id' => $dahira->id,
        ]);

        $admin->assignRole('admin');

        // Catégories par défaut
        $defaultCategories = [
            ['name' => 'taalibe',    'label' => 'Taalibé',         'weekly_amount' => 500,  'color' => '#10b981', 'sort_order' => 1],
            ['name' => 'moussou',    'label' => 'Moussou (Dame)',   'weekly_amount' => 500,  'color' => '#f59e0b', 'sort_order' => 2],
            ['name' => 'etudiant',   'label' => 'Étudiant',         'weekly_amount' => 250,  'color' => '#3b82f6', 'sort_order' => 3],
            ['name' => 'bienfaiteur','label' => 'Bienfaiteur',      'weekly_amount' => 1000, 'color' => '#8b5cf6', 'sort_order' => 4],
        ];
        foreach ($defaultCategories as $cat) {
            MemberCategory::create([
                'dahira_id'     => $dahira->id,
                'name'          => $cat['name'],
                'label'         => $cat['label'],
                'weekly_amount' => $cat['weekly_amount'],
                'color'         => $cat['color'],
                'is_default'    => $cat['sort_order'] === 1,
                'sort_order'    => $cat['sort_order'],
            ]);
        }

        return [
            'dahira'         => $dahira,
            'admin_email'    => $args['admin_email'],
            'admin_password' => $args['admin_password'],
        ];
    }
}
