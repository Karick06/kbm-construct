import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { listMessageAttachments } from "@/lib/microsoft-mail";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const { id } = await context.params;
    const mailbox = _.nextUrl.searchParams.get("mailbox") || undefined;
    const attachments = await listMessageAttachments(accessToken, id, mailbox);

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Mail attachments error:", error);
    const message = error instanceof Error ? error.message : "Failed to load attachments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}