import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { listUsers, normalizeEmail } from "@/lib/remote-user-store";

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
		}

		console.log("[login] Attempting login for email:", email);
		const normalizedEmail = normalizeEmail(email);
		console.log("[login] Normalized email:", normalizedEmail);
		
		const users = await listUsers();
		console.log("[login] Total users available:", users.length);
		
		const data = users.find((user) => normalizeEmail(user.email) === normalizedEmail);
		console.log("[login] User found:", data ? "yes" : "no");
		
		if (!data || !data.password_hash) {
			console.log("[login] User not found or no password hash");
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		console.log("[login] Comparing password for user:", normalizedEmail);
		const isValid = await bcrypt.compare(password, data.password_hash);
		console.log("[login] Password comparison result:", isValid ? "valid" : "invalid");
		
		if (!isValid) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		console.log("[login] Login successful for:", normalizedEmail);
		return NextResponse.json({
			id: data.id,
			name: data.name,
			email: data.email,
			role: data.role,
			avatarUrl: data.avatar_url ?? undefined,
			permissions: data.permissions ?? undefined,
			lineManagerId: data.line_manager_id ?? undefined,
			lineManagerName: data.line_manager_name ?? undefined,
			department: data.department ?? undefined,
			jobTitle: data.job_title ?? undefined,
		});
	} catch (error) {
		if (error instanceof Error && error.message === "Not authenticated") {
			console.error("[login] Not authenticated error - no access token available");
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}
		if (error instanceof Error && error.message.includes("Remote auth is not configured")) {
			console.error("[login] Remote auth not configured");
			return NextResponse.json({ error: "Remote auth is not configured" }, { status: 503 });
		}
		console.error("[login] API error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
