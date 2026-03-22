export type SharedMailbox = {
  id: string;
  displayName: string;
  address: string;
  enabled: boolean;
  createdAt: string;
};

const STORAGE_KEY = "kbm_shared_mailboxes_v1";

function safeParse(value: string | null): SharedMailbox[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SharedMailbox[]) : [];
  } catch {
    return [];
  }
}

export function getSharedMailboxesFromStorage(): SharedMailbox[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveSharedMailboxesToStorage(value: SharedMailbox[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export async function syncSharedMailboxesFromServer(): Promise<SharedMailbox[]> {
  try {
    const response = await fetch("/api/shared-mailboxes", { cache: "no-store" });
    if (!response.ok) return getSharedMailboxesFromStorage();
    const data = (await response.json()) as { mailboxes?: SharedMailbox[] };
    const mailboxes = Array.isArray(data.mailboxes) ? data.mailboxes : [];
    saveSharedMailboxesToStorage(mailboxes);
    return mailboxes;
  } catch {
    return getSharedMailboxesFromStorage();
  }
}

export async function createSharedMailbox(mailbox: Omit<SharedMailbox, "id" | "createdAt">): Promise<SharedMailbox | null> {
  try {
    const response = await fetch("/api/shared-mailboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mailbox),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { mailbox?: SharedMailbox; mailboxes?: SharedMailbox[] };
    if (data.mailboxes) saveSharedMailboxesToStorage(data.mailboxes);
    return data.mailbox || null;
  } catch {
    return null;
  }
}

export async function deleteSharedMailbox(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/shared-mailboxes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) return;
    const data = (await response.json()) as { mailboxes?: SharedMailbox[] };
    if (data.mailboxes) saveSharedMailboxesToStorage(data.mailboxes);
  } catch {
    // ignore
  }
}
