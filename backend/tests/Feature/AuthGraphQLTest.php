<?php

namespace Tests\Feature;

use App\Models\Dahira;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthGraphQLTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin',       'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'super_admin',  'guard_name' => 'web']);
    }

    // ─── Login ───────────────────────────────────────────────────

    public function test_login_returns_token_and_user(): void
    {
        $dahira = Dahira::factory()->create(['name' => 'Dahira Test']);
        $user   = User::factory()->create([
            'email'     => 'admin@test.sn',
            'password'  => Hash::make('password123'),
            'dahira_id' => $dahira->id,
        ]);
        $user->assignRole('admin');

        $response = $this->graphQL('
            mutation {
                login(email: "admin@test.sn", password: "password123") {
                    token
                    user { id name email dahira { id name } }
                }
            }
        ');

        $response->assertJsonPath('data.login.user.email', 'admin@test.sn');
        $response->assertJsonPath('data.login.user.dahira.name', 'Dahira Test');
        $this->assertNotEmpty($response->json('data.login.token'));
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'user@test.sn', 'password' => Hash::make('correct')]);

        $response = $this->graphQL('
            mutation { login(email: "user@test.sn", password: "wrong") { token } }
        ');

        $response->assertJsonFragment(['message' => 'Les identifiants sont incorrects.']);
        $this->assertNull($response->json('data.login'));
    }

    public function test_login_fails_with_unknown_email(): void
    {
        $response = $this->graphQL('
            mutation { login(email: "nobody@test.sn", password: "any") { token } }
        ');

        $response->assertJsonFragment(['message' => 'Les identifiants sont incorrects.']);
    }

    public function test_login_clears_previous_tokens(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret')]);

        // Create an old token
        $user->createToken('old-token');
        $this->assertEquals(1, $user->tokens()->count());

        $this->graphQL("
            mutation { login(email: \"{$user->email}\", password: \"secret\") { token } }
        ");

        // Only the new token should remain
        $this->assertEquals(1, $user->fresh()->tokens()->count());
    }

    // ─── Register ────────────────────────────────────────────────

    public function test_register_creates_dahira_and_admin_user(): void
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $response = $this->graphQL('
            mutation {
                register(
                    name: "Serigne Modou"
                    email: "serigne@dahira.sn"
                    password: "password123"
                    dahira_name: "Touba Dakar"
                    city: "Dakar"
                ) {
                    token
                    user { name email dahira { name city } }
                }
            }
        ');

        $response->assertJsonPath('data.register.user.email', 'serigne@dahira.sn');
        $response->assertJsonPath('data.register.user.dahira.name', 'Touba Dakar');
        $response->assertJsonPath('data.register.user.dahira.city', 'Dakar');
        $this->assertNotEmpty($response->json('data.register.token'));

        $this->assertDatabaseHas('dahiras', ['name' => 'Touba Dakar', 'city' => 'Dakar']);
        $this->assertDatabaseHas('users', ['email' => 'serigne@dahira.sn']);
    }

    public function test_register_assigns_admin_role(): void
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->graphQL('
            mutation {
                register(name: "Admin" email: "a@b.sn" password: "password123" dahira_name: "My Dahira") {
                    user { name }
                }
            }
        ');

        $user = User::where('email', 'a@b.sn')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('admin'));
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@test.sn']);

        $response = $this->graphQL('
            mutation {
                register(name: "X" email: "existing@test.sn" password: "password123" dahira_name: "New Dahira") {
                    token
                }
            }
        ');

        // Lighthouse validation should reject duplicate email
        $this->assertNotNull($response->json('errors'));
        $this->assertNull($response->json('data.register'));
    }

    public function test_register_handles_slug_collision_gracefully(): void
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        // Create existing dahira with same name/slug
        Dahira::factory()->create(['name' => 'Touba Paris', 'slug' => 'touba-paris']);

        $response = $this->graphQL('
            mutation {
                register(
                    name: "New Admin"
                    email: "new@dahira.sn"
                    password: "password123"
                    dahira_name: "Touba Paris"
                ) {
                    token
                    user { dahira { name } }
                }
            }
        ');

        // Should succeed with a unique slug
        $this->assertNull($response->json('errors'));
        $this->assertNotEmpty($response->json('data.register.token'));

        // Both dahiras should exist (different slugs)
        $this->assertEquals(2, Dahira::where('name', 'Touba Paris')->count());
    }

    // ─── Logout ──────────────────────────────────────────────────

    public function test_logout_invalidates_token(): void
    {
        $user  = User::factory()->create(['password' => Hash::make('pass')]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->graphQL('mutation { logout }');

        $response->assertJsonPath('data.logout', true);
        $this->assertEquals(0, $user->fresh()->tokens()->count());
    }

    public function test_unauthenticated_user_cannot_access_protected_query(): void
    {
        $response = $this->graphQL('query { me { id name } }');

        $this->assertNotNull($response->json('errors'));
    }

    // ─── Helper ──────────────────────────────────────────────────

    private function graphQL(string $query): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/graphql', ['query' => $query]);
    }
}
