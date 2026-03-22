import { NextRequest, NextResponse } from "next/server";
import type { SharedMailbox } from "@/lib/shared-mailboxes";
import { requireApiPermission } from "@/lib/api-permissions";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/shared-mailboxes.json";
const REMOTE_RELATIVE_PATH = "data/shared-mailboxes.json";

async function readStore(): Promise<SharedMailbox[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as SharedMailbox[]) : [];
}

async function writeStore(items: SharedMailbox[]): Promise<void> {
  await writeGlobalJsonStore<SharedMailbox[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

export async function GET() {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  return NextResponse.json({ mailboxes: await readStore() });
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const body = await request.json() as Partial<SharedMailbox>;
  if (!body.displayName || !body.address) {
    return NextResponse.json({ error: "displayName and address are required" }, { status: 400 });
  }
  const mailboxes = await readStore();
  const mailbox: SharedMailbox = {
    id: `mailbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    displayName: body.displayName,
    address: body.address,
    enabled: body.enabled ?? true,
    createdAt: new Date().toISOString(),
  };
  const next = [mailbox, ...mailboxes];
  await writeStore(next);
  return NextResponse.json({ mailbox, mailboxes: next });
}

export async function DELETE(request: NextRequest) {
  const permissionCheck = await requireApiPermission("user_management");
  if (!permissionCheck.ok) return permissionCheck.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const next = (await readStore()).filter((entry) => entry.id !== id);
  await writeStore(next);
  return NextResponse.json({ mailboxes: next });
}
