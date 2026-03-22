import type { EmailLinkedRecordType } from "@/lib/email-links";

export type SavedEmailAttachment = {
  id: string;
  messageId: string;
  messageSubject: string;
  attachmentId: string;
  name: string;
  contentType?: string;
  size?: number;
  contentBytes?: string;
  mailbox?: string;
  savedAt: string;
  recordType: EmailLinkedRecordType;
  recordId: string;
  recordLabel: string;
};

const STORAGE_KEY = "kbm_saved_email_attachments_v1";

function safeParse(value: string | null): SavedEmailAttachment[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SavedEmailAttachment[]) : [];
  } catch {
    return [];
  }
}

export function getSavedEmailAttachmentsFromStorage(): SavedEmailAttachment[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveSavedEmailAttachmentsToStorage(value: SavedEmailAttachment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export async function syncSavedEmailAttachmentsFromServer(): Promise<SavedEmailAttachment[]> {
  try {
    const response = await fetch("/api/email-attachments", { cache: "no-store" });
    if (!response.ok) return getSavedEmailAttachmentsFromStorage();
    const data = (await response.json()) as { attachments?: SavedEmailAttachment[] };
    const attachments = Array.isArray(data.attachments) ? data.attachments : [];
    saveSavedEmailAttachmentsToStorage(attachments);
    return attachments;
  } catch {
    return getSavedEmailAttachmentsFromStorage();
  }
}

export async function saveEmailAttachmentRecord(
  input: Omit<SavedEmailAttachment, "id" | "savedAt">
): Promise<SavedEmailAttachment | null> {
  try {
    const response = await fetch("/api/email-attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { attachment?: SavedEmailAttachment; attachments?: SavedEmailAttachment[] };
    if (data.attachments) saveSavedEmailAttachmentsToStorage(data.attachments);
    return data.attachment || null;
  } catch {
    return null;
  }
}

export function getSavedAttachmentsForRecord(recordType: EmailLinkedRecordType, recordId: string): SavedEmailAttachment[] {
  return getSavedEmailAttachmentsFromStorage()
    .filter((entry) => entry.recordType === recordType && entry.recordId === recordId)
    .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());
}
