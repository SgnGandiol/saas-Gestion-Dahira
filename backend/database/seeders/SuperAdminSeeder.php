<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $name     = env('SUPER_ADMIN_NAME',     'Super Admin');
        $email    = env('SUPER_ADMIN_EMAIL',    'superadmin@sgd.sn');
        $password = env('SUPER_ADMIN_PASSWORD', 'password123');

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'               => $name,
                'password'           => Hash::make($password),
                'dahira_id'          => null,
                'email_verified_at'  => now(),
            ]
        );

        $user->assignRole('super_admin');

        $this->command->info("Super admin : {$email} / {$password}");
    }
}
