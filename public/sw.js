// BudgetLens Service Worker — v5 Smart Auto-Discovery Cache
// ─────────────────────────────────────────────────────────────────────────────
// Automatically parses index.html on install to find and pre-cache all compiled
// Vite JS & CSS bundle assets upfront so the PWA is 100% functional offline.

const CACHE_NAME = 'budgetlens-v5';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.jpg',
];

// ─── Install: Pre-cache App Shell AND Auto-Discover Vite Bundle Assets ───────
self.addEventListener('install', (event) => {
  console.log('[BudgetLens SW] Installing cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Pre-cache explicit shell assets
      await cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[BudgetLens SW] Basic shell pre-cache warning:', err);
      });

      // 2. Fetch index.html, parse all JS & CSS bundle URLs, and pre-cache them upfront!
      try {
        const response = await fetch('/index.html');
        if (response.ok) {
          const html = await response.text();
          // Extract src="/assets/..." and href="/assets/..."
          const matches = html.match(/(?:src|href)=["'](\/assets\/[^"']+)["']/g) || [];
          const assets = Array.from(
            new Set(matches.map((m) => m.replace(/^(?:src|href)=["']/, '').replace(/["']$/, '')))
          );
          if (assets.length > 0) {
            console.log('[BudgetLens SW] Auto-caching Vite bundle assets for offline use:', assets);
            await cache.addAll(assets);
          }
        }
      } catch (err) {
        console.warn('[BudgetLens SW] Could not pre-fetch bundle assets during SW install:', err);
      }
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// ─── Activate: Purge older cache versions ────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[BudgetLens SW] Activating:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log('[BudgetLens SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  // Control all open clients immediately
  self.clients.claim();
});

// ─── Fetch: Cache-First with Stale-While-Revalidate Background Refresh ───────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from our own origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  const isNavigation = request.mode === 'navigate';

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      // 1. IF CACHED: Return cached response immediately for instant offline load!
      if (cachedResponse) {
        // Background refresh when online
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
              cache.put(request, networkResponse.clone());
            }
          })
          .catch(() => {
            /* Silent catch when offline */
          });
        return cachedResponse;
      }

      // 2. IF NOT CACHED: Try fetching from network
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // 3. OFFLINE FALLBACKS if network failed and asset wasn't cached:

        // Navigation fallback: return cached SPA shell (/index.html)
        if (isNavigation) {
          const fallbackHtml = (await cache.match('/index.html')) || (await cache.match('/'));
          if (fallbackHtml) return fallbackHtml;
        }

        // JS/CSS fallback: if exact asset missing, find any cached .js or .css asset
        if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
          const keys = await cache.keys();
          const ext = url.pathname.endsWith('.js') ? '.js' : '.css';
          const matchedKey = keys.find((req) => new URL(req.url).pathname.endsWith(ext));
          if (matchedKey) {
            const fallbackAsset = await cache.match(matchedKey);
            if (fallbackAsset) return fallbackAsset;
          }
        }

        return new Response('Offline - Asset unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    })
  );
});
