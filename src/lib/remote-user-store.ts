import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getMsalInstance } from "@/lib/microsoft-auth";

export type UserRow = {
	id: string;
	name: string;
	email: string;
	role: string;
	avatar_url?: string | null;
	permissions?: string[] | null;
	line_manager_id?: string | null;
	line_manager_name?: string | null;
	department?: string | null;
	job_title?: string | null;
	password_hash?: string | null;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const USERS_FILE_NAME = process.env.SHAREPOINT_USERS_FILE_NAME || "kbm-users.json";
const BOOTSTRAP_ADMIN_EMAIL = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@kbm.com");
const BOOTSTRAP_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin123";
const BOOTSTRAP_ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME || "Admin User";

export function mapUser(row: Record<string, unknown>) {
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

function isMicrosoftMode() {
	return process.env.NEXT_PUBLIC_AUTH_MODE === "microsoft";
}

function isSupabaseMode() {
	return process.env.NEXT_PUBLIC_AUTH_MODE === "supabase";
}

async function getMicrosoftAccessTokenFromCookie(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get("ms_access_token")?.value ?? null;
}

async function getMicrosoftAppAccessToken(): Promise<string | null> {
	const clientId = process.env.MICROSOFT_CLIENT_ID;
	const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
	const tenantId = process.env.MICROSOFT_TENANT_ID;

	if (!clientId || !clientSecret || !tenantId) {
		console.warn("[getMicrosoftAppAccessToken] Missing credentials - clientId:", !!clientId, "clientSecret:", !!clientSecret, "tenantId:", !!tenantId);
		return null;
	}

	try {
		console.log("[getMicrosoftAppAccessToken] Attempting to acquire token for tenant:", tenantId);
		const msal = getMsalInstance();
		const tokenResponse = await msal.acquireTokenByClientCredential({
			scopes: ["https://graph.microsoft.com/.default"],
		});

		if (!tokenResponse?.accessToken) {
			console.warn("[getMicrosoftAppAccessToken] No access token in response");
			return null;
		}

		console.log("[getMicrosoftAppAccessToken] Successfully acquired app token");
		return tokenResponse.accessToken;
	} catch (error) {
		console.error("[getMicrosoftAppAccessToken] Failed to acquire Microsoft app token:", error);
		return null;
	}
}

async function getSharePointAccessToken(): Promise<string | null> {
	console.log("[getSharePointAccessToken] Attempting to get access token");
	
	const delegatedToken = await getMicrosoftAccessTokenFromCookie();
	if (delegatedToken) {
		console.log("[getSharePointAccessToken] Using delegated token from cookie");
		return delegatedToken;
	}

	console.log("[getSharePointAccessToken] No delegated token, attempting to get app token");
	const appToken = await getMicrosoftAppAccessToken();
	if (appToken) {
		console.log("[getSharePointAccessToken] Successfully obtained app token");
		return appToken;
	}

	console.warn("[getSharePointAccessToken] Failed to obtain any access token");
	return null;
}

function getSharePointUsersFileUrl(driveId: string): string {
	return `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${USERS_FILE_NAME}:/content`;
}

async function loadUsersFromSharePoint(accessToken: string): Promise<UserRow[]> {
	const driveId = process.env.SHAREPOINT_DRIVE_ID;
	if (!driveId) {
		throw new Error("SharePoint drive is not configured");
	}

	const response = await fetch(getSharePointUsersFileUrl(driveId), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		cache: "no-store",
	});

	if (response.status === 404) {
		return [];
	}

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to load SharePoint users: ${response.status} ${errorText}`);
	}

	const raw = (await response.json()) as unknown;
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw as UserRow[];
}

async function saveUsersToSharePoint(accessToken: string, users: UserRow[]): Promise<void> {
	const driveId = process.env.SHAREPOINT_DRIVE_ID;
	if (!driveId) {
		throw new Error("SharePoint drive is not configured");
	}

	const response = await fetch(getSharePointUsersFileUrl(driveId), {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(users, null, 2),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to save SharePoint users: ${response.status} ${errorText}`);
	}
}

