import { NextRequest, NextResponse } from "next/server";
import type { EmailLinkMap, EmailLinkedRecord, EmailMessageSnapshot } from "@/lib/email-links";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/email-links.json";
const REMOTE_RELATIVE_PATH = "data/email-links.json";

async function readStore(): Promise<EmailLinkMap> {
  return readGlobalJsonStore<EmailLinkMap>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: {},
  });
}

async function writeStore(map: EmailLinkMap): Promise<void> {
  await writeGlobalJsonStore<EmailLinkMap>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: map,
  });
}

export async function GET() {
  return NextResponse.json({ links: await readStore() });
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

  const store = await readStore();
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

  await writeStore(store);
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

  const store = await readStore();
  const current = store[messageId]?.links || [];
  const nextLinks = current.filter((e) => e.id !== linkId);

  if (nextLinks.length === 0) {
    delete store[messageId];
  } else {
    store[messageId] = { ...store[messageId], links: nextLinks };
  }

  await writeStore(store);
  return NextResponse.json({ links: nextLinks });
}

export async function PUT(request: NextRequest) {
  /** Bulk-replace: used when syncing the full local map to the server after a migration. */
  try {
    const body = await request.json() as { links: EmailLinkMap };
    if (!body?.links || typeof body.links !== "object") {
      return NextResponse.json({ error: "links object is required" }, { status: 400 });
    }
    await writeStore(body.links);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
