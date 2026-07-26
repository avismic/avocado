const CACHE_NAME = 'fleet-manager-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/global.css',
  '/js/app.js',
  '/js/router.js',
  '/js/auth.js',
  '/js/utils/geo.js',
  '/features/shared/modal.js',
  '/features/driver-dashboard/driver-dashboard.js',
  '/features/attendance/attendance.js',
  '/features/fuel/fuel.js',
  '/features/owner-dashboard/owner-dashboard.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isApi = url.pathname.startsWith('/api/');

  if (isApi) {
    if (request.method !== 'GET') {
      event.respondWith(fetch(request));
      return;
    }

    event.respondWith(
      fetch(request)
        .then(networkRes => {
          caches.open(CACHE_NAME).then(cache => cache.put(request, networkRes.clone()));
          return networkRes;
        })
        .catch(() => caches.match(request))
    );
  } else {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});