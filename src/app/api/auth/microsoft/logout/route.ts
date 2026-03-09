import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth/microsoft/logout
 * Clears Microsoft session cookies
 */
export async function POST(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		
		// Clear all Microsoft auth cookies
		cookieStore.delete("ms_access_token");
		cookieStore.delete("ms_refresh_token");
		cookieStore.delete("ms_user_id");
		cookieStore.delete("user_email");
		cookieStore.delete("user_name");

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Microsoft logout error:", error);
		return NextResponse.json(
			{ error: "Failed to logout" },
			{ status: 500 }
		);
	}
}
