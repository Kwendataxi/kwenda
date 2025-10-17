/**
 * Service Worker pour Kwenda Taxi
 * Cache les ressources essentielles pour le fonctionnement offline
 */

const APP_VERSION = self.__APP_VERSION__ || '1.0.0';
const BUILD_DATE = self.__BUILD_DATE__ || new Date().toISOString();
const CACHE_NAME = `kwenda-v${APP_VERSION}`;
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/app-icon-1024.png',
  '/splash-screen.png',
  '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Cache complete');
        return self.skipWaiting();
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Active');
      return self.clients.claim();
    })
  );
});

// Stratégie de mise en cache : Cache First pour les ressources statiques
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image' || 
      event.request.url.includes('.css') || 
      event.request.url.includes('.js') ||
      event.request.url.includes('/app-icon') ||
      event.request.url.includes('/manifest.json')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Retourner le cache s'il existe, sinon fetch
          return response || fetch(event.request).then((fetchResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
        .catch(() => {
          // Fallback pour les images si offline
          if (event.request.destination === 'image') {
            return caches.match('/app-icon-1024.png');
          }
        })
    );
  }
  
  // Pour les autres requêtes, utiliser Network First
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Si offline, essayer le cache
          return caches.match(event.request);
        })
    );
  }
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ 
      version: APP_VERSION,
      buildDate: BUILD_DATE,
      cacheSize: '~2.5MB'
    });
  }
});