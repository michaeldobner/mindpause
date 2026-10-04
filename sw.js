// Offline-Unterstützung für SPRING.
//
// Jede Version lädt nur ihre eigenen Dateien: Alle Verweise tragen ?v=<Version>
// (siehe scripts/release.mjs). So können sich alte und neue Dateien nie mischen.
const VERSION = '2.0.3';
const CACHE = `spring-v${VERSION}`;
const V = `?v=${VERSION}`;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  `./css/style.css${V}`,
  ...['main', 'figures', 'game', 'view', 'gutter', 'sound', 'storage', 'i18n', 'tilt', 'solver', 'solver-worker']
    .map((name) => `./js/${name}.js${V}`),
];

self.addEventListener('install', (event) => {
  // cache: 'reload' umgeht den Browser-Cache, damit wirklich die neue Version gespeichert wird
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Erst aus dem Netz (am Browser-Cache vorbei geprüft), sonst aus dem Offline-Speicher
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const fresh = request.mode === 'navigate'
    ? fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
    : fetch(request, { cache: 'no-cache' });
  event.respondWith(
    fresh
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match(request, { ignoreSearch: true }))),
  );
});
