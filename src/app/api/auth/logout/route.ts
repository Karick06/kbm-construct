import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth/logout
 * Clears app auth/session cookies used by server-side permission checks.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("user_email");
    cookieStore.delete("user_name");

    cookieStore.delete("ms_access_token");
    cookieStore.delete("ms_refresh_token");
    cookieStore.delete("ms_user_id");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
