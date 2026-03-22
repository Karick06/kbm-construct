import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { createCalendarEvent, listCalendarEvents } from "@/lib/microsoft-mail";

type RecipientInput = {
  name?: string;
  address: string;
};

function normalizeRecipients(input: unknown): RecipientInput[] {
  if (!Array.isArray(input)) return [];
  const recipients: RecipientInput[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Record<string, unknown>;
    const address = String(candidate.address || "").trim();
    const name = String(candidate.name || "").trim();
    if (!address) continue;
    recipients.push({ address, name: name || undefined });
  }

  return recipients;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const startDateTime = request.nextUrl.searchParams.get("startDateTime") || undefined;
    const endDateTime = request.nextUrl.searchParams.get("endDateTime") || undefined;
    const events = await listCalendarEvents(accessToken, startDateTime, endDateTime);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar events error:", error);
    const message = error instanceof Error ? error.message : "Failed to load calendar events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const start = String(body.start || "").trim();
    const end = String(body.end || "").trim();

    if (!subject || !start || !end) {
      return NextResponse.json({ error: "subject, start, and end are required" }, { status: 400 });
    }

    await createCalendarEvent(accessToken, {
      subject,
      body: String(body.body || "").trim() || undefined,
      start,
      end,
      location: String(body.location || "").trim() || undefined,
      attendees: normalizeRecipients(body.attendees),
    });

    return NextResponse.json({ created: true });
  } catch (error) {
    console.error("Calendar create error:", error);
    const message = error instanceof Error ? error.message : "Failed to create calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}