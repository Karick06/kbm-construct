"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications-context";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--accent)]"></div>
          <p className="text-sm text-[var(--body-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render app if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <MobileNav />
      <NotificationsProvider>
        <AppShell>{children}</AppShell>
      </NotificationsProvider>
    </>
  );
}
