import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listUsers, normalizeEmail, type UserRow } from "@/lib/remote-user-store";

const REMOTE_AUTH_ENABLED = ["supabase", "microsoft"].includes(process.env.NEXT_PUBLIC_AUTH_MODE || "");

type PermissionCheckResult =
  | { ok: true; user: UserRow }
  | { ok: false; response: NextResponse };

export async function requireApiPermission(permission: string): Promise<PermissionCheckResult> {
  if (!REMOTE_AUTH_ENABLED) {
    return {
      ok: true,
      user: {
        id: "local-dev",
        name: "Local Developer",
        email: "local@kbm.dev",
        role: "Developer",
        permissions: [permission],
      },
    };
  }

  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("user_email")?.value;

    if (!userEmail) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
      };
    }

    const users = await listUsers();
    const actor = users.find((user) => normalizeEmail(user.email) === normalizeEmail(userEmail));

    if (!actor) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    const permissions = actor.permissions ?? [];
    if (!permissions.includes(permission)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return { ok: true, user: actor };
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return {
        ok: false,
        response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
      };
    }

    if (error instanceof Error && error.message.includes("Remote auth is not configured")) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 }),
      };
    }

    console.error("Permission check failed:", error);
    return {
      ok: false,
      response: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}
