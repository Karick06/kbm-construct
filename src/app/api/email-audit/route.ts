import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import type { EmailAuditEntry } from "@/lib/email-audit";

const DATA_PATH = path.join(process.cwd(), "data", "email-audit.json");

function readStore(): EmailAuditEntry[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmailAuditEntry[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: EmailAuditEntry[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json({ entries: readStore().slice(0, 100) });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Partial<EmailAuditEntry>;
  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }
  const nextEntry: EmailAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    action: body.action,
    actorEmail: body.actorEmail,
    actorName: body.actorName,
    mailbox: body.mailbox,
    messageId: body.messageId,
    subject: body.subject,
    recordType: body.recordType,
    recordId: body.recordId,
    detail: body.detail,
  };
  const next = [nextEntry, ...readStore()].slice(0, 250);
  writeStore(next);
  return NextResponse.json({ entry: nextEntry, entries: next });
}
