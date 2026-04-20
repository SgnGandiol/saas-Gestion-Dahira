<?php

namespace Tests\Feature;

use App\Models\Contribution;
use App\Models\Dahira;
use App\Models\Expense;
use App\Models\Family;
use App\Models\House;
use App\Models\Member;
use App\Models\Rotation;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Dahira $dahiraA;
    private Dahira $dahiraB;
    private User   $adminA;
    private User   $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin',       'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'super_admin',  'guard_name' => 'web']);

        $this->dahiraA = Dahira::factory()->create(['name' => 'Dahira A']);
        $this->dahiraB = Dahira::factory()->create(['name' => 'Dahira B']);

        $this->adminA  = User::factory()->create(['dahira_id' => $this->dahiraA->id, 'password' => Hash::make('secret')]);
        $this->adminA->assignRole('admin');

        $this->adminB  = User::factory()->create(['dahira_id' => $this->dahiraB->id, 'password' => Hash::make('secret')]);
        $this->adminB->assignRole('admin');

        Member::factory()->create(['dahira_id' => $this->dahiraA->id, 'first_name' => 'Moussa',  'last_name' => 'Diallo']);
        Member::factory()->create(['dahira_id' => $this->dahiraA->id, 'first_name' => 'Aminata', 'last_name' => 'Diallo']);
        Member::factory()->create(['dahira_id' => $this->dahiraB->id, 'first_name' => 'Fatou',   'last_name' => 'Ndiaye']);
    }

    // ─── Member isolation ────────────────────────────────────────

    public function test_admin_a_sees_only_dahira_a_members(): void
    {
        $this->actingAs($this->adminA);

        $members = Member::all();

        $this->assertCount(2, $members);
        $this->assertTrue($members->every(fn ($m) => $m->dahira_id === $this->dahiraA->id));
    }

    public function test_admin_b_sees_only_dahira_b_members(): void
    {
        $this->actingAs($this->adminB);

        $members = Member::all();

        $this->assertCount(1, $members);
        $this->assertEquals('Fatou', $members->first()->first_name);
    }

    public function test_admin_a_cannot_read_dahira_b_member_by_id(): void
    {
        $this->actingAs($this->adminA);

        $foreignMember = Member::withoutGlobalScopes()->where('first_name', 'Fatou')->first();

        // TenantScope makes it invisible via direct lookup
        $result = Member::find($foreignMember->id);

        $this->assertNull($result);
    }

    // ─── Super admin bypass ──────────────────────────────────────

    public function test_super_admin_sees_all_members(): void
    {
        $superAdmin = User::factory()->create(['dahira_id' => null]);
        $superAdmin->assignRole('super_admin');
        $this->actingAs($superAdmin);

        $this->assertEquals(3, Member::count());
    }

    // ─── Cross-model isolation ───────────────────────────────────

    public function test_family_isolation_by_dahira(): void
    {
        Family::factory()->create(['dahira_id' => $this->dahiraA->id, 'name' => 'Family A1']);
        Family::factory()->create(['dahira_id' => $this->dahiraB->id, 'name' => 'Family B1']);

        $this->actingAs($this->adminA);

        $families = Family::all();

        $this->assertCount(1, $families);
        $this->assertEquals('Family A1', $families->first()->name);
    }

    public function test_house_isolation_by_dahira(): void
    {
        $familyA = Family::factory()->create(['dahira_id' => $this->dahiraA->id]);
        $familyB = Family::factory()->create(['dahira_id' => $this->dahiraB->id]);

        House::factory()->create(['dahira_id' => $this->dahiraA->id, 'family_id' => $familyA->id]);
        House::factory()->create(['dahira_id' => $this->dahiraB->id, 'family_id' => $familyB->id]);

        $this->actingAs($this->adminA);

        $this->assertEquals(1, House::count());
    }

    public function test_contribution_isolation_by_dahira(): void
    {
        $memberA = Member::withoutGlobalScopes()->where('dahira_id', $this->dahiraA->id)->first();
        $memberB = Member::withoutGlobalScopes()->where('dahira_id', $this->dahiraB->id)->first();

        Contribution::factory()->create(['dahira_id' => $this->dahiraA->id, 'member_id' => $memberA->id, 'amount' => 5000, 'paid_at' => now(), 'type' => 'cotisation', 'status' => 'paid']);
        Contribution::factory()->create(['dahira_id' => $this->dahiraB->id, 'member_id' => $memberB->id, 'amount' => 8000, 'paid_at' => now(), 'type' => 'cotisation', 'status' => 'paid']);

        $this->actingAs($this->adminA);

        $contributions = Contribution::all();

        $this->assertCount(1, $contributions);
        $this->assertEquals(5000, $contributions->first()->amount);
    }

    public function test_expense_isolation_by_dahira(): void
    {
        Expense::factory()->create(['dahira_id' => $this->dahiraA->id, 'label' => 'Expense A', 'amount' => 1000, 'spent_at' => now()]);
        Expense::factory()->create(['dahira_id' => $this->dahiraB->id, 'label' => 'Expense B', 'amount' => 2000, 'spent_at' => now()]);

        $this->actingAs($this->adminA);

        $expenses = Expense::all();

        $this->assertCount(1, $expenses);
        $this->assertEquals('Expense A', $expenses->first()->label);
    }

    // ─── TenantManager direct set ────────────────────────────────

    public function test_tenant_manager_set_overrides_auth_user_dahira(): void
    {
        /** @var TenantManager $manager */
        $manager = app(TenantManager::class);
        $manager->set($this->dahiraB);

        // Even if we act as adminA, the manager is set to dahiraB
        $this->actingAs($this->adminA);

        // Manager was set first, so it takes precedence
        $this->assertEquals($this->dahiraB->id, $manager->id());
    }

    // ─── GraphQL queries ─────────────────────────────────────────

    public function test_graphql_members_query_returns_only_current_tenant_members(): void
    {
        $token = $this->adminA->createToken('test')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->postJson('/graphql', [
                'query' => "query {
                    members(dahira_id: \"{$this->dahiraA->id}\", first: 50) {
                        data { id first_name }
                        paginatorInfo { total }
                    }
                }",
            ]);

        $response->assertOk();
        $this->assertEquals(2, $response->json('data.members.paginatorInfo.total'));

        $names = collect($response->json('data.members.data'))->pluck('first_name');
        $this->assertContains('Moussa', $names);
        $this->assertContains('Aminata', $names);
        $this->assertNotContains('Fatou', $names);
    }

    public function test_graphql_members_query_rejects_cross_tenant_dahira_id(): void
    {
        // adminA tries to query dahiraB members
        $token = $this->adminA->createToken('test')->plainTextToken;

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->postJson('/graphql', [
                'query' => "query {
                    members(dahira_id: \"{$this->dahiraB->id}\", first: 50) {
                        data { id first_name }
                        paginatorInfo { total }
                    }
                }",
            ]);

        $response->assertOk();
        // TenantScope filters out dahiraB's members — result should be 0
        $this->assertEquals(0, $response->json('data.members.paginatorInfo.total'));
    }
}
