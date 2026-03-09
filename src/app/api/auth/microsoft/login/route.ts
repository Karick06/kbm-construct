import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/microsoft-auth";

/**
 * GET /api/auth/microsoft/login
 * Initiates Microsoft OAuth flow
 */
export async function GET(request: NextRequest) {
	try {
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/microsoft/callback`;
		
		const authUrl = await getAuthorizationUrl(redirectUri);

		return NextResponse.json({ authUrl });
	} catch (error) {
		console.error("Microsoft login error:", error);
		return NextResponse.json(
			{ error: "Failed to initiate Microsoft login" },
			{ status: 500 }
		);
	}
}
