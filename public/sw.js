// BudgetLens Service Worker — v4 Stable Cache (Fixed version, cache-first, offline-safe)
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Do NOT use dynamic dates as cache version — it wipes the cache on
// every new day, causing blank screens on PWA reopen. Use a fixed version string.
// Bump this manually when you deploy a new build (e.g. v5, v6...).
const CACHE_NAME = 'budgetlens-v4';

// The app shell — everything the browser needs to render the dashboard offline
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.jpg',
];

// ─── Install: pre-cache app shell & immediately activate ─────────────────────
self.addEventListener('install', (event) => {
  console.log('[BudgetLens SW] Installing cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll is atomic — if any fail we still install (graceful)
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[BudgetLens SW] Pre-cache partial failure (non-fatal):', err);
      });
    })
  );
  // Activate ASAP — don't wait for old tabs to close
  self.skipWaiting();
});

// ─── Activate: prune ALL stale old caches ─────────────────────────────────────
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
  // Take control of all open clients immediately
  self.clients.claim();
});

// ─── Fetch: Stale-While-Revalidate (SWR) strategy ────────────────────────────
// • Always respond from cache immediately if available (ensures instant load even offline)
// • Simultaneously fetch from network to refresh the cache in the background
// • If nothing cached AND network fails → for navigation, return index.html (SPA fallback)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from our own origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // Navigation requests (page loads) — always serve index.html from cache as fallback
  const isNavigation = request.mode === 'navigate';

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cachedResponse) => {
        // Kick off a background network fetch to refresh cache
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed — return cached version if available
            if (cachedResponse) return cachedResponse;
            // Last resort for navigation: serve index.html from cache (SPA shell)
            if (isNavigation) {
              return cache.match('/index.html');
            }
            return new Response('', { status: 408, statusText: 'Offline' });
          });

        // Return cached immediately (SWR), or wait for network if nothing cached yet
        return cachedResponse || networkFetch;
      })
    )
  );
});
