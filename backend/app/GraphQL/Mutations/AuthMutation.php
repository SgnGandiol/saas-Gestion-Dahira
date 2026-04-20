<?php

namespace App\GraphQL\Mutations;

use App\Models\Dahira;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AuthMutation
{
    /**
     * Connexion — retourne un token Sanctum + l'utilisateur.
     */
    public function login(null $root, array $args): array
    {
        $user = User::where('email', $args['email'])->first();

        // Always run Hash::check to avoid timing attacks (constant-time comparison)
        $passwordValid = Hash::check(
            $args['password'],
            $user?->password ?? Hash::make('dummy-constant-time')
        );

        if (! $user || ! $passwordValid) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        // Révoque les anciens tokens (session unique)
        $user->tokens()->delete();

        $token = $user->createToken('sgd-token')->plainTextToken;

        return ['token' => $token, 'user' => $user];
    }

    /**
     * Inscription du premier admin d'un Dahira.
     */
    public function register(null $root, array $args): array
    {
        $baseSlug = Str::slug($args['dahira_name']);

        // Ensure unique slug — append random suffix if collision
        $slug = $baseSlug;
        if (Dahira::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . Str::lower(Str::random(5));
        }

        $dahira = Dahira::create([
            'name' => $args['dahira_name'],
            'slug' => $slug,
            'city' => $args['city'] ?? null,
        ]);

        $user = User::create([
            'name'      => $args['name'],
            'email'     => $args['email'],
            'password'  => Hash::make($args['password']),
            'dahira_id' => $dahira->id,
        ]);

        $user->assignRole('admin');

        $token = $user->createToken('sgd-token')->plainTextToken;

        return ['token' => $token, 'user' => $user];
    }

    /**
     * Déconnexion — révoque le token courant.
     */
    public function logout(null $root, array $args, array $context): bool
    {
        /** @var User $user */
        $user = $context['user'] ?? Auth::user();

        if (! $user) {
            throw new AuthenticationException();
        }

        // Null-safe — token may already be revoked
        $user->currentAccessToken()?->delete();

        return true;
    }
}
