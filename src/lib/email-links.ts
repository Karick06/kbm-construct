export type EmailLinkedRecordType =
  | "project"
  | "estimate"
  | "client"
  | "supplier"
  | "invoice"
  | "purchase-order";

export type EmailLinkedRecord = {
  id: string;
  type: EmailLinkedRecordType;
  recordId: string;
  label: string;
  href: string;
  linkedAt: string;
};

export type EmailMessageSnapshot = {
  messageId: string;
  folderId?: string;
  folderName?: string;
  mailbox?: string;
  subject: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  importance?: string;
  conversationId?: string;
  internetMessageId?: string;
  from?: {
    name?: string;
    address?: string;
  };
};

export type EmailLinkEntry = {
  message: EmailMessageSnapshot;
  links: EmailLinkedRecord[];
};

export type EmailLinkMap = Record<string, EmailLinkEntry>;

const STORAGE_KEY = "kbm_email_links_v1";

function safeParse(value: string | null): EmailLinkMap {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const migrated: EmailLinkMap = {};

    for (const [messageId, rawEntry] of Object.entries(parsed)) {
      if (Array.isArray(rawEntry)) {
        migrated[messageId] = {
          message: {
            messageId,
            subject: "(Linked email)",
          },
          links: rawEntry as EmailLinkedRecord[],
        };
        continue;
      }

      if (!rawEntry || typeof rawEntry !== "object") continue;
      const entry = rawEntry as Partial<EmailLinkEntry>;
      migrated[messageId] = {
        message: {
          messageId,
          subject: entry.message?.subject || "(Linked email)",
          bodyPreview: entry.message?.bodyPreview,
          receivedDateTime: entry.message?.receivedDateTime,
          isRead: entry.message?.isRead,
          hasAttachments: entry.message?.hasAttachments,
          importance: entry.message?.importance,
          conversationId: entry.message?.conversationId,
          internetMessageId: entry.message?.internetMessageId,
          folderName: entry.message?.folderName,
          mailbox: entry.message?.mailbox,
          from: entry.message?.from,
          folderId: entry.message?.folderId,
        },
        links: Array.isArray(entry.links) ? entry.links : [],
      };
    }

    return migrated;
  } catch (error) {
    console.error("Failed to parse email links from localStorage:", error);
    return {};
  }
}

export function getEmailLinksFromStorage(): EmailLinkMap {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveEmailLinksToStorage(value: EmailLinkMap): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save email links to localStorage:", error);
  }
}

export function getLinksForMessage(messageId: string): EmailLinkedRecord[] {
  return getEmailLinksFromStorage()[messageId]?.links || [];
}

export function getMessageSnapshot(messageId: string): EmailMessageSnapshot | null {
  return getEmailLinksFromStorage()[messageId]?.message || null;
}

export function getLinkedMessagesForRecord(
  recordType: EmailLinkedRecordType,
  recordId: string
): EmailMessageSnapshot[] {
  return Object.values(getEmailLinksFromStorage())
    .filter((entry) => entry.links.some((link) => link.type === recordType && link.recordId === recordId))
    .map((entry) => entry.message)
    .sort((left, right) => {
      const l = new Date(left.receivedDateTime || 0).getTime();
      const r = new Date(right.receivedDateTime || 0).getTime();
      return r - l;
    });
}

export function getLinksForConversation(conversationId: string): EmailLinkedRecord[] {
  if (!conversationId) return [];
  const unique = new Map<string, EmailLinkedRecord>();

  for (const entry of Object.values(getEmailLinksFromStorage())) {
    if (entry.message.conversationId !== conversationId) continue;
    for (const link of entry.links) {
      unique.set(`${link.type}:${link.recordId}`, link);
    }
  }

  return Array.from(unique.values());
}

export function inheritConversationLinks(
  messageId: string,
  message: Omit<EmailMessageSnapshot, "messageId">
): EmailLinkedRecord[] {
  if (!message.conversationId) return [];

  const inherited = getLinksForConversation(message.conversationId);
  if (inherited.length === 0) return [];

  inherited.forEach((link) => {
    addLinkToMessage(messageId, message, {
      type: link.type,
      recordId: link.recordId,
      label: link.label,
      href: link.href,
    });
  });

  return getLinksForMessage(messageId);
}

export function getMessageIdsForConversation(conversationId: string): string[] {
  if (!conversationId) return [];
  return Object.values(getEmailLinksFromStorage())
    .filter((entry) => entry.message.conversationId === conversationId)
    .map((entry) => entry.message.messageId);
}

export function addLinkToMessage(
  messageId: string,
  message: Omit<EmailMessageSnapshot, "messageId">,
  link: Omit<EmailLinkedRecord, "id" | "linkedAt">
): EmailLinkedRecord[] {
  const existing = getEmailLinksFromStorage();
  const current = existing[messageId]?.links || [];

  const duplicate = current.find(
    (entry) => entry.type === link.type && entry.recordId === link.recordId
  );

  if (duplicate) {
    return current;
  }

  const nextEntry: EmailLinkedRecord = {
    ...link,
    id: `email-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    linkedAt: new Date().toISOString(),
  };

  const next: EmailLinkMap = {
    ...existing,
    [messageId]: {
      message: {
        messageId,
        ...message,
      },
      links: [nextEntry, ...current],
    },
  };

  saveEmailLinksToStorage(next);

  // Sync to server (fire-and-forget)
  fetch("/api/email-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, message, link }),
  }).catch(() => {});

  return next[messageId].links;
}

export function removeLinkFromMessage(messageId: string, linkId: string): EmailLinkedRecord[] {
  const existing = getEmailLinksFromStorage();
  const current = existing[messageId]?.links || [];
  const nextLinks = current.filter((entry) => entry.id !== linkId);

  const next: EmailLinkMap = {
    ...existing,
    [messageId]: {
      message: existing[messageId]?.message || {
        messageId,
        subject: "(Linked email)",
      },
      links: nextLinks,
    },
  };

  if (nextLinks.length === 0) {
    delete next[messageId];
  }

  saveEmailLinksToStorage(next);

  // Sync to server
  fetch(
    `/api/email-links?messageId=${encodeURIComponent(messageId)}&linkId=${encodeURIComponent(linkId)}`,
    { method: "DELETE" }
  ).catch(() => {});

  return nextLinks;
}

/** Call once on app mount to merge server data into localStorage. */
export async function syncEmailLinksFromServer(): Promise<void> {
  try {
    const res = await fetch("/api/email-links", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { links: EmailLinkMap };
    if (data?.links && typeof data.links === "object") {
      const local = getEmailLinksFromStorage();
      const merged: EmailLinkMap = { ...data.links };

      // Merge local-only entries not yet on the server
      for (const [messageId, entry] of Object.entries(local)) {
        if (!merged[messageId]) {
          merged[messageId] = entry;
        }
      }
      saveEmailLinksToStorage(merged);
    }
  } catch {
    // Offline — silently fall back to local cache
  }
}

