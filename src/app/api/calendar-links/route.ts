import { NextRequest, NextResponse } from "next/server";
import type { CalendarLinkMap, CalendarLinkedRecord, CalendarEventSnapshot } from "@/lib/calendar-links";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/calendar-links.json";
const REMOTE_RELATIVE_PATH = "data/calendar-links.json";

async function readStore(): Promise<CalendarLinkMap> {
  return readGlobalJsonStore<CalendarLinkMap>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: {},
  });
}

async function writeStore(map: CalendarLinkMap): Promise<void> {
  await writeGlobalJsonStore<CalendarLinkMap>({
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
    eventId: string;
    event: Omit<CalendarEventSnapshot, "eventId">;
    link: Omit<CalendarLinkedRecord, "id" | "linkedAt">;
  };

  const { eventId, event, link } = body;

  if (!eventId || !link?.type || !link?.recordId) {
    return NextResponse.json(
      { error: "eventId, link.type and link.recordId are required" },
      { status: 400 }
    );
  }

  const store = await readStore();
  const current = store[eventId]?.links || [];
  const duplicate = current.find(
    (e) => e.type === link.type && e.recordId === link.recordId
  );

  if (duplicate) {
    return NextResponse.json({ links: current });
  }

  const newLink: CalendarLinkedRecord = {
    ...link,
    id: `cal-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    linkedAt: new Date().toISOString(),
  };

  store[eventId] = {
    event: { eventId, ...event },
    links: [newLink, ...current],
  };

  await writeStore(store);
  return NextResponse.json({ links: store[eventId].links });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const eventId = searchParams.get("eventId");
  const linkId = searchParams.get("linkId");

  if (!eventId || !linkId) {
    return NextResponse.json(
      { error: "eventId and linkId are required" },
      { status: 400 }
    );
  }

  const store = await readStore();
  const current = store[eventId]?.links || [];
  const nextLinks = current.filter((e) => e.id !== linkId);

  if (nextLinks.length === 0) {
    delete store[eventId];
  } else {
    store[eventId] = { ...store[eventId], links: nextLinks };
  }

  await writeStore(store);
  return NextResponse.json({ links: nextLinks });
}
