import { NextRequest, NextResponse } from "next/server";
import type { EmailAuditEntry } from "@/lib/email-audit";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/email-audit.json";
const REMOTE_RELATIVE_PATH = "data/email-audit.json";

async function readStore(): Promise<EmailAuditEntry[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as EmailAuditEntry[]) : [];
}

async function writeStore(items: EmailAuditEntry[]): Promise<void> {
  await writeGlobalJsonStore<EmailAuditEntry[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

export async function GET() {
  return NextResponse.json({ entries: (await readStore()).slice(0, 100) });
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
  const next = [nextEntry, ...(await readStore())].slice(0, 250);
  await writeStore(next);
  return NextResponse.json({ entry: nextEntry, entries: next });
}
