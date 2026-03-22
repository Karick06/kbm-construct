import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { getMessageById } from "@/lib/microsoft-mail";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const { id } = await context.params;
    const mailbox = _.nextUrl.searchParams.get("mailbox") || undefined;
    const message = await getMessageById(accessToken, id, mailbox);

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Mail message detail error:", error);
    const message = error instanceof Error ? error.message : "Failed to load message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
