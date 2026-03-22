import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { sendNewMessage } from "@/lib/microsoft-mail";

type RecipientInput = {
  name?: string;
  address: string;
};

type AttachmentInput = {
  name: string;
  contentType?: string;
  contentBytes: string;
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

function normalizeAttachments(input: unknown): AttachmentInput[] {
  if (!Array.isArray(input)) return [];

  const attachments: AttachmentInput[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Record<string, unknown>;
    const name = String(candidate.name || "").trim();
    const contentBytes = String(candidate.contentBytes || "").trim();
    const contentType = String(candidate.contentType || "").trim();

    if (!name || !contentBytes) continue;

    attachments.push({
      name,
      contentBytes,
      contentType: contentType || undefined,
    });
  }

  return attachments;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const content = String(body.body || "");
    const bodyType = body.bodyType === "text" ? "text" : "html";
    const to = normalizeRecipients(body.to);
    const cc = normalizeRecipients(body.cc);
    const attachments = normalizeAttachments(body.attachments);
    const mailbox = String(body.mailbox || "").trim() || undefined;

    if (!subject) {
      return NextResponse.json({ error: "subject is required" }, { status: 400 });
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    if (to.length === 0) {
      return NextResponse.json({ error: "at least one recipient is required" }, { status: 400 });
    }

    await sendNewMessage(accessToken, {
      subject,
      body: content,
      bodyType,
      to,
      cc,
      attachments,
    }, mailbox);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Mail send error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
