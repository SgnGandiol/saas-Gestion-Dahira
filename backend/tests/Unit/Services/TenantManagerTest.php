<?php

namespace Tests\Unit\Services;

use App\Models\Dahira;
use App\Services\TenantManager;
use Tests\TestCase;

class TenantManagerTest extends TestCase
{
    private TenantManager $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager = new TenantManager();
    }

    public function test_resolved_is_false_initially(): void
    {
        $this->assertFalse($this->manager->resolved());
    }

    public function test_id_returns_null_when_no_tenant_set(): void
    {
        $this->assertNull($this->manager->id());
    }

    public function test_get_returns_null_when_no_tenant_set(): void
    {
        $this->assertNull($this->manager->get());
    }

    public function test_set_stores_tenant(): void
    {
        $dahira = new Dahira(['id' => 42, 'name' => 'Test', 'slug' => 'test']);
        $dahira->id = 42;

        $this->manager->set($dahira);

        $this->assertTrue($this->manager->resolved());
        $this->assertSame($dahira, $this->manager->get());
        $this->assertEquals(42, $this->manager->id());
    }

    public function test_clear_removes_tenant(): void
    {
        $dahira = new Dahira(['id' => 1, 'name' => 'Test', 'slug' => 'test']);
        $dahira->id = 1;
        $this->manager->set($dahira);

        $this->manager->clear();

        $this->assertFalse($this->manager->resolved());
        $this->assertNull($this->manager->get());
        $this->assertNull($this->manager->id());
    }

    public function test_set_can_be_called_multiple_times_and_overwrites(): void
    {
        $d1 = new Dahira(); $d1->id = 1;
        $d2 = new Dahira(); $d2->id = 2;

        $this->manager->set($d1);
        $this->manager->set($d2);

        $this->assertEquals(2, $this->manager->id());
        $this->assertSame($d2, $this->manager->get());
    }
}
