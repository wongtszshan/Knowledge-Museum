const CACHE_NAME = 'knowledge-museum-shell-v2';
const CORE = [
  './',
  './index.html',
  './viewer.html',
  './category.html',
  './archive.html',
  './assets/css/app.css?v=20261005-3',
  './assets/js/app.js?v=20261005-3',
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
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) await cache.put(request, response.clone());
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
    .then(async response => {
      if (response && response.ok) await cache.put(request, response.clone());
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

  if (url.pathname.includes('/data/') || url.pathname.includes('/content/html/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.endsWith('/assets/js/app.js') ||
    url.pathname.endsWith('/assets/css/app.css') ||
    url.pathname.endsWith('/manifest.webmanifest')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.includes('/assets/icons/') || url.pathname.includes('/assets/splash/')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
