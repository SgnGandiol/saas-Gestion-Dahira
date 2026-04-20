<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Récupère ou crée le rôle super_admin avec l'ID 1
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['guard_name' => 'web']
        );

        // S'assure que c'est l'ID 1 (si c'est une nouvelle création)
        if ($superAdminRole->id !== 1 && !Role::where('id', 1)->exists()) {
            $superAdminRole->id = 1;
            $superAdminRole->save();
        }

        $email = env('SUPER_ADMIN_EMAIL', $this->command->ask('Email du super admin ?', 'admin@sgd.sn'));
        $password = env('SUPER_ADMIN_PASSWORD', $this->command->secret('Mot de passe du super admin ?'));
        $name = env('SUPER_ADMIN_NAME', 'Super Admin');

        if (empty($password)) {
            $this->command->error('Le mot de passe est requis.');
            return;
        }

        $superAdmin = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        $superAdmin->assignRole($superAdminRole);

        $this->command->info('Super Admin créé : ' . $email . ' (Role ID: ' . $superAdminRole->id . ')');
    }
}
