import { NextRequest, NextResponse } from "next/server";
import type { SavedEmailAttachment } from "@/lib/email-attachments";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/email-attachments.json";
const REMOTE_RELATIVE_PATH = "data/email-attachments.json";

async function readStore(): Promise<SavedEmailAttachment[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as SavedEmailAttachment[]) : [];
}

async function writeStore(items: SavedEmailAttachment[]): Promise<void> {
  await writeGlobalJsonStore<SavedEmailAttachment[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

export async function GET() {
  return NextResponse.json({ attachments: await readStore() });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Partial<SavedEmailAttachment>;
  if (!body.messageId || !body.attachmentId || !body.name || !body.recordType || !body.recordId || !body.recordLabel) {
    return NextResponse.json({ error: "messageId, attachmentId, name, recordType, recordId and recordLabel are required" }, { status: 400 });
  }
  const entry: SavedEmailAttachment = {
    id: `attach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    messageId: body.messageId,
    messageSubject: body.messageSubject || "(No subject)",
    attachmentId: body.attachmentId,
    name: body.name,
    contentType: body.contentType,
    size: body.size,
    contentBytes: body.contentBytes,
    mailbox: body.mailbox,
    savedAt: new Date().toISOString(),
    recordType: body.recordType,
    recordId: body.recordId,
    recordLabel: body.recordLabel,
  };
  const next = [entry, ...(await readStore())];
  await writeStore(next);
  return NextResponse.json({ attachment: entry, attachments: next });
}
