import type { EmailLinkedRecordType } from "@/lib/email-links";

export type EmailApprovalStatus = "pending" | "approved" | "rejected";

export type EmailApprovalItem = {
  id: string;
  createdAt: string;
  status: EmailApprovalStatus;
  type: "invoice" | "purchase-order" | "generic";
  recordType: EmailLinkedRecordType;
  recordId: string;
  recordLabel: string;
  messageId: string;
  messageSubject: string;
  requestedBy?: string;
  approver?: string;
  notes?: string;
  mailbox?: string;
};

const STORAGE_KEY = "kbm_email_approvals_v1";

function safeParse(value: string | null): EmailApprovalItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as EmailApprovalItem[]) : [];
  } catch {
    return [];
  }
}

export function getEmailApprovalsFromStorage(): EmailApprovalItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveEmailApprovalsToStorage(value: EmailApprovalItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export async function syncEmailApprovalsFromServer(): Promise<EmailApprovalItem[]> {
  try {
    const response = await fetch("/api/email-approvals", { cache: "no-store" });
    if (!response.ok) return getEmailApprovalsFromStorage();
    const data = (await response.json()) as { items?: EmailApprovalItem[] };
    const items = Array.isArray(data.items) ? data.items : [];
    saveEmailApprovalsToStorage(items);
    return items;
  } catch {
    return getEmailApprovalsFromStorage();
  }
}

export async function createEmailApproval(
  input: Omit<EmailApprovalItem, "id" | "createdAt" | "status">
): Promise<EmailApprovalItem | null> {
  try {
    const response = await fetch("/api/email-approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { item?: EmailApprovalItem; items?: EmailApprovalItem[] };
    if (data.items) saveEmailApprovalsToStorage(data.items);
    return data.item || null;
  } catch {
    return null;
  }
}

export async function updateEmailApprovalStatus(id: string, status: EmailApprovalStatus): Promise<void> {
  try {
    const response = await fetch("/api/email-approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as { items?: EmailApprovalItem[] };
    if (data.items) saveEmailApprovalsToStorage(data.items);
  } catch {
    // ignore
  }
}
