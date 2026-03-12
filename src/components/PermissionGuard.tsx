"use client";

/**
 * PermissionGuard
 *
 * Wraps a page or section and shows an "Access Denied" message when the
 * current user does not hold the required permission.
 *
 * - Always safe to nest multiple guards.
 *
 * Usage:
 *   <PermissionGuard permission="projects">
 *     <ProjectsPage />
 *   </PermissionGuard>
 */

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

interface PermissionGuardProps {
  /** The permission key, matching a value in PERMISSIONS (permissions.ts) */
  permission: string;
  children: ReactNode;
  /** Optional custom message shown when access is denied */
  message?: string;
}

export default function PermissionGuard({
  permission,
  children,
  message,
}: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--body-ink)] mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-[var(--sidebar-muted)] max-w-sm">
          {message ??
            "You don't have permission to view this section. Contact your administrator to request access."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
