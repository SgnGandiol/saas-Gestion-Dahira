<?php

namespace Database\Seeders;

use App\Models\Dahira;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DahiraSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Créer le Dahira (comme register) ──────────────────────────
        $dahiraName = env('DAHIRA_NAME', 'Mafatihul Jinan');
        $baseSlug   = Str::slug($dahiraName);
        $slug       = Dahira::withTrashed()->where('slug', $baseSlug)->exists()
                        ? $baseSlug . '-' . Str::lower(Str::random(5))
                        : $baseSlug;

        $dahira = Dahira::firstOrCreate(
            ['slug' => $slug],
            [
                'name'        => $dahiraName,
                'slug'        => $slug,
                'city'        => env('DAHIRA_CITY', 'Thiès'),
                'country'     => 'SN',
                'phone'       => env('DAHIRA_PHONE', '+221 77 123 45 67'),
                'email'       => env('DAHIRA_EMAIL', 'contact@mafatihul-jinan.sn'),
                'description' => 'Dahira dédié à Serigne Touba.',
                'is_active'   => true,
            ]
        );

        $this->command->info("Dahira créé : {$dahira->name} (slug: {$dahira->slug})");

        // ── 2. Créer l'admin du Dahira (comme register) ───────────────────
        $email    = env('ADMIN_EMAIL', 'admin@mafatihul-jinan.sn');
        $password = env('ADMIN_PASSWORD', 'password123');
        $name     = env('ADMIN_NAME', 'Admin Dahira');

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'              => $name,
                'email'             => $email,
                'password'          => Hash::make($password),
                'dahira_id'         => $dahira->id,
                'email_verified_at' => now(),
            ]
        );

        $user->assignRole('admin');

        $this->command->info("Admin créé : {$email} / {$password}  →  dahira_id={$dahira->id}");
    }
}
