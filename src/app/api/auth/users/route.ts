import { NextResponse } from "next/server";
import { createUser, deleteUserById, listUsers, mapUser, updateUser } from "@/lib/remote-user-store";
import { requireApiPermission } from "@/lib/api-permissions";

export async function GET() {
	try {
		const permissionCheck = await requireApiPermission("user_management");
		if (!permissionCheck.ok) return permissionCheck.response;

		const users = await listUsers();
		return NextResponse.json(users.map((row) => mapUser(row as Record<string, unknown>)));
	} catch (error) {
		if (error instanceof Error && error.message === "Not authenticated") {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}
		console.error("Users GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const permissionCheck = await requireApiPermission("user_management");
		if (!permissionCheck.ok) return permissionCheck.response;

		const payload = await request.json();
		const normalizedEmail = String(payload.email || "").trim().toLowerCase();

		if (!payload.name || !normalizedEmail || !payload.password || !payload.role) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const createdUser = await createUser({
			name: payload.name,
			email: normalizedEmail,
			password: payload.password,
			role: payload.role,
			permissions: payload.permissions ?? [],
			lineManagerId: payload.lineManagerId,
			lineManagerName: payload.lineManagerName,
			department: payload.department,
			jobTitle: payload.jobTitle,
		});

		return NextResponse.json(mapUser(createdUser as Record<string, unknown>));
	} catch (error) {
		if (error instanceof Error && error.message === "User with this email already exists") {
			return NextResponse.json({ error: error.message }, { status: 409 });
		}
		if (error instanceof Error && error.message === "Not authenticated") {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}
		console.error("Users POST error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function PATCH(request: Request) {
	try {
		const permissionCheck = await requireApiPermission("user_management");
		if (!permissionCheck.ok) return permissionCheck.response;

		const payload = await request.json();
		if (!payload.id) {
			return NextResponse.json({ error: "User id is required" }, { status: 400 });
		}

		const updatedUser = await updateUser({
			id: payload.id,
			name: payload.name,
			email: payload.email,
			role: payload.role,
			permissions: payload.permissions,
			lineManagerId: payload.lineManagerId,
			lineManagerName: payload.lineManagerName,
			department: payload.department,
			jobTitle: payload.jobTitle,
		});

		return NextResponse.json(mapUser(updatedUser as Record<string, unknown>));
	} catch (error) {
		if (error instanceof Error && error.message === "Not authenticated") {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}
		if (error instanceof Error && error.message === "User not found") {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
		console.error("Users PATCH error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const permissionCheck = await requireApiPermission("user_management");
		if (!permissionCheck.ok) return permissionCheck.response;

		const payload = await request.json();
		if (!payload.id) {
			return NextResponse.json({ error: "User id is required" }, { status: 400 });
		}

		await deleteUserById(payload.id as string);

		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof Error && error.message === "Not authenticated") {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}
		if (error instanceof Error && error.message === "User not found") {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
		console.error("Users DELETE error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
