<?php

namespace App\Http\Middleware;

use App\Models\Dahira;
use App\Services\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantMiddleware
{
    public function __construct(private readonly TenantManager $manager) {}

    public function handle(Request $request, Closure $next): Response
    {
        $dahira = $this->resolveFromSubdomain($request)
            ?? $this->resolveFromHeader($request);

        if ($dahira) {
            $this->manager->set($dahira);
        }

        return $next($request);
    }

    /**
     * Resolve tenant from subdomain: touba-dakar.sgd.sn → slug = touba-dakar
     */
    private function resolveFromSubdomain(Request $request): ?Dahira
    {
        $host  = $request->getHost();
        $parts = explode('.', $host);

        if (count($parts) < 3) {
            return null;
        }

        // Normalize to lowercase (DNS is case-insensitive)
        $slug = Str::lower($parts[0]);

        // Ignore common non-tenant subdomains
        if (in_array($slug, ['www', 'api', 'app', 'admin', 'localhost'], true)) {
            return null;
        }

        // Reject slugs with invalid format (prevent injection)
        if (! preg_match('/^[a-z0-9\-]+$/', $slug)) {
            return null;
        }

        return $this->findActiveTenant('slug', $slug);
    }

    /**
     * Resolve tenant from X-Tenant-ID (numeric) or X-Tenant-Slug header.
     */
    private function resolveFromHeader(Request $request): ?Dahira
    {
        if ($rawId = $request->header('X-Tenant-ID')) {
            // Reject non-numeric or non-positive values
            if (! ctype_digit((string) $rawId) || (int) $rawId <= 0) {
                return null;
            }
            return $this->findActiveTenant('id', (int) $rawId);
        }

        if ($slug = $request->header('X-Tenant-Slug')) {
            $slug = Str::lower(trim($slug));
            if (! preg_match('/^[a-z0-9\-]+$/', $slug)) {
                return null;
            }
            return $this->findActiveTenant('slug', $slug);
        }

        return null;
    }

    private function findActiveTenant(string $column, mixed $value): ?Dahira
    {
        // withoutTrashed() ensures soft-deleted dahiras are excluded
        return Dahira::withoutTrashed()
            ->where($column, $value)
            ->where('is_active', true)
            ->first();
    }
}
