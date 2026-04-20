<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\ResolveTenantMiddleware;
use App\Models\Dahira;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ResolveTenantMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private TenantManager $manager;
    private ResolveTenantMiddleware $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager    = app(TenantManager::class);
        $this->middleware = new ResolveTenantMiddleware($this->manager);
    }

    private function fakeNext(): \Closure
    {
        return fn (Request $req) => new Response('ok');
    }

    // ─── Subdomain resolution ────────────────────────────────────

    public function test_resolves_tenant_from_subdomain(): void
    {
        $dahira = Dahira::factory()->create(['slug' => 'touba-dakar']);

        $request = Request::create('http://touba-dakar.sgd.sn/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertTrue($this->manager->resolved());
        $this->assertEquals($dahira->id, $this->manager->id());
    }

    public function test_subdomain_is_lowercased_before_lookup(): void
    {
        $dahira = Dahira::factory()->create(['slug' => 'myslug']);

        // Uppercase subdomain — must still match
        $request = Request::create('http://MYSLUG.sgd.sn/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertTrue($this->manager->resolved());
        $this->assertEquals($dahira->id, $this->manager->id());
    }

    public function test_ignores_www_subdomain(): void
    {
        Dahira::factory()->create(['slug' => 'www']);

        $request = Request::create('http://www.sgd.sn/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_ignores_api_subdomain(): void
    {
        $request = Request::create('http://api.sgd.sn/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_ignores_host_without_subdomain(): void
    {
        $request = Request::create('http://sgd.sn/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_does_not_resolve_inactive_tenant_via_subdomain(): void
    {
        Dahira::factory()->inactive()->create(['slug' => 'inactive-dahira']);

        $request = Request::create('http://inactive-dahira.sgd.sn/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_does_not_resolve_soft_deleted_tenant_via_subdomain(): void
    {
        $dahira = Dahira::factory()->create(['slug' => 'deleted-dahira']);
        $dahira->delete();

        $request = Request::create('http://deleted-dahira.sgd.sn/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    // ─── Header resolution ───────────────────────────────────────

    public function test_resolves_tenant_from_x_tenant_id_header(): void
    {
        $dahira  = Dahira::factory()->create();
        $request = Request::create('/graphql', 'POST', [], [], [], [
            'HTTP_X_TENANT_ID' => (string) $dahira->id,
        ]);

        $this->middleware->handle($request, $this->fakeNext());

        $this->assertTrue($this->manager->resolved());
        $this->assertEquals($dahira->id, $this->manager->id());
    }

    public function test_resolves_tenant_from_x_tenant_slug_header(): void
    {
        $dahira  = Dahira::factory()->create(['slug' => 'header-slug']);
        $request = Request::create('/graphql', 'POST', [], [], [], [
            'HTTP_X_TENANT_SLUG' => 'header-slug',
        ]);

        $this->middleware->handle($request, $this->fakeNext());

        $this->assertTrue($this->manager->resolved());
        $this->assertEquals($dahira->id, $this->manager->id());
    }

    public function test_ignores_non_numeric_x_tenant_id(): void
    {
        $request = Request::create('/graphql', 'POST', [], [], [], [
            'HTTP_X_TENANT_ID' => 'not-a-number',
        ]);

        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_ignores_zero_x_tenant_id(): void
    {
        $request = Request::create('/graphql', 'POST', [], [], [], [
            'HTTP_X_TENANT_ID' => '0',
        ]);

        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_ignores_negative_x_tenant_id(): void
    {
        $request = Request::create('/graphql', 'POST', [], [], [], [
            'HTTP_X_TENANT_ID' => '-5',
        ]);

        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_does_not_resolve_inactive_tenant_via_header(): void
    {
        $dahira  = Dahira::factory()->inactive()->create();
        $request = Request::create('/graphql', 'POST', [], [], [], [
            'HTTP_X_TENANT_ID' => (string) $dahira->id,
        ]);

        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_x_tenant_slug_is_lowercased(): void
    {
        $dahira  = Dahira::factory()->create(['slug' => 'myslug']);
        $request = Request::create('/graphql', 'POST', [], [], [], [
            'HTTP_X_TENANT_SLUG' => 'MYSLUG',
        ]);

        $this->middleware->handle($request, $this->fakeNext());

        $this->assertTrue($this->manager->resolved());
        $this->assertEquals($dahira->id, $this->manager->id());
    }

    // ─── No tenant ───────────────────────────────────────────────

    public function test_manager_not_resolved_when_no_headers_and_no_subdomain(): void
    {
        $request = Request::create('http://localhost:3000/graphql');
        $this->middleware->handle($request, $this->fakeNext());

        $this->assertFalse($this->manager->resolved());
    }

    public function test_next_middleware_is_always_called(): void
    {
        $called  = false;
        $request = Request::create('/graphql');

        $this->middleware->handle($request, function () use (&$called) {
            $called = true;
            return new Response('ok');
        });

        $this->assertTrue($called);
    }
}
