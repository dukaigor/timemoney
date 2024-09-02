// service-worker.js
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('v1').then(function(cache) {
            return cache.addAll([
                '/',
                '/index.html',
                'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timemoney-DkSa18j8FHurAVDXFp1Opi9NyFlQK6.png'
            ]);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
