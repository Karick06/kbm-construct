import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateToken } from "@/lib/microsoft-auth";

/**
 * GET /api/auth/microsoft/me
 * Returns current user info from Microsoft session + their permissions
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

		// Try to load permissions from the users list stored client-side.
		// The frontend will handle fetching from localStorage after getting this response.
		// For now, return base user info and let frontend merge with localStorage permissions.
		return NextResponse.json({
			id: userInfo.id,
			email: userInfo.email,
			name: userInfo.name,
			role: "User", // Map based on your org structure
			// permissions: [] — will be merged by frontend from localStorage
		});
	} catch (error) {
		console.error("Session validation error:", error);
		return NextResponse.json(
			{ error: "Failed to validate session" },
			{ status: 500 }
		);
	}
}
