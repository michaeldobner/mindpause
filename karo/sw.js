// Offline-Unterstützung für KARO.
//
// Jede Version lädt nur ihre eigenen Dateien: Dateien von KARO tragen ?v=<Version>,
// Dateien der Hülle ?shell=<Version der Hülle> (siehe scripts/release.mjs).
// So können sich alte und neue Dateien nie mischen.
const VERSION = '1.0.2';
const SHELL = '1.3.0';
const CACHE = `karo-v${VERSION}-shell${SHELL}`;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  `./css/karo.css?v=${VERSION}`,
  ...['main', 'strings', 'cards', 'game', 'solver', 'solver-worker', 'levels', 'deals', 'faces', 'view', 'celebrate', 'sound']
    .map((name) => `./js/${name}.js?v=${VERSION}`),
  `../shared/tokens.css?shell=${SHELL}`,
  `../shared/shell.css?shell=${SHELL}`,
  ...['shell', 'i18n', 'storage', 'sound-engine', 'gutter', 'tilt'].map((name) => `../shared/js/${name}.js?shell=${SHELL}`),
];

self.addEventListener('install', (event) => {
  // cache: 'reload' umgeht den Browser-Cache, damit wirklich die neue Version gespeichert wird
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Nur eigene, alte Caches löschen. Andere Spiele der Sammlung behalten ihre.
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith('karo-') && k !== CACHE).map((k) => caches.delete(k)),
    )),
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
