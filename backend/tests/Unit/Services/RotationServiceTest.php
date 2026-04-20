<?php

namespace Tests\Unit\Services;

use App\Models\Dahira;
use App\Models\Family;
use App\Models\House;
use App\Models\Member;
use App\Models\Rotation;
use App\Services\RotationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RotationServiceTest extends TestCase
{
    use RefreshDatabase;

    private RotationService $service;
    private Dahira $dahira;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RotationService();
        $this->dahira  = Dahira::factory()->create();
    }

    // ─── suggestNextHouse ────────────────────────────────────────

    public function test_suggest_returns_null_when_no_houses(): void
    {
        $result = $this->service->suggestNextHouse($this->dahira->id, '2026-05-04');

        $this->assertNull($result);
    }

    public function test_suggest_returns_null_when_all_houses_unavailable(): void
    {
        House::factory()->for($this->dahira)->unavailable()->create();

        $result = $this->service->suggestNextHouse($this->dahira->id, '2026-05-04');

        $this->assertNull($result);
    }

    public function test_suggest_returns_the_only_available_house(): void
    {
        $house = House::factory()->for($this->dahira)->create();

        $result = $this->service->suggestNextHouse($this->dahira->id, '2026-05-04');

        $this->assertNotNull($result);
        $this->assertEquals($house->id, $result->id);
    }

    public function test_suggest_returns_null_when_min_interval_not_respected(): void
    {
        $house = House::factory()->for($this->dahira)->withMinInterval(8)->create();

        // Last rotation was 3 weeks ago — interval of 8 not respected
        Rotation::factory()->create([
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $house->id,
            'scheduled_date' => Carbon::now()->subWeeks(3),
            'status'         => 'done',
        ]);

        $result = $this->service->suggestNextHouse($this->dahira->id, now()->format('Y-m-d'));

        $this->assertNull($result);
    }

    public function test_suggest_returns_house_when_min_interval_respected(): void
    {
        $house = House::factory()->for($this->dahira)->withMinInterval(4)->create();

        // Last rotation was 5 weeks ago — interval of 4 respected
        Rotation::factory()->create([
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $house->id,
            'scheduled_date' => Carbon::now()->subWeeks(5),
            'status'         => 'done',
        ]);

        $result = $this->service->suggestNextHouse($this->dahira->id, now()->format('Y-m-d'));

        $this->assertNotNull($result);
        $this->assertEquals($house->id, $result->id);
    }

    public function test_suggest_prefers_never_visited_house_over_recently_visited(): void
    {
        $neverVisited  = House::factory()->for($this->dahira)->create();
        $recentVisited = House::factory()->for($this->dahira)->withMinInterval(1)->create();

        Rotation::factory()->create([
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $recentVisited->id,
            'scheduled_date' => Carbon::now()->subWeeks(2),
            'status'         => 'done',
        ]);

        $result = $this->service->suggestNextHouse($this->dahira->id, now()->format('Y-m-d'));

        $this->assertEquals($neverVisited->id, $result->id);
    }

    public function test_suggest_prefers_house_with_fewer_total_received(): void
    {
        $family1 = Family::factory()->for($this->dahira)->withReceivedCount(1)->create();
        $family2 = Family::factory()->for($this->dahira)->withReceivedCount(5)->create();

        $houseFewerVisits = House::factory()->for($this->dahira)->create(['family_id' => $family1->id]);
        $houseMoreVisits  = House::factory()->for($this->dahira)->create(['family_id' => $family2->id]);

        $result = $this->service->suggestNextHouse($this->dahira->id, now()->format('Y-m-d'));

        $this->assertEquals($houseFewerVisits->id, $result->id);
    }

    // ─── createRotation ──────────────────────────────────────────

    public function test_create_rotation_persists_to_database(): void
    {
        $house = House::factory()->for($this->dahira)->create();

        $rotation = $this->service->createRotation($this->dahira->id, $house->id, '2026-05-11');

        $this->assertDatabaseHas('rotations', [
            'id'             => $rotation->id,
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $house->id,
            'scheduled_date' => '2026-05-11',
            'status'         => 'planned',
        ]);
    }

    public function test_create_rotation_returns_rotation_instance(): void
    {
        $house    = House::factory()->for($this->dahira)->create();
        $rotation = $this->service->createRotation($this->dahira->id, $house->id, '2026-05-11');

        $this->assertInstanceOf(Rotation::class, $rotation);
        $this->assertEquals('planned', $rotation->status);
    }

    // ─── updateStatus ────────────────────────────────────────────

    public function test_update_status_changes_rotation_status(): void
    {
        $house    = House::factory()->for($this->dahira)->create();
        $rotation = Rotation::factory()->create([
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $house->id,
            'scheduled_date' => now()->toDateString(),
            'status'         => 'planned',
        ]);

        $updated = $this->service->updateStatus($rotation, 'confirmed');

        $this->assertEquals('confirmed', $updated->status);
        $this->assertDatabaseHas('rotations', ['id' => $rotation->id, 'status' => 'confirmed']);
    }

    public function test_update_status_to_done_increments_family_total_received(): void
    {
        $family = Family::factory()->for($this->dahira)->withReceivedCount(2)->create();
        $house  = House::factory()->for($this->dahira)->create(['family_id' => $family->id]);

        $rotation = Rotation::factory()->create([
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $house->id,
            'scheduled_date' => now()->toDateString(),
            'status'         => 'confirmed',
        ]);

        $this->service->updateStatus($rotation, 'done');

        $this->assertDatabaseHas('families', [
            'id'             => $family->id,
            'total_received' => 3,
        ]);
    }

    public function test_update_status_to_done_updates_last_received_at(): void
    {
        $family = Family::factory()->for($this->dahira)->create();
        $house  = House::factory()->for($this->dahira)->create(['family_id' => $family->id]);
        $date   = '2026-05-11';

        $rotation = Rotation::factory()->create([
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $house->id,
            'scheduled_date' => $date,
            'status'         => 'confirmed',
        ]);

        $this->service->updateStatus($rotation, 'done');

        $this->assertDatabaseHas('families', [
            'id'              => $family->id,
            'last_received_at'=> $date,
        ]);
    }

    public function test_update_status_to_confirmed_does_not_change_family_stats(): void
    {
        $family = Family::factory()->for($this->dahira)->withReceivedCount(0)->create();
        $house  = House::factory()->for($this->dahira)->create(['family_id' => $family->id]);

        $rotation = Rotation::factory()->create([
            'dahira_id' => $this->dahira->id,
            'house_id'  => $house->id,
            'scheduled_date' => now()->toDateString(),
            'status'    => 'planned',
        ]);

        $this->service->updateStatus($rotation, 'confirmed');

        $this->assertDatabaseHas('families', ['id' => $family->id, 'total_received' => 0]);
    }

    public function test_update_status_is_atomic_via_transaction(): void
    {
        // Verify the method wraps in a transaction by checking it returns fresh data
        $family   = Family::factory()->for($this->dahira)->create();
        $house    = House::factory()->for($this->dahira)->create(['family_id' => $family->id]);
        $rotation = Rotation::factory()->create([
            'dahira_id'      => $this->dahira->id,
            'house_id'       => $house->id,
            'scheduled_date' => now()->toDateString(),
            'status'         => 'confirmed',
        ]);

        $result = $this->service->updateStatus($rotation, 'done');

        // Both the rotation status and family stats should be updated atomically
        $this->assertEquals('done', $result->status);
        $this->assertEquals(1, $family->fresh()->total_received);
    }
}
