import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import type { EmailLinkMap, EmailLinkedRecord, EmailMessageSnapshot } from "@/lib/email-links";

const DATA_PATH = path.join(process.cwd(), "data", "email-links.json");

function readStore(): EmailLinkMap {
  try {
    if (!fs.existsSync(DATA_PATH)) return {};
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as EmailLinkMap;
  } catch {
    return {};
  }
}

function writeStore(map: EmailLinkMap): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(map, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json({ links: readStore() });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    messageId: string;
    message: Omit<EmailMessageSnapshot, "messageId">;
    link: Omit<EmailLinkedRecord, "id" | "linkedAt">;
  };

  const { messageId, message, link } = body;

  if (!messageId || !link?.type || !link?.recordId) {
    return NextResponse.json(
      { error: "messageId, link.type and link.recordId are required" },
      { status: 400 }
    );
  }

  const store = readStore();
  const current = store[messageId]?.links || [];
  const duplicate = current.find(
    (e) => e.type === link.type && e.recordId === link.recordId
  );

  if (duplicate) {
    return NextResponse.json({ links: current });
  }

  const newLink: EmailLinkedRecord = {
    ...link,
    id: `email-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    linkedAt: new Date().toISOString(),
  };

  store[messageId] = {
    message: { messageId, ...message },
    links: [newLink, ...current],
  };

  writeStore(store);
  return NextResponse.json({ links: store[messageId].links });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const messageId = searchParams.get("messageId");
  const linkId = searchParams.get("linkId");

  if (!messageId || !linkId) {
    return NextResponse.json(
      { error: "messageId and linkId are required" },
      { status: 400 }
    );
  }

  const store = readStore();
  const current = store[messageId]?.links || [];
  const nextLinks = current.filter((e) => e.id !== linkId);

  if (nextLinks.length === 0) {
    delete store[messageId];
  } else {
    store[messageId] = { ...store[messageId], links: nextLinks };
  }

  writeStore(store);
  return NextResponse.json({ links: nextLinks });
}

export async function PUT(request: NextRequest) {
  /** Bulk-replace: used when syncing the full local map to the server after a migration. */
  try {
    const body = await request.json() as { links: EmailLinkMap };
    if (!body?.links || typeof body.links !== "object") {
      return NextResponse.json({ error: "links object is required" }, { status: 400 });
    }
    writeStore(body.links);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
