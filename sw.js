/**
 * Warmthly Service Worker
 * Provides offline support and caching for PWA functionality
 * Privacy-first: No tracking, no analytics
 *
 * Version: 1.0.0
 * Update this version number when you update the service worker
 */

const CACHE_VERSION = 'warmthly-v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}-cache`;
const OFFLINE_PAGE = '/404.html'; // Use 404 page as offline fallback

/**
 * Assets to cache on install
 * Add critical assets here for offline access
 */
const PRECACHE_ASSETS = [
  '/',
  '/404.html',
  '/lego/styles/common.css',
  '/lego/styles/variables.css',
  '/lego/styles/base.css',
  '/favicon.svg',
  '/manifest.json',
];

/**
 * Install event - cache critical assets
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(error => {
        // If some assets fail to cache, continue anyway
        console.warn('Service Worker: Some assets failed to cache', error);
        return Promise.resolve();
      });
    })
  );

  // Activate immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches that don't match current version
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

/**
 * Fetch event - Stale-While-Revalidate strategy for better performance
 * Serves cached content immediately, then updates cache in background
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except same-origin)
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests: Network First (always fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses for offline use
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - try cache as fallback
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // HTML pages: Stale-While-Revalidate (fast initial load, fresh updates)
  if (
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    !url.pathname.includes('.')
  ) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // Start fetching fresh content in background
        const fetchPromise = fetch(request)
          .then(response => {
            // Only cache successful responses
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Network failed, ignore (we'll use cache)
            return null;
          });

        // Return cached version immediately if available
        if (cachedResponse) {
          // Update cache in background (don't wait)
          fetchPromise.catch(() => {
            // Silently fail background update
          });
          return cachedResponse;
        }

        // No cache, wait for network
        return fetchPromise.then(response => {
          if (response) {
            return response;
          }
          // Network failed and no cache - serve offline page
          return caches.match(OFFLINE_PAGE).then(offlinePage => {
            return (
              offlinePage ||
              new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain',
                }),
              })
            );
          });
        });
      })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts): Cache First (fast, rarely change)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request)
          .then(response => {
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
          })
          .catch(() => {
            // Silently fail background update
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, return error
          return new Response('Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
    })
  );
});

/**
 * Message handler - for cache updates from main thread
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(urls);
      })
    );
  }
});
