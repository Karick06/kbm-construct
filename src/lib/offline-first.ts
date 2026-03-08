export type QueuedRequest = {
  id: string;
  url: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  createdAt: string;
};

const CACHE_PREFIX = "kbm_cache:";
const QUEUE_KEY = "kbm_offline_request_queue";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCachedData<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to cache data", error);
  }
}

export function queueOfflineRequest(request: Omit<QueuedRequest, "id" | "createdAt">): QueuedRequest {
  const queued: QueuedRequest = {
    ...request,
    id: `queued-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  if (!isBrowser()) return queued;

  const existing = getQueuedRequests();
  existing.push(queued);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "QUEUE_OFFLINE_REQUEST",
      payload: queued,
    });
  }

  return queued;
}

export function getQueuedRequests(): QueuedRequest[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

export function clearQueuedRequest(requestId: string): void {
  if (!isBrowser()) return;
  const queue = getQueuedRequests().filter((item) => item.id !== requestId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function syncQueuedRequests(): Promise<{ synced: number; failed: number }> {
  if (!isBrowser() || !navigator.onLine) return { synced: 0, failed: 0 };

  const queue = getQueuedRequests();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        clearQueuedRequest(item.id);
        synced += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}
