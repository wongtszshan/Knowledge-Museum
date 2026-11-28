/* Knowledge Museum service worker.
   - Catalogue (data/) and exhibits (content/html/): network first, cached copy when offline.
   - Site shell (pages, assets/js, assets/css): network first, so code updates appear on next open
     without touching version numbers.
   - Icons and splash images: cache first, refreshed in the background.
   - PDFs are never cached here: they are large and stream straight from GitHub Pages / R2. */
const CACHE_NAME = 'knowledge-museum-shell-v16';
const CORE = [
  './',
  './index.html',
  './viewer.html',
  './pdf-viewer.html',
  './category.html',
  './archive.html',
  './yellow-pages.html',
  './data/yellow-pages.json',
  './data/articles.json',
  './data/categories.json',
  './assets/css/app.css',
  './assets/js/theme.js',
  './assets/js/i18n.js',
  './assets/js/core.js',
  './assets/js/app.js',
  './assets/js/reader.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/splash/background.png',
  './assets/splash/startup-image.webp'
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

async function networkFirst(request, { ignoreSearch = false } = {}) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request) || (ignoreSearch ? await cache.match(request, { ignoreSearch: true }) : null);
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
  const path = url.pathname;

  if (path.includes('/content/pdf/') || path.endsWith('.pdf')) return;

  // The full-text index is only needed for searching: serve the cached copy instantly, refresh behind.
  if (path.endsWith('/data/search-index.json')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (path.includes('/data/') || path.includes('/content/html/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Pages: viewer.html?id=… falls back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, { ignoreSearch: true }));
    return;
  }

  if (path.includes('/assets/js/') || path.includes('/assets/css/') || path.endsWith('/manifest.webmanifest')) {
    event.respondWith(networkFirst(request, { ignoreSearch: true }));
    return;
  }

  if (path.includes('/assets/icons/') || path.includes('/assets/splash/') || path.includes('/assets/covers/') || path.includes('/assets/yp-thumbs/')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
