import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { deleteMessage } from "@/lib/microsoft-mail";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const { id } = await context.params;
    const mailbox = request.nextUrl.searchParams.get("mailbox") || undefined;
    await deleteMessage(accessToken, id, mailbox);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Mail delete error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}