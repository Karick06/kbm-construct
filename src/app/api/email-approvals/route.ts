import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import type { EmailApprovalItem, EmailApprovalStatus } from "@/lib/email-approvals";

const DATA_PATH = path.join(process.cwd(), "data", "email-approvals.json");

function readStore(): EmailApprovalItem[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmailApprovalItem[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: EmailApprovalItem[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json({ items: readStore() });
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
  const next = [item, ...readStore()];
  writeStore(next);
  return NextResponse.json({ item, items: next });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { id?: string; status?: EmailApprovalStatus };
  if (!body.id || !body.status || !["pending", "approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  const status = body.status as EmailApprovalStatus;
  const next = readStore().map((item) => item.id === body.id ? { ...item, status } : item);
  writeStore(next);
  return NextResponse.json({ items: next });
}
