import { NextResponse } from "next/server";
import { createUser, listUsers, normalizeEmail, updateUser } from "@/lib/remote-user-store";
import { requireApiPermission } from "@/lib/api-permissions";

type LocalUserPayload = {
	id?: string;
	name?: string;
	email?: string;
	role?: string;
	permissions?: string[];
	lineManagerId?: string;
	lineManagerName?: string;
	department?: string;
	jobTitle?: string;
};

export async function POST(request: Request) {
	try {
		const permissionCheck = await requireApiPermission("user_management");
		if (!permissionCheck.ok) return permissionCheck.response;

		const body = (await request.json()) as {
			users?: LocalUserPayload[];
			passwords?: Record<string, string>;
		};

		const localUsers = Array.isArray(body.users) ? body.users : [];
		const localPasswords = body.passwords ?? {};

		if (localUsers.length === 0) {
			return NextResponse.json({ error: "No local users provided" }, { status: 400 });
		}

		const remoteUsers = await listUsers();
		const remoteByEmail = new Map(
			remoteUsers.map((user) => [normalizeEmail(user.email), user])
		);

		let created = 0;
		let updated = 0;
		let skipped = 0;

		for (const localUser of localUsers) {
			if (!localUser.email || !localUser.name || !localUser.role) {
				skipped += 1;
				continue;
			}

			const email = normalizeEmail(localUser.email);
			const existingRemoteUser = remoteByEmail.get(email);

			if (existingRemoteUser) {
				await updateUser({
					id: existingRemoteUser.id,
					name: localUser.name,
					email,
					role: localUser.role,
					permissions: localUser.permissions ?? [],
					lineManagerId: localUser.lineManagerId,
					lineManagerName: localUser.lineManagerName,
					department: localUser.department,
					jobTitle: localUser.jobTitle,
				});
				updated += 1;
				continue;
			}

			const localPassword =
				localPasswords[email] ||
				localPasswords[localUser.email] ||
				`Temp-${crypto.randomUUID()}`;

			await createUser({
				name: localUser.name,
				email,
				password: localPassword,
				role: localUser.role,
				permissions: localUser.permissions ?? [],
				lineManagerId: localUser.lineManagerId,
				lineManagerName: localUser.lineManagerName,
				department: localUser.department,
				jobTitle: localUser.jobTitle,
			});
			created += 1;
		}

		return NextResponse.json({
			success: true,
			created,
			updated,
			skipped,
			totalLocalUsers: localUsers.length,
		});
	} catch (error) {
		if (error instanceof Error && error.message === "Not authenticated") {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		console.error("Local user migration error:", error);
		return NextResponse.json({ error: "Failed to migrate local users" }, { status: 500 });
	}
}
