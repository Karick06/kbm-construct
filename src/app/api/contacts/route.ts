import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { createContact, listContacts } from "@/lib/microsoft-mail";

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

function normalizePhones(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((entry) => String(entry || "").trim()).filter(Boolean);
}

export async function GET() {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const contacts = await listContacts(accessToken);
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Contacts load error:", error);
    const message = error instanceof Error ? error.message : "Failed to load contacts";
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
    const displayName = String(body.displayName || "").trim();
    const emailAddresses = normalizeRecipients(body.emailAddresses);

    if (!displayName || emailAddresses.length === 0) {
      return NextResponse.json({ error: "displayName and at least one email address are required" }, { status: 400 });
    }

    await createContact(accessToken, {
      displayName,
      givenName: String(body.givenName || "").trim() || undefined,
      surname: String(body.surname || "").trim() || undefined,
      emailAddresses,
      businessPhones: normalizePhones(body.businessPhones),
      mobilePhone: String(body.mobilePhone || "").trim() || undefined,
      companyName: String(body.companyName || "").trim() || undefined,
    });

    return NextResponse.json({ created: true });
  } catch (error) {
    console.error("Contact create error:", error);
    const message = error instanceof Error ? error.message : "Failed to create contact";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}