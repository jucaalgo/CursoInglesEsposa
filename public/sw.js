// Profesoria Service Worker — Offline cache for app shell
const CACHE_NAME = 'profesoria-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/src/index.tsx',
    '/src/index.css',
    '/favicon.svg',
    '/manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                if (event.request.method === 'GET') {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
