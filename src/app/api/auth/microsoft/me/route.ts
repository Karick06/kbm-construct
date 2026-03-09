import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateToken } from "@/lib/microsoft-auth";

/**
 * GET /api/auth/microsoft/me
 * Returns current user info from Microsoft session
 */
export async function GET(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get("ms_access_token")?.value;

		if (!accessToken) {
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);
		}

		const userInfo = await validateToken(accessToken);

		if (!userInfo) {
			return NextResponse.json(
				{ error: "Invalid session" },
				{ status: 401 }
			);
		}

		return NextResponse.json({
			id: userInfo.id,
			email: userInfo.email,
			name: userInfo.name,
			role: "User", // Map based on your org structure
		});
	} catch (error) {
		console.error("Session validation error:", error);
		return NextResponse.json(
			{ error: "Failed to validate session" },
			{ status: 500 }
		);
	}
}
