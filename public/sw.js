/**
 * Offline cache.
 *
 * Strategy: cache-first for the app's own build output (it is versioned by
 * filename, so a cached hit is always correct), network-first for navigations
 * so a new deploy is picked up on the next launch. Anything that isn't a GET,
 * or isn't same-origin, is left alone.
 */

const VERSION = 'duosemetics-v1';
const CORE = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigations: try the network so updates land, fall back to the cached shell.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || Response.error())),
    );
    return;
  }

  // Everything else: serve from cache, and fill the cache on a miss.
  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((res) => {
            // Only cache our own assets and the font files; opaque third-party
            // responses are passed through untouched.
            if (res.ok && (sameOrigin || url.hostname.endsWith('gstatic.com'))) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => hit || Response.error()),
    ),
  );
});