async function ensureBootstrapAdminUser(
	accessToken: string,
	users: UserRow[]
): Promise<UserRow[]> {
	console.log("[ensureBootstrapAdminUser] Checking for bootstrap admin:", BOOTSTRAP_ADMIN_EMAIL);
	
	const existingBootstrapAdminIndex = users.findIndex(
		(user) => normalizeEmail(user.email) === BOOTSTRAP_ADMIN_EMAIL
	);

	if (existingBootstrapAdminIndex !== -1) {
		const existingBootstrapAdmin = users[existingBootstrapAdminIndex];
		console.log("[ensureBootstrapAdminUser] Found existing bootstrap admin");

		if (existingBootstrapAdmin.password_hash) {
			console.log("[ensureBootstrapAdminUser] Bootstrap admin already has password hash");
			return users;
		}

		console.log("[ensureBootstrapAdminUser] Adding password hash to existing bootstrap admin");
		const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 10);
		const updatedUsers = [...users];
		updatedUsers[existingBootstrapAdminIndex] = {
			...existingBootstrapAdmin,
			role: existingBootstrapAdmin.role || "Administrator",
			password_hash: passwordHash,
		};

		await saveUsersToSharePoint(accessToken, updatedUsers);
		console.log("[ensureBootstrapAdminUser] Saved bootstrap admin with password hash");
		return updatedUsers;
	}

	console.log("[ensureBootstrapAdminUser] Creating new bootstrap admin");
	const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 10);
	const bootstrapAdmin: UserRow = {
		id: crypto.randomUUID(),
		name: BOOTSTRAP_ADMIN_NAME,
		email: BOOTSTRAP_ADMIN_EMAIL,
		role: "Administrator",
		permissions: [],
		line_manager_id: null,
		line_manager_name: null,
		department: null,
		job_title: "Administrator",
		password_hash: passwordHash,
	};

	const bootstrappedUsers = [...users, bootstrapAdmin];
	await saveUsersToSharePoint(accessToken, bootstrappedUsers);
	console.log("[ensureBootstrapAdminUser] Created and saved new bootstrap admin");
	return bootstrappedUsers;
}

export async function listUsers(): Promise<UserRow[]> {
	if (isSupabaseMode()) {
		const supabase = getSupabaseAdminClient();
		if (!supabase) throw new Error("Remote auth is not configured");

		const { data, error } = await supabase
			.from("app_users")
			.select("id,name,email,role,avatar_url,permissions,line_manager_id,line_manager_name,department,job_title,password_hash")
			.order("name", { ascending: true });

		if (error) throw new Error(`Failed to load users: ${error.message}`);
		return (data ?? []) as UserRow[];
	}

	if (isMicrosoftMode()) {
		try {
			console.log("[listUsers] Starting for Microsoft mode");
			const accessToken = await getSharePointAccessToken();
			console.log("[listUsers] Access token obtained:", accessToken ? "yes" : "no");
			if (!accessToken) throw new Error("Not authenticated");
			
			const users = await loadUsersFromSharePoint(accessToken);
			console.log("[listUsers] Loaded users from SharePoint:", users.length);
			
			const result = await ensureBootstrapAdminUser(accessToken, users);
			console.log("[listUsers] After bootstrap check, users count:", result.length);
			console.log("[listUsers] Bootstrap admin present:", result.some(u => normalizeEmail(u.email) === BOOTSTRAP_ADMIN_EMAIL) ? "yes" : "no");
			
			return result;
		} catch (error) {
			console.error("[listUsers] Error:", error);
			throw error;
		}
	}

	throw new Error("Remote auth is not configured");
}

