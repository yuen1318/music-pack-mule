const VERSION = '1.3.0'; // ← bump this on each deploy
const CACHE_NAME = `music-pack-mule-v${VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './fonts.css',
  './fonts/inter-var.woff2',
  './fonts/baloo2-var.woff2',
  './app.js',
  './sounds.js',
  './audio/clap.mp3',
  './audio/drum.mp3',
  './audio/announcement.mp3',
  './audio/host.mp3',
  './audio/mangarap.mp3'
  // Note: BGM files (tropical-summer-upbeat, men-of-fire, bloom, claw-machine)
  // are NOT pre-cached to keep install fast — they are cached at runtime
  // on first play instead.
];

// Pre-cache all listed assets on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Remove old caches on activate and notify clients of update
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
    .then(() => self.clients.matchAll().then(clients =>
      clients.forEach(client =>
        client.postMessage({ type: 'UPDATE_AVAILABLE' })
      )
    ))
  );
});

// Serve from cache first, fall back to network (and update cache)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
