import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function mapUser(row: Record<string, unknown>) {
	return {
		id: row.id as string,
		name: row.name as string,
		email: row.email as string,
		role: row.role as string,
		avatarUrl: (row.avatar_url as string | null) ?? undefined,
		permissions: (row.permissions as string[] | null) ?? undefined,
		lineManagerId: (row.line_manager_id as string | null) ?? undefined,
		lineManagerName: (row.line_manager_name as string | null) ?? undefined,
		department: (row.department as string | null) ?? undefined,
		jobTitle: (row.job_title as string | null) ?? undefined,
	};
}

export async function GET() {
	try {
		const supabase = getSupabaseAdminClient();
		if (!supabase) {
			return NextResponse.json({ error: "Remote auth is not configured" }, { status: 503 });
		}

		const { data, error } = await supabase
			.from("app_users")
			.select("id,name,email,role,avatar_url,permissions,line_manager_id,line_manager_name,department,job_title")
			.order("name", { ascending: true });

		if (error) {
			console.error("List users failed:", error);
			return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
		}

		return NextResponse.json((data ?? []).map((row) => mapUser(row as Record<string, unknown>)));
	} catch (error) {
		console.error("Users GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const supabase = getSupabaseAdminClient();
		if (!supabase) {
			return NextResponse.json({ error: "Remote auth is not configured" }, { status: 503 });
		}

		const payload = await request.json();
		const normalizedEmail = normalizeEmail(payload.email || "");

		if (!payload.name || !normalizedEmail || !payload.password || !payload.role) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const { data: existing } = await supabase
			.from("app_users")
			.select("id")
			.eq("email", normalizedEmail)
			.maybeSingle();

		if (existing) {
			return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
		}

		const passwordHash = await bcrypt.hash(payload.password, 10);

		const { data, error } = await supabase
			.from("app_users")
			.insert({
				name: payload.name,
				email: normalizedEmail,
				role: payload.role,
				password_hash: passwordHash,
				permissions: payload.permissions ?? null,
				line_manager_id: payload.lineManagerId ?? null,
				line_manager_name: payload.lineManagerName ?? null,
				department: payload.department ?? null,
				job_title: payload.jobTitle ?? null,
			})
			.select("id,name,email,role,avatar_url,permissions,line_manager_id,line_manager_name,department,job_title")
			.single();

		if (error) {
			console.error("Create user failed:", error);
			return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
		}

		return NextResponse.json(mapUser(data as Record<string, unknown>));
	} catch (error) {
		console.error("Users POST error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function PATCH(request: Request) {
	try {
		const supabase = getSupabaseAdminClient();
		if (!supabase) {
			return NextResponse.json({ error: "Remote auth is not configured" }, { status: 503 });
		}

		const payload = await request.json();
		if (!payload.id) {
			return NextResponse.json({ error: "User id is required" }, { status: 400 });
		}

		const updates: Record<string, unknown> = {
			name: payload.name,
			email: payload.email ? normalizeEmail(payload.email) : undefined,
			role: payload.role,
			permissions: payload.permissions,
			line_manager_id: payload.lineManagerId,
			line_manager_name: payload.lineManagerName,
			department: payload.department,
			job_title: payload.jobTitle,
		};

		Object.keys(updates).forEach((key) => {
			if (updates[key] === undefined) {
				delete updates[key];
			}
		});

		const { data, error } = await supabase
			.from("app_users")
			.update(updates)
			.eq("id", payload.id)
			.select("id,name,email,role,avatar_url,permissions,line_manager_id,line_manager_name,department,job_title")
			.single();

		if (error) {
			console.error("Update user failed:", error);
			return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
		}

		return NextResponse.json(mapUser(data as Record<string, unknown>));
	} catch (error) {
		console.error("Users PATCH error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const supabase = getSupabaseAdminClient();
		if (!supabase) {
			return NextResponse.json({ error: "Remote auth is not configured" }, { status: 503 });
		}

		const payload = await request.json();
		if (!payload.id) {
			return NextResponse.json({ error: "User id is required" }, { status: 400 });
		}

		const { error } = await supabase
			.from("app_users")
			.delete()
			.eq("id", payload.id);

		if (error) {
			console.error("Delete user failed:", error);
			return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Users DELETE error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
