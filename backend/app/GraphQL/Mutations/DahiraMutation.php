<?php

namespace App\GraphQL\Mutations;

use App\Models\Dahira;
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

        // Génère un email admin si la dahira n'en a pas
        $adminEmail = $args['email'] ?? ('admin@' . $slug . '.sn');

        // Evite les doublons d'email
        if (User::where('email', $adminEmail)->exists()) {
            $adminEmail = 'admin+' . Str::lower(Str::random(5)) . '@' . $slug . '.sn';
        }

        $admin = User::create([
            'name'       => 'Admin ' . $dahira->name,
            'email'      => $adminEmail,
            'password'   => Hash::make('password123'),
            'dahira_id'  => $dahira->id,
        ]);

        $admin->assignRole('admin');

        return [
            'dahira'         => $dahira,
            'admin_email'    => $adminEmail,
            'admin_password' => 'password123',
        ];
    }
}
