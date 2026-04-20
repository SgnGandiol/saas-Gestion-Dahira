<?php

namespace Tests\Unit\Scopes;

use App\Models\Dahira;
use App\Models\Member;
use App\Models\Scopes\TenantScope;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin',       'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'super_admin',  'guard_name' => 'web']);
    }

    public function test_scope_filters_members_by_authenticated_user_dahira(): void
    {
        $dahiraA = Dahira::factory()->create();
        $dahiraB = Dahira::factory()->create();

        Member::factory()->create(['dahira_id' => $dahiraA->id, 'first_name' => 'Alpha']);
        Member::factory()->create(['dahira_id' => $dahiraB->id, 'first_name' => 'Beta']);

        $user = User::factory()->create(['dahira_id' => $dahiraA->id]);
        $user->assignRole('admin');
        $this->actingAs($user);

        $members = Member::all();

        $this->assertCount(1, $members);
        $this->assertEquals('Alpha', $members->first()->first_name);
    }

    public function test_super_admin_sees_all_members(): void
    {
        $dahiraA = Dahira::factory()->create();
        $dahiraB = Dahira::factory()->create();

        Member::factory()->create(['dahira_id' => $dahiraA->id]);
        Member::factory()->create(['dahira_id' => $dahiraB->id]);

        $superAdmin = User::factory()->create(['dahira_id' => null]);
        $superAdmin->assignRole('super_admin');
        $this->actingAs($superAdmin);

        $this->assertEquals(2, Member::count());
    }

    public function test_scope_applied_via_tenant_manager_singleton(): void
    {
        $dahiraA = Dahira::factory()->create();
        $dahiraB = Dahira::factory()->create();

        Member::factory()->create(['dahira_id' => $dahiraA->id, 'first_name' => 'Gamma']);
        Member::factory()->create(['dahira_id' => $dahiraB->id, 'first_name' => 'Delta']);

        /** @var TenantManager $manager */
        $manager = app(TenantManager::class);
        $manager->set($dahiraA);

        $members = Member::all();

        $this->assertCount(1, $members);
        $this->assertEquals('Gamma', $members->first()->first_name);
    }

    public function test_without_global_scope_returns_all_records(): void
    {
        $dahiraA = Dahira::factory()->create();
        $dahiraB = Dahira::factory()->create();

        Member::factory()->create(['dahira_id' => $dahiraA->id]);
        Member::factory()->create(['dahira_id' => $dahiraB->id]);

        $user = User::factory()->create(['dahira_id' => $dahiraA->id]);
        $this->actingAs($user);

        $count = Member::withoutGlobalScope(TenantScope::class)->count();

        $this->assertEquals(2, $count);
    }

    public function test_user_with_null_dahira_id_does_not_crash(): void
    {
        $user = User::factory()->create(['dahira_id' => null]);
        $user->assignRole('admin');
        $this->actingAs($user);

        // Should not throw — just return empty collection
        $members = Member::all();

        $this->assertEmpty($members);
    }
}
