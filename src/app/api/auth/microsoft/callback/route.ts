import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCode } from "@/lib/microsoft-auth";
import { cookies } from "next/headers";

/**
 * GET /api/auth/microsoft/callback
 * Handles OAuth callback and sets session
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const error = searchParams.get("error");

	if (error) {
		console.error("Microsoft auth error:", error);
		return NextResponse.redirect(
			new URL(`/login?ms_error=${encodeURIComponent(error)}`, request.url)
		);
	}

	if (!code) {
		return NextResponse.redirect(
			new URL("/login?ms_error=no_code", request.url)
		);
	}

	try {
		const appOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const redirectUri = `${appOrigin}/api/auth/microsoft/callback`;
		const userInfo = await getTokenFromCode(code, redirectUri);

		// Set secure HTTP-only cookies
		const cookieStore = await cookies();
		
		cookieStore.set("ms_access_token", userInfo.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60, // 1 hour
			path: "/",
		});

		if (userInfo.refreshToken) {
			cookieStore.set("ms_refresh_token", userInfo.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 30, // 30 days
				path: "/",
			});
		}

		cookieStore.set("ms_user_id", userInfo.id, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});

		cookieStore.set("user_email", userInfo.email, {
			httpOnly: false, // Accessible to client
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});

		cookieStore.set("user_name", userInfo.name, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});

		// Redirect to dashboard
		return NextResponse.redirect(new URL("/", request.url));
	} catch (error) {
		// Log full error server-side only — never expose Azure internals to users
		const message = error instanceof Error ? error.message : "Unknown callback error";
		console.error("Microsoft callback error:", message, error);
		return NextResponse.redirect(
			new URL("/login?ms_error=auth_failed", request.url)
		);
	}
}
