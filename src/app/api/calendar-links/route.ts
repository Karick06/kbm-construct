import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import type { CalendarLinkMap, CalendarLinkedRecord, CalendarEventSnapshot } from "@/lib/calendar-links";

const DATA_PATH = path.join(process.cwd(), "data", "calendar-links.json");

function readStore(): CalendarLinkMap {
  try {
    if (!fs.existsSync(DATA_PATH)) return {};
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as CalendarLinkMap;
  } catch {
    return {};
  }
}

function writeStore(map: CalendarLinkMap): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(map, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json({ links: readStore() });
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

  const store = readStore();
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

  writeStore(store);
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

  const store = readStore();
  const current = store[eventId]?.links || [];
  const nextLinks = current.filter((e) => e.id !== linkId);

  if (nextLinks.length === 0) {
    delete store[eventId];
  } else {
    store[eventId] = { ...store[eventId], links: nextLinks };
  }

  writeStore(store);
  return NextResponse.json({ links: nextLinks });
}
