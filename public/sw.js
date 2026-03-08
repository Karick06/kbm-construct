const CACHE_NAME = 'kbm-construct-v3';
const API_CACHE_NAME = 'kbm-api-cache-v1';
const DB_NAME = 'kbm-offline-db';
const DB_VERSION = 1;
const STORE_QUEUE = 'offline-queue';

const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/my-timesheets',
  '/timesheets-overview',
  '/projects',
  '/site-diary',
  '/photos',
  '/chat',
  '/manifest.json',
  '/valescape-logo.png',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![CACHE_NAME, API_CACHE_NAME].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method) && url.pathname.startsWith('/api/')) {
    event.respondWith(handleMutableApiRequest(request));
    return;
  }

  event.respondWith(cacheFirstAppShell(request));
});

async function cacheFirstAppShell(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request)
      .then(async (response) => {
        if (response && response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ success: false, offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleMutableApiRequest(request) {
  try {
    return await fetch(request);
  } catch {
    const queuedRequest = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.clone().text(),
      createdAt: new Date().toISOString(),
    };

    await addQueueItem(queuedRequest);

    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-offline-queue');
    }

    return new Response(
      JSON.stringify({
        success: true,
        queued: true,
        message: 'Action queued offline and will sync when online.',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  const items = await getQueueItems();
  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body || undefined,
      });
      if (response.ok) {
        await removeQueueItem(item.id);
      }
    } catch {
      // keep queued item for later retry
    }
  }
}

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'QUEUE_OFFLINE_REQUEST' && data.payload) {
    addQueueItem(data.payload).catch(() => {});
  }

  if (data.type === 'SHOW_NOTIFICATION' && data.payload) {
    const payload = data.payload;
    self.registration.showNotification(payload.title || 'KBM Construct', {
      body: payload.body || 'You have a new notification.',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      data: payload.url || '/',
    });
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'KBM Construct', {
      body: data.body || 'You have a new update.',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (upgradeEvent) => {
      const db = upgradeEvent.target.result;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function addQueueItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_QUEUE).add(item);
  });
}

async function getQueueItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    const request = tx.objectStore(STORE_QUEUE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function removeQueueItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_QUEUE).delete(id);
  });
}
