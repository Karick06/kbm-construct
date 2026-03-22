import { NextRequest, NextResponse } from "next/server";
import type { EmailAutoLinkRule } from "@/lib/email-rules";
import { requireApiPermission } from "@/lib/api-permissions";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/email-rules.json";
const REMOTE_RELATIVE_PATH = "data/email-rules.json";

async function readStore(): Promise<EmailAutoLinkRule[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as EmailAutoLinkRule[]) : [];
}

async function writeStore(items: EmailAutoLinkRule[]): Promise<void> {
  await writeGlobalJsonStore<EmailAutoLinkRule[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

export async function GET() {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  return NextResponse.json({ rules: await readStore() });
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const body = await request.json() as Partial<EmailAutoLinkRule>;
  if (!body.recordType || !body.recordId || !body.recordLabel || !body.recordHref || !body.name) {
    return NextResponse.json({ error: "name, recordType, recordId, recordLabel and recordHref are required" }, { status: 400 });
  }

  const rules = await readStore();
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
  await writeStore(next);
  return NextResponse.json({ rule, rules: next });
}

export async function DELETE(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const next = (await readStore()).filter((entry) => entry.id !== id);
  await writeStore(next);
  return NextResponse.json({ rules: next });
}
