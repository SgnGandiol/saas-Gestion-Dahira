<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Réinitialise le cache des permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crée les rôles du Dahira
        $roles = [
            'super_admin',   // accès total plateforme
            'admin',         // admin d'un Dahira
            'tresorier',     // gestion financière
            'secretaire',    // membres et familles
            'organisateur',  // rotations et assignations
            'membre',        // lecture seule
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->command->info('Rôles créés : ' . implode(', ', $roles));

        // Crée les utilisateurs
        $this->call(UserSeeder::class);
    }
}
