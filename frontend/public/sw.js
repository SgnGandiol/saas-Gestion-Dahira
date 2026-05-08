const CACHE_STATIC = 'sgd-static-v1'
const CACHE_PAGES  = 'sgd-pages-v1'

const PRECACHE_URLS = [
  '/dashboard',
  '/dashboard/members',
  '/dashboard/rotations',
  '/dashboard/finance',
  '/dashboard/maisons',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/manifest.json',
]

// ── Install : mise en cache initiale ──────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_PAGES).then(cache =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  )
})

// ── Activate : supprime les anciens caches ────────────────────
self.addEventListener('activate', event => {
  const VALID = [CACHE_STATIC, CACHE_PAGES]
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !VALID.includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ── Fetch : stratégie par type de ressource ───────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore les requêtes non-GET et cross-origin
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // GraphQL / API → réseau uniquement (données temps-réel)
  if (url.pathname.startsWith('/graphql') || url.pathname.startsWith('/api/')) return

  // Assets statiques Next.js (_next/static/) → cache-first immuable
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_STATIC).then(c => c.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Pages / navigation → stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_PAGES).then(async cache => {
      const cached = await cache.match(request)
      const fetchPromise = fetch(request)
        .then(response => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(() => cached)
      return cached ?? fetchPromise
    })
  )
})
