import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
		}

		const supabase = getSupabaseAdminClient();
		if (!supabase) {
			return NextResponse.json({ error: "Remote auth is not configured" }, { status: 503 });
		}

		const normalizedEmail = normalizeEmail(email);
		const { data, error } = await supabase
			.from("app_users")
			.select("id,name,email,role,avatar_url,permissions,line_manager_id,line_manager_name,department,job_title,password_hash")
			.eq("email", normalizedEmail)
			.maybeSingle();

		if (error) {
			console.error("Login query failed:", error);
			return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
		}

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
		console.error("Login API error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
