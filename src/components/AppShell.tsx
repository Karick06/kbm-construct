"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

const navSections = [
  { 
    label: "Business Overview", 
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Chat", href: "/chat" },
    ] 
  },
  { 
    label: "Business Development", 
    items: [
      { label: "BD Overview", href: "/bd-overview" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "Clients", href: "/clients" },
      { label: "Tender Portal", href: "/tender-portal" },
    ] 
  },
  { 
    label: "Estimating", 
    items: [
      { label: "Estimating Overview", href: "/estimating-overview" },
      { label: "Labour Rates", href: "/labour-rates" },
      { label: "Plant Rates", href: "/plant-rates" },
      { label: "Material Rates", href: "/material-rates" },
      { label: "BoQ Creator", href: "/boq-creator" },
      { label: "Archive", href: "/archive" },
    ] 
  },
  { 
    label: "Operations", 
    items: [
      { label: "Operations Overview", href: "/operations-overview" },
      { label: "Projects", href: "/projects" },
      { label: "Tasks", href: "/tasks" },
      { label: "Schedule", href: "/schedule" },
    ] 
  },
  { 
    label: "Commercial", 
    items: [
      { label: "Commercial Overview", href: "/commercial-overview" },
      { label: "Invoices", href: "/invoices" },
      { label: "Payments", href: "/payments" },
      { label: "Contracts", href: "/contracts" },
    ] 
  },
  { 
    label: "Procurement", 
    items: [
      { label: "Procurement Overview", href: "/procurement-overview" },
      { label: "Suppliers", href: "/suppliers" },
      { label: "Purchase Orders", href: "/purchase-orders" },
      { label: "Materials", href: "/materials" },
    ] 
  },
  { 
    label: "Resources", 
    items: [
      { label: "Resources Overview", href: "/resources-overview" },
      { label: "Staff", href: "/staff" },
      { label: "Skills", href: "/skills" },
      { label: "Allocation", href: "/allocation" },
      { label: "Timesheets", href: "/timesheets-overview" },
      { label: "My Timesheets", href: "/my-timesheets" },
      { label: "Geofences", href: "/geofences" },
    ] 
  },
  { 
    label: "H&S", 
    items: [
      { label: "H&S Overview", href: "/hs-overview" },
      { label: "Incidents", href: "/incidents" },
      { label: "Compliance", href: "/compliance" },
      { label: "Training", href: "/training" },
    ] 
  },
  { 
    label: "Vehicles/ Plant", 
    items: [
      { label: "Fleet Overview", href: "/fleet-overview" },
      { label: "Fleet", href: "/fleet" },
      { label: "Maintenance", href: "/maintenance" },
      { label: "Bookings", href: "/bookings" },
    ] 
  },
  { 
    label: "Libraries", 
    items: [
      { label: "Documents", href: "/documents" },
      { label: "Templates", href: "/library-templates" },
      { label: "Resources", href: "/library-resources" },
    ] 
  },
  { 
    label: "HR", 
    items: [
      { label: "HR Overview", href: "/hr-overview" },
      { label: "Team", href: "/team" },
      { label: "Leave", href: "/leave" },
      { label: "Payroll", href: "/payroll" },
    ] 
  },
  { 
    label: "Settings", 
    items: [
      { label: "User Settings", href: "/settings" },
      { label: "User Management", href: "/admin", adminOnly: true },
      { label: "Sage Integration", href: "/sage-settings" },
    ] 
  },
];

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--body-ink)]">
      <aside className="hidden w-64 shrink-0 flex-col gap-8 overflow-y-auto border-r border-[var(--line)] bg-[var(--sidebar-bg)] p-6 lg:flex">
        <div className="w-full">
          <Image
            src="/valescape-logo.png"
            alt="Valescape"
            width={200}
            height={33}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* User Info */}
        {user && (
          <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3">
            <p className="text-xs font-semibold text-[var(--body-ink)]">
              {user.name}
            </p>
            <p className="text-xs text-[var(--body-muted)]">{user.role}</p>
          </div>
        )}

        <nav className="space-y-4 flex-1">
          {navSections.map((section) => (
            <div key={section.label} className="mt-6 space-y-3 first:mt-0">
              <div className="border-l-4 border-[var(--accent)] pl-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--sidebar-muted)]">
                  {section.label}
                </p>
              </div>
              <div className="space-y-1">
                {section.items
                  .filter((item: any) => !item.adminOnly || isAdmin())
                  .map((item: any) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-auto rounded border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--body-ink)] transition hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Sign Out
        </button>
      </aside>

      <main className="w-full flex-1 overflow-auto bg-[var(--bg)] p-4 pt-20 lg:p-8 lg:pt-8 lg:flex-1">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
