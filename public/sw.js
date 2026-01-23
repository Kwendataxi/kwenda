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
  console.log('Service Worker: Activating...', APP_VERSION);
  event.waitUntil(
    (async () => {
      // 1. Supprimer tous les anciens caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // 2. Broadcaster la nouvelle version à tous les clients
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        client.postMessage({
          type: 'NEW_VERSION_ACTIVATED',
          version: APP_VERSION,
          buildDate: BUILD_DATE
        });
      });
      
      console.log('Service Worker: Active', APP_VERSION);
      return self.clients.claim();
    })()
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

// Notification de mise à jour disponible avec changelog
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    // Charger le changelog
    let changelog = [];
    try {
      const changelogResponse = await fetch('/CHANGELOG.json');
      if (changelogResponse.ok) {
        const changelogData = await changelogResponse.json();
        const latestVersion = changelogData.versions[0];
        if (latestVersion) {
          changelog = latestVersion.changes.map(c => c.text);
        }
      }
    } catch (error) {
      console.error('Failed to load changelog:', error);
    }

    event.ports[0].postMessage({ 
      version: APP_VERSION,
      buildDate: BUILD_DATE,
      cacheSize: '~2.5MB',
      changelog: changelog,
      severity: 'major'
    });
  }
});

// Background Sync API pour synchronisation offline
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncPendingBookings());
  } else if (event.tag === 'sync-payments') {
    event.waitUntil(syncPendingPayments());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

// Fonctions de synchronisation
async function syncPendingBookings() {
  try {
    console.log('📥 Syncing pending bookings...');
    
    const db = await openIndexedDB();
    const bookings = await getAllFromStore(db, 'pending_bookings');
    
    for (const booking of bookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'pending_bookings', booking.id);
          console.log('✅ Booking synced:', booking.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync booking:', booking.id, error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

async function syncPendingPayments() {
  try {
    console.log('💰 Syncing pending payments...');
    
    const db = await openIndexedDB();
    const payments = await getAllFromStore(db, 'pending_payments');
    
    for (const payment of payments) {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment.data)
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'pending_payments', payment.id);
          console.log('✅ Payment synced:', payment.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync payment:', payment.id, error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

async function syncPendingMessages() {
  try {
    console.log('💬 Syncing pending messages...');
    
    const db = await openIndexedDB();
    const messages = await getAllFromStore(db, 'pending_messages');
    
    for (const message of messages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'pending_messages', message.id);
          console.log('✅ Message synced:', message.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync message:', message.id, error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Helpers IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kwenda-offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}