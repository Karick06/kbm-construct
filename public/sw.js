// Service Worker for KBM Construct PWA
const CACHE_NAME = 'kbm-construct-v2';
const OFFLINE_URL = '/';
const OFFLINE_DATA_CACHE = 'kbm-offline-data-v1';

// Assets to cache immediately (critical app shell)
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/my-timesheets',
  '/projects',
  '/tasks',
  '/site-diary',
  '/photos',
  '/chat',
  '/manifest.json',
  '/valescape-logo.png',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/my-timesheets',
  '/projects',
  '/tasks',
  '/schedule',
  '/site-diary',
  '/photos',
  '/chat',
  '/geofences',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.error('[Service Worker] Precache failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API endpoints - Network first, cache fallback + offline queue
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(OFFLINE_DATA_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Network failed - try cache for GET requests
          if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
          }
          
          // Queue POST/PATCH/DELETE for background sync
          if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
            // Store request for sync when online
            await queueOfflineRequest(request);
            return new Response(
              JSON.stringify({ 
                queued: true, 
                mes- process queued offline requests
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  console.log('[Service Worker] Syncing offline queue');
  const db = await openDB();
  const tx = db.transaction('offline-queue', 'readonly');
  const store = tx.objectStore('offline-queue');
  const allRequests = await store.getAll();
  
  for (const reqData of allRequests) {
    try {
      const response = await fetch(reqData.url, {
        method: reqData.method,
        headers: reqData.headers,
        body: reqData.body || undefined,
      });
      
      if (response.ok) {
        // Successfully synced - remove from queue
        const deleteTx = db.transaction('offline-queue', 'readwrite');
        await deleteTx.objectStore('offline-queue').delete(reqData.id);
        console.log('[Service Worker] Synced:', reqData.url);
      }
    } catch (error) {
      console.error('[Service Worker] Sync failed:', error);
    }
  }
      if (cachedResponse) {
        // Return cached version immediately, update in background
        fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - return offline page for navigation
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Queue offline requests for background sync
async function queueOfflineRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };
  
  // Store in IndexedDB (simplified version)
  const db = await openDB();
  const tx = db.transaction('offline-queue', 'readwrite');
  tx.objectStore('offline-queue').add(requestData);
  await tx.complete;
  
  // Request background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-offline-queue');
  }
}

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kbm-offline-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Background sync for offline data (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-timesheets') {
    event.waitUntil(syncTimesheets());
  }
  if (event.tag === 'sync-leave-requests') {
    event.waitUntil(syncLeaveRequests());
  }
});

async function syncTimesheets() {
  // TODO: Implement timesheet sync logic
  console.log('[Service Worker] Syncing timesheets');
}

async function syncLeaveRequests() {
  // TODO: Implement leave request sync logic
  console.log('[Service Worker] Syncing leave requests');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'KBM Construct';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
