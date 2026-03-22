import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import type { SavedEmailAttachment } from "@/lib/email-attachments";

const DATA_PATH = path.join(process.cwd(), "data", "email-attachments.json");

function readStore(): SavedEmailAttachment[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedEmailAttachment[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: SavedEmailAttachment[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json({ attachments: readStore() });
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
  const next = [entry, ...readStore()];
  writeStore(next);
  return NextResponse.json({ attachment: entry, attachments: next });
}
