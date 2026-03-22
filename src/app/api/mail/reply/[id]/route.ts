import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { replyToMessage } from "@/lib/microsoft-mail";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const comment = String(body.comment || "").trim();
    const mailbox = String(body.mailbox || "").trim() || undefined;

    if (!comment) {
      return NextResponse.json({ error: "comment is required" }, { status: 400 });
    }

    await replyToMessage(accessToken, id, comment, mailbox);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Mail reply error:", error);
    const message = error instanceof Error ? error.message : "Failed to send reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
