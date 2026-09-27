const CACHE_NAME = 'offfice-tool-cache-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './public/app.css',
  './public/icons/icon-192x192.png',
  './public/icons/icon-512x512.png',
  './public/icons/favicon.png',
  './libs/jszip.min.js',
  './libs/pdf-lib.min.js',
  './libs/docx.iife.js',
  './libs/pptxgen.bundle.js',
  './libs/lucide.min.js',
  './libs/pdf.min.mjs',
  './libs/pdf.worker.min.mjs',
  './src/engine/sound.js',
  './src/engine/platform.js',
  './src/engine/excel-engine.js',
  './src/engine/pdf-editor-client.js',
  './src/engine/converter-client.js',
  './src/engine/word-studio.js',
  './src/engine/sheet-studio.js',
  './src/engine/slides-studio.js',
  './src/engine/workspace-store.js',
  './src/workspace-ui.js',
  './src/app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Cache pre-fetch partial warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Dynamic API requests go direct to network (never cached)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets: Stale-While-Revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
