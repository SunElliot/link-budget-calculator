const CACHE = 'sattools-v17';
const ASSETS = [
  './',
  './index.html',
  './link-budget.html',
  './doppler.html',
  './pass-prediction.html',
  './antenna.html',
  './phased-array.html',
  './gt.html',
  './noise-figure.html',
  './hpa-backoff.html',
  './rain.html',
  './gas.html',
  './ber.html',
  './bands.html',
  './styles.css',
  './i18n.js',
  './share.js',
  './linkout.js',
  './modcod.js',
  './vendor/satellite.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
