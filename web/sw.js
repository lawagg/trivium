/* Офлайн-доступ + свежесть: сначала сеть, при её отсутствии — кеш.
 * Кеш-первый вариант не годился: после обновления сайта браузер
 * продолжал отдавать старые файлы.
 */
const CACHE = 'trivium-v2';
const FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './scoring.js',
  './data.js',
  './icon.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
  );
});
