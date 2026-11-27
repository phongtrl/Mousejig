'use strict';

const CACHE = 'mousejig-pad-v1';
const files = ['./', 'index.html', 'style.css', 'app.js', 'pad.js', 'icon.png', 'manifest.webmanifest', 'fonts/dm-sans.woff'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(files)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('mousejig-pad-') && key !== CACHE).map(key => caches.delete(key))
  )));
});
self.addEventListener('fetch', event => {
  if (event.request.method === 'GET' && event.request.url.startsWith(self.registration.scope)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
  }
});
