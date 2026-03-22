import { NextRequest, NextResponse } from "next/server";
import type { EmailApprovalItem, EmailApprovalStatus } from "@/lib/email-approvals";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/email-approvals.json";
const REMOTE_RELATIVE_PATH = "data/email-approvals.json";

async function readStore(): Promise<EmailApprovalItem[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as EmailApprovalItem[]) : [];
}

async function writeStore(items: EmailApprovalItem[]): Promise<void> {
  await writeGlobalJsonStore<EmailApprovalItem[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

export async function GET() {
  return NextResponse.json({ items: await readStore() });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Partial<EmailApprovalItem>;
  if (!body.recordType || !body.recordId || !body.recordLabel || !body.messageId || !body.messageSubject) {
    return NextResponse.json({ error: "recordType, recordId, recordLabel, messageId and messageSubject are required" }, { status: 400 });
  }
  const item: EmailApprovalItem = {
    id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    type: body.type || "generic",
    recordType: body.recordType,
    recordId: body.recordId,
    recordLabel: body.recordLabel,
    messageId: body.messageId,
    messageSubject: body.messageSubject,
    requestedBy: body.requestedBy,
    approver: body.approver,
    notes: body.notes,
    mailbox: body.mailbox,
  };
  const next = [item, ...(await readStore())];
  await writeStore(next);
  return NextResponse.json({ item, items: next });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { id?: string; status?: EmailApprovalStatus };
  if (!body.id || !body.status || !["pending", "approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  const status = body.status as EmailApprovalStatus;
  const next = (await readStore()).map((item) => item.id === body.id ? { ...item, status } : item);
  await writeStore(next);
  return NextResponse.json({ items: next });
}
