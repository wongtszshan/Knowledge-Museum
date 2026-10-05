const CACHE_NAME = 'knowledge-museum-shell';
const CORE = [
  './',
  './index.html',
  './viewer.html',
  './category.html',
  './archive.html',
  './assets/css/app.css',
  './assets/js/app.js',
  './manifest.webmanifest',
  './assets/icons/app-icon-1024.png',
  './assets/splash/background.png',
  './assets/splash/startup-image.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const update = fetch(request, { cache: 'no-store' })
    .then(response => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || update;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.includes('/content/html/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('/manifest.webmanifest')
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
