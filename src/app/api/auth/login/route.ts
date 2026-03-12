import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { listUsers, normalizeEmail } from "@/lib/remote-user-store";

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
		}

		const normalizedEmail = normalizeEmail(email);
		const users = await listUsers();
		const data = users.find((user) => normalizeEmail(user.email) === normalizedEmail);

		if (!data || !data.password_hash) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const isValid = await bcrypt.compare(password, data.password_hash);
		if (!isValid) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}
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
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}
		if (error instanceof Error && error.message.includes("Remote auth is not configured")) {
			return NextResponse.json({ error: "Remote auth is not configured" }, { status: 503 });
		}
		console.error("Login API error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
