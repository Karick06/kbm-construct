import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { listFolderMessages } from "@/lib/microsoft-mail";

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const folderId = request.nextUrl.searchParams.get("folderId");
    const mailbox = request.nextUrl.searchParams.get("mailbox") || undefined;
    const topParam = request.nextUrl.searchParams.get("top");
    const top = Math.max(1, Math.min(100, Number(topParam || 30)));

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    const messages = await listFolderMessages(accessToken, folderId, top, mailbox);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Mail messages error:", error);
    const message = error instanceof Error ? error.message : "Failed to load messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
