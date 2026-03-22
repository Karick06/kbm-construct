export type EmailAuditAction =
  | "view-message"
  | "link-message"
  | "remove-link"
  | "auto-link"
  | "link-thread"
  | "create-task"
  | "save-attachment"
  | "send-approval"
  | "switch-mailbox";

export type EmailAuditEntry = {
  id: string;
  action: EmailAuditAction;
  at: string;
  actorEmail?: string;
  actorName?: string;
  mailbox?: string;
  messageId?: string;
  subject?: string;
  recordType?: string;
  recordId?: string;
  detail?: string;
};

const STORAGE_KEY = "kbm_email_audit_v1";

function safeParse(value: string | null): EmailAuditEntry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as EmailAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function getEmailAuditFromStorage(): EmailAuditEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveEmailAuditToStorage(value: EmailAuditEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export async function syncEmailAuditFromServer(): Promise<EmailAuditEntry[]> {
  try {
    const response = await fetch("/api/email-audit", { cache: "no-store" });
    if (!response.ok) return getEmailAuditFromStorage();
    const data = (await response.json()) as { entries?: EmailAuditEntry[] };
    const entries = Array.isArray(data.entries) ? data.entries : [];
    saveEmailAuditToStorage(entries);
    return entries;
  } catch {
    return getEmailAuditFromStorage();
  }
}

export async function logEmailAudit(entry: Omit<EmailAuditEntry, "id" | "at">): Promise<void> {
  try {
    const response = await fetch("/api/email-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!response.ok) return;
    const data = (await response.json()) as { entries?: EmailAuditEntry[] };
    if (data.entries) saveEmailAuditToStorage(data.entries);
  } catch {
    // ignore
  }
}