export async function createUser(payload: {
	name: string;
	email: string;
	password: string;
	role: string;
	permissions?: string[];
	lineManagerId?: string;
	lineManagerName?: string;
	department?: string;
	jobTitle?: string;
}): Promise<UserRow> {
	const normalizedEmail = normalizeEmail(payload.email);

	if (isSupabaseMode()) {
		const supabase = getSupabaseAdminClient();
		if (!supabase) throw new Error("Remote auth is not configured");

		const { data: existing } = await supabase
			.from("app_users")
			.select("id")
			.eq("email", normalizedEmail)
			.maybeSingle();

		if (existing) throw new Error("User with this email already exists");

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
			.select("id,name,email,role,avatar_url,permissions,line_manager_id,line_manager_name,department,job_title,password_hash")
			.single();

		if (error || !data) throw new Error(`Failed to create user: ${error?.message}`);
		return data as UserRow;
	}

	if (isMicrosoftMode()) {
		const accessToken = await getSharePointAccessToken();
		if (!accessToken) throw new Error("Not authenticated");

		const users = await loadUsersFromSharePoint(accessToken);
		if (users.some((user) => normalizeEmail(user.email) === normalizedEmail)) {
			throw new Error("User with this email already exists");
		}

		const passwordHash = await bcrypt.hash(payload.password, 10);
		const newUser: UserRow = {
			id: crypto.randomUUID(),
			name: payload.name,
			email: normalizedEmail,
			role: payload.role,
			permissions: payload.permissions ?? [],
			line_manager_id: payload.lineManagerId ?? null,
			line_manager_name: payload.lineManagerName ?? null,
			department: payload.department ?? null,
			job_title: payload.jobTitle ?? null,
			password_hash: passwordHash,
		};

		users.push(newUser);
		await saveUsersToSharePoint(accessToken, users);
		return newUser;
	}

	throw new Error("Remote auth is not configured");
}

export async function updateUser(payload: {
	id: string;
	name?: string;
	email?: string;
	role?: string;
	permissions?: string[];
	lineManagerId?: string;
	lineManagerName?: string;
	department?: string;
	jobTitle?: string;
}): Promise<UserRow> {
	if (isSupabaseMode()) {
		const supabase = getSupabaseAdminClient();
		if (!supabase) throw new Error("Remote auth is not configured");

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
			if (updates[key] === undefined) delete updates[key];
		});

		const { data, error } = await supabase
			.from("app_users")
			.update(updates)
			.eq("id", payload.id)
			.select("id,name,email,role,avatar_url,permissions,line_manager_id,line_manager_name,department,job_title,password_hash")
			.single();

		if (error || !data) throw new Error(`Failed to update user: ${error?.message}`);
		return data as UserRow;
	}

	if (isMicrosoftMode()) {
		const accessToken = await getSharePointAccessToken();
		if (!accessToken) throw new Error("Not authenticated");

		const users = await loadUsersFromSharePoint(accessToken);
		const userIndex = users.findIndex((user) => user.id === payload.id);
		if (userIndex === -1) throw new Error("User not found");

		const existing = users[userIndex];
		users[userIndex] = {
			...existing,
			name: payload.name ?? existing.name,
			email: payload.email ? normalizeEmail(payload.email) : existing.email,
			role: payload.role ?? existing.role,
			permissions: payload.permissions ?? existing.permissions ?? [],
			line_manager_id: payload.lineManagerId ?? existing.line_manager_id ?? null,
			line_manager_name: payload.lineManagerName ?? existing.line_manager_name ?? null,
			department: payload.department ?? existing.department ?? null,
			job_title: payload.jobTitle ?? existing.job_title ?? null,
		};

		await saveUsersToSharePoint(accessToken, users);
		return users[userIndex];
	}

	throw new Error("Remote auth is not configured");
}

export async function deleteUserById(id: string): Promise<void> {
	if (isSupabaseMode()) {
		const supabase = getSupabaseAdminClient();
		if (!supabase) throw new Error("Remote auth is not configured");

		const { error } = await supabase.from("app_users").delete().eq("id", id);
		if (error) throw new Error(`Failed to delete user: ${error.message}`);
		return;
	}

	if (isMicrosoftMode()) {
		const accessToken = await getSharePointAccessToken();
		if (!accessToken) throw new Error("Not authenticated");

		const users = await loadUsersFromSharePoint(accessToken);
		const nextUsers = users.filter((user) => user.id !== id);
		if (nextUsers.length === users.length) throw new Error("User not found");

		await saveUsersToSharePoint(accessToken, nextUsers);
		return;
	}

	throw new Error("Remote auth is not configured");
}
