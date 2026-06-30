const CACHE_NAME = 'stocktake-v1';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // App shell: cache-first so the app opens instantly even fully offline
  if (e.request.mode === 'navigate' || ASSETS.some((a) => url.pathname.endsWith(a.replace('./', '')))) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      }).catch(() => caches.match('./index.html')))
    );
    return;
  }

  // Everything else (e.g. Apps Script API calls): network-first, never cache API responses
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
