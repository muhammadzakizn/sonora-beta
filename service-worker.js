const CACHE = 'sonora-preview-v1';
const ASSETS = ['/', '/index.html', '/src/main.js', '/src/audio/AudioManager.js', '/styles.css'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    })).catch(()=>caches.match('/index.html')));
  }
});
