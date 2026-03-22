import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import type { EmailAutoLinkRule } from "@/lib/email-rules";
import { requireApiPermission } from "@/lib/api-permissions";

const DATA_PATH = path.join(process.cwd(), "data", "email-rules.json");

function readStore(): EmailAutoLinkRule[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmailAutoLinkRule[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: EmailAutoLinkRule[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET() {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  return NextResponse.json({ rules: readStore() });
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const body = await request.json() as Partial<EmailAutoLinkRule>;
  if (!body.recordType || !body.recordId || !body.recordLabel || !body.recordHref || !body.name) {
    return NextResponse.json({ error: "name, recordType, recordId, recordLabel and recordHref are required" }, { status: 400 });
  }

  const rules = readStore();
  const now = new Date().toISOString();
  const rule: EmailAutoLinkRule = {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: body.name,
    enabled: body.enabled ?? true,
    mailbox: body.mailbox,
    senderDomain: body.senderDomain,
    senderContains: body.senderContains,
    subjectIncludes: body.subjectIncludes,
    bodyIncludes: body.bodyIncludes,
    recordType: body.recordType,
    recordId: body.recordId,
    recordLabel: body.recordLabel,
    recordHref: body.recordHref,
    applyToThread: body.applyToThread ?? true,
    priority: typeof body.priority === "number" ? body.priority : 100,
    createdAt: now,
    updatedAt: now,
  };

  const next = [rule, ...rules];
  writeStore(next);
  return NextResponse.json({ rule, rules: next });
}

export async function DELETE(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const next = readStore().filter((entry) => entry.id !== id);
  writeStore(next);
  return NextResponse.json({ rules: next });
}
