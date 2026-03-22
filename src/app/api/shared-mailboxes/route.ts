import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import type { SharedMailbox } from "@/lib/shared-mailboxes";
import { requireApiPermission } from "@/lib/api-permissions";

const DATA_PATH = path.join(process.cwd(), "data", "shared-mailboxes.json");

function readStore(): SharedMailbox[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SharedMailbox[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: SharedMailbox[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET() {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  return NextResponse.json({ mailboxes: readStore() });
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const body = await request.json() as Partial<SharedMailbox>;
  if (!body.displayName || !body.address) {
    return NextResponse.json({ error: "displayName and address are required" }, { status: 400 });
  }
  const mailboxes = readStore();
  const mailbox: SharedMailbox = {
    id: `mailbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    displayName: body.displayName,
    address: body.address,
    enabled: body.enabled ?? true,
    createdAt: new Date().toISOString(),
  };
  const next = [mailbox, ...mailboxes];
  writeStore(next);
  return NextResponse.json({ mailbox, mailboxes: next });
}

export async function DELETE(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const next = readStore().filter((entry) => entry.id !== id);
  writeStore(next);
  return NextResponse.json({ mailboxes: next });
}
