/* Bump the version here in lockstep with the ?v=NN cache-buster on
   styles.css, i18n.js, a11y.js and share.js across every page. */
const CACHE_PREFIX = 'sattools-';
const CACHE = CACHE_PREFIX + 'v22';
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
  './a11y.js',
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

/* Only ever delete this project's own caches. Cache Storage is keyed per
   origin, not per path, and every GitHub Pages project site of the same
   account shares https://<user>.github.io — so an unfiltered sweep here
   would wipe the sibling sites' caches on every deploy of this one. */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE)
                      .map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Two strategies, because the two kinds of request want opposite things:

   - HTML documents: network-first. A pure cache-first SW pins every visitor
     to whatever HTML was cached on their first visit, so a deployed fix only
     reaches them after a CACHE bump *and* two reloads. Network-first serves
     fresh HTML when online and falls back to the cache offline.

   - Everything else (CSS/JS/icons): cache-first, but matched with
     ignoreSearch. The pages load these as `styles.css?v=NN`, `share.js?v=NN`
     etc. while ASSETS precaches the bare paths — an exact-URL match misses
     every one of them, which used to leave the "offline" app with no CSS and
     no JS at all. The ?v= query is the cache-buster for the CACHE bump, so
     ignoring it here is exactly right: a new version ships a new CACHE name,
     which re-fetches all of ASSETS anyway. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // never touch POST/PUT
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // leave cross-origin alone

  const isDoc = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').includes('text/html');

  if (isDoc) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
                       .then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req))
  );
});
