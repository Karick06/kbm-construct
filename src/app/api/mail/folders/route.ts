import { NextResponse } from "next/server";
import { getMicrosoftAccessTokenFromSession } from "@/lib/mail-auth";
import { listMailFolders } from "@/lib/microsoft-mail";

export async function GET(request: Request) {
  try {
    const accessToken = await getMicrosoftAccessTokenFromSession();

    if (!accessToken) {
      return NextResponse.json({ error: "Microsoft session not available" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mailbox = searchParams.get("mailbox") || undefined;
    const folders = await listMailFolders(accessToken, mailbox);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Mail folders error:", error);
    const message = error instanceof Error ? error.message : "Failed to load mail folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
