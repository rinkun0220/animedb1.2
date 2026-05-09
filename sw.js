/* ANIMEDB Service Worker - GitHub Pages対応版 */
const CACHE = 'animedb-v2';
const STATIC = [
  '/animedb1.2/',
  '/animedb1.2/index.html',
  '/animedb1.2/ranking.html',
  '/animedb1.2/manifest.json',
  '/animedb1.2/icon-192.png',
  '/animedb1.2/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  /* APIはキャッシュしない */
  if (url.hostname.includes('jikan') || url.hostname.includes('myanimelist') || url.hostname.includes('fonts.g')) return;
  /* 画像: stale-while-revalidate */
  if (e.request.destination === 'image') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const network = fetch(e.request).then(res => { if(res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }
  /* HTML・JS・CSS: network first */
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
