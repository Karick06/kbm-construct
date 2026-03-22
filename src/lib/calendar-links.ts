/**
 * Client-side store for calendar event ↔ project/estimate/record links.
 * Mirrors the structure of email-links.ts but for calendar events.
 *
 * localStorage acts as the local cache; /api/calendar-links is the server source of truth.
 */

export type CalendarLinkedRecordType =
  | "project"
  | "estimate"
  | "client"
  | "supplier"
  | "invoice"
  | "purchase-order";

export type CalendarLinkedRecord = {
  id: string;
  type: CalendarLinkedRecordType;
  recordId: string;
  label: string;
  href: string;
  linkedAt: string;
};

export type CalendarEventSnapshot = {
  eventId: string;
  subject: string;
  bodyPreview?: string;
  start?: string;
  end?: string;
  location?: string;
  organizer?: {
    name?: string;
    address?: string;
  };
  isAllDay?: boolean;
};

export type CalendarLinkEntry = {
  event: CalendarEventSnapshot;
  links: CalendarLinkedRecord[];
};

export type CalendarLinkMap = Record<string, CalendarLinkEntry>;

const STORAGE_KEY = "kbm_calendar_links_v1";

export function getCalendarLinksFromStorage(): CalendarLinkMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CalendarLinkMap;
  } catch {
    return {};
  }
}

export function saveCalendarLinksToStorage(value: CalendarLinkMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save calendar links:", error);
  }
}

export function getLinksForEvent(eventId: string): CalendarLinkedRecord[] {
  return getCalendarLinksFromStorage()[eventId]?.links || [];
}

export function getLinkedEventsForRecord(
  recordType: CalendarLinkedRecordType,
  recordId: string
): CalendarEventSnapshot[] {
  return Object.values(getCalendarLinksFromStorage())
    .filter((entry) =>
      entry.links.some((link) => link.type === recordType && link.recordId === recordId)
    )
    .map((entry) => entry.event)
    .sort((a, b) => {
      const aTime = new Date(a.start || 0).getTime();
      const bTime = new Date(b.start || 0).getTime();
      return bTime - aTime;
    });
}

export function addLinkToCalendarEvent(
  eventId: string,
  event: Omit<CalendarEventSnapshot, "eventId">,
  link: Omit<CalendarLinkedRecord, "id" | "linkedAt">
): CalendarLinkedRecord[] {
  const existing = getCalendarLinksFromStorage();
  const current = existing[eventId]?.links || [];

  const duplicate = current.find(
    (e) => e.type === link.type && e.recordId === link.recordId
  );
  if (duplicate) return current;

  const newLink: CalendarLinkedRecord = {
    ...link,
    id: `cal-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    linkedAt: new Date().toISOString(),
  };

  const next: CalendarLinkMap = {
    ...existing,
    [eventId]: {
      event: { eventId, ...event },
      links: [newLink, ...current],
    },
  };

  saveCalendarLinksToStorage(next);

  // Sync to server (fire-and-forget)
  fetch("/api/calendar-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, event, link }),
  }).catch(() => {});

  return next[eventId].links;
}

export function removeLinkFromCalendarEvent(
  eventId: string,
  linkId: string
): CalendarLinkedRecord[] {
  const existing = getCalendarLinksFromStorage();
  const current = existing[eventId]?.links || [];
  const nextLinks = current.filter((e) => e.id !== linkId);

  const next: CalendarLinkMap = { ...existing };
  if (nextLinks.length === 0) {
    delete next[eventId];
  } else {
    next[eventId] = { ...existing[eventId], links: nextLinks };
  }

  saveCalendarLinksToStorage(next);

  // Sync to server
  fetch(
    `/api/calendar-links?eventId=${encodeURIComponent(eventId)}&linkId=${encodeURIComponent(linkId)}`,
    { method: "DELETE" }
  ).catch(() => {});

  return nextLinks;
}

/** Call once on app mount to merge server data into localStorage. */
export async function syncCalendarLinksFromServer(): Promise<void> {
  try {
    const res = await fetch("/api/calendar-links", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { links: CalendarLinkMap };
    if (data?.links && typeof data.links === "object") {
      const local = getCalendarLinksFromStorage();
      const merged: CalendarLinkMap = { ...data.links };

      // Merge any local entries that don't exist on the server
      for (const [eventId, entry] of Object.entries(local)) {
        if (!merged[eventId]) {
          merged[eventId] = entry;
        }
      }
      saveCalendarLinksToStorage(merged);
    }
  } catch {
    // Offline or server unavailable — silently fall back to local cache
  }
}
