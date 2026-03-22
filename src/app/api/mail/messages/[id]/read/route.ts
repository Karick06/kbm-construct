import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { setMessageReadState } from "@/lib/microsoft-mail";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const isRead = Boolean(body.isRead);
    const mailbox = String(body.mailbox || "").trim() || undefined;

    await setMessageReadState(accessToken, id, isRead, mailbox);

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("Mail read-state update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update read status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
