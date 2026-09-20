// BudgetLens Service Worker — Robust cache strategy with auto-busting
// Cache name includes a build timestamp injected at build time (falls back to a date string)
const BUILD_DATE = '__BUILD_DATE__'; // Replaced by build tooling, or use Date fallback
const CACHE_VERSION = (BUILD_DATE === '__BUILD_DATE__') ? new Date().toISOString().split('T')[0] : BUILD_DATE;
const CACHE_NAME = `budgetlens-${CACHE_VERSION}`;

// App shell assets — these are cache-first (rarely change between visits)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.jpg',
  '/icon-192.png'
];

// ─── Install: pre-cache shell only ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        // Non-fatal: if some assets fail to cache, still install
      });
    })
  );
  // Activate immediately — don't wait for old SW to die
  self.skipWaiting();
});

// ─── Activate: delete ALL old caches to guarantee fresh assets ───────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('[BudgetLens SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  // Immediately control all open tabs — no reload needed
  self.clients.claim();
});

// ─── Fetch: dual strategy ─────────────────────────────────────────────────────
// • JS / CSS bundles  → network-first  (ensures friends always get latest assets)
// • Everything else   → cache-first    (fast shell loads)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  const isAssetBundle = url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.mjs');

  if (isAssetBundle) {
    // ── Network-first for JS/CSS bundles ──
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
  } else {
    // ── Cache-first for shell assets ──
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});
