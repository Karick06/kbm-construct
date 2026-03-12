"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useFloatingChat } from "@/lib/floating-chat-context";
import FloatingChat from "@/components/FloatingChat";

const formatTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Each item can have:
//   permission  – user must have this permission
// If a section's visible item count drops to 0, the entire section is hidden.
const navSections = [
  {
    label: "Business Overview",
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Chat", href: "/chat" },
    ],
  },
  {
    label: "Business Development",
    items: [
      { label: "CRM Dashboard", href: "/crm", permission: "clients" },
      { label: "Campaigns", href: "/campaigns", permission: "clients" },
      { label: "Clients", href: "/clients", permission: "clients" },
      { label: "Tender Portal", href: "/tender-portal", permission: "clients" },
    ],
  },
  {
    label: "Estimating",
    items: [
      { label: "Estimating Overview", href: "/estimating-overview", permission: "estimates" },
      { label: "Labour Rates", href: "/labour-rates", permission: "estimates" },
      { label: "Plant Rates", href: "/plant-rates", permission: "estimates" },
      { label: "Material Rates", href: "/material-rates", permission: "estimates" },
      { label: "Archive", href: "/archive", permission: "estimates" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Operations Overview", href: "/operations-overview", permission: "projects" },
      { label: "Projects", href: "/projects", permission: "projects" },
      { label: "Tasks", href: "/tasks", permission: "projects" },
      { label: "Schedule", href: "/schedule", permission: "projects" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { label: "Commercial Overview", href: "/commercial-overview", permission: "invoices" },
      { label: "Invoices", href: "/invoices", permission: "invoices" },
      { label: "Payments", href: "/payments", permission: "payments" },
      { label: "Contracts", href: "/contracts", permission: "contracts" },
    ],
  },
  {
    label: "Finance & QS",
    items: [
      { label: "QS Overview", href: "/qs-overview", permission: "invoices" },
      { label: "Payment Documents", href: "/payment-documents", permission: "payments" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { label: "Procurement Overview", href: "/procurement-overview", permission: "procurement" },
      { label: "Suppliers", href: "/suppliers", permission: "procurement" },
      { label: "Purchase Orders", href: "/purchase-orders", permission: "procurement" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Resources Overview", href: "/resources-overview", permission: "resources" },
      { label: "Staff", href: "/staff", permission: "staff" },
      { label: "Skills", href: "/skills", permission: "staff" },
      { label: "Allocation", href: "/allocation", permission: "resources" },
      { label: "Timesheets", href: "/timesheets-overview", permission: "timesheets" },
      { label: "My Timesheets", href: "/my-timesheets" },
      { label: "Geofences", href: "/geofences", permission: "timesheets" },
    ],
  },
  {
    label: "Project Management",
    items: [
      { label: "Site Diary", href: "/site-diary", permission: "projects" },
      { label: "Quality Inspections", href: "/quality-inspections", permission: "projects" },
      { label: "Permits to Work", href: "/permits-to-work", permission: "projects" },
      { label: "Toolbox Talks", href: "/toolbox-talks", permission: "projects" },
      { label: "Variation Orders", href: "/variation-orders", permission: "projects" },
      { label: "RFIs", href: "/rfis", permission: "projects" },
      { label: "Defects/Snagging", href: "/defects", permission: "projects" },
      { label: "Photo Documentation", href: "/photos", permission: "projects" },
      { label: "As-Built Drawings", href: "/as-built-drawings", permission: "projects" },
      { label: "Handover Documentation", href: "/handover-documentation", permission: "projects" },
      { label: "Lessons Learned", href: "/lessons-learned", permission: "projects" },
      { label: "Plant Booking", href: "/plant-booking", permission: "projects" },
      { label: "Material Reconciliation", href: "/material-reconciliation", permission: "projects" },
      { label: "Weather Logging", href: "/weather-logging", permission: "projects" },
    ],
  },
  {
    label: "H&S",
    items: [
      { label: "H&S Overview", href: "/hs-overview", permission: "compliance" },
      { label: "Incidents", href: "/incidents", permission: "compliance" },
      { label: "Compliance & RAMS", href: "/compliance", permission: "compliance" },
      { label: "Training", href: "/training", permission: "training" },
    ],
  },
  {
    label: "Vehicles / Plant",
    items: [
      { label: "Fleet Overview", href: "/fleet-overview", permission: "fleet" },
      { label: "Fleet", href: "/fleet", permission: "fleet" },
      { label: "Maintenance", href: "/maintenance", permission: "fleet" },
      { label: "Bookings", href: "/bookings", permission: "fleet" },
    ],
  },
  {
    label: "Libraries",
    items: [
      { label: "Documents", href: "/documents", permission: "documents" },
      { label: "Templates", href: "/library-templates", permission: "documents" },
      { label: "Resources", href: "/library-resources", permission: "documents" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Drawing Measurement", href: "/drawing-measurement" },
      { label: "Materials Calculator", href: "/tools/materials-calculator" },
      { label: "Civils & Groundworks Rate Builder", href: "/tools/civils-rate-builder" },
    ],
  },
  {
    label: "HR",
    items: [
      { label: "HR Overview", href: "/hr-overview", permission: "leave" },
      { label: "Team", href: "/team", permission: "staff" },
      { label: "Leave", href: "/leave", permission: "leave" },
      { label: "Payroll", href: "/payroll", permission: "payroll" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "User Settings", href: "/settings" },
      { label: "User Management", href: "/admin", permission: "user_management" },
      { label: "Sage Integration", href: "/sage-settings" },
    ],
  },
];

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();
  const { notifications, unreadCount, markAsRead, dismissNotification, markAllAsRead } = useNotifications();
  const { toggleChat } = useFloatingChat();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setShowNotifications(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--body-ink)]">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[var(--line)] bg-[var(--bg)] px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="w-50 shrink-0 mt-[2pt]">
            <Image
              src="/valescape-logo.png"
              alt="Valescape"
              width={313}
              height={52}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Profile on Right */}
          <div className="flex items-center gap-0">
            {/* Chat Pop-out Button */}
            <button
              onClick={() => toggleChat()}
              className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-300 transition ml-[19px] mt-[10px]"
              title="Open floating chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

            {/* Notifications Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-300 transition ml-[19px] mt-[10px]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                  <div className="border-b border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      <span className="text-xs text-gray-400">{unreadCount} unread</span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <p className="text-3xl mb-2">🔕</p>
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full border-b border-gray-700 p-4 text-left transition-colors hover:bg-gray-700/50 ${
                            !notif.read ? "bg-blue-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">{notif.title}</p>
                              <p className="mt-1 text-xs text-gray-400">{notif.message}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(notif.timestamp).toLocaleDateString()} at{" "}
                                {new Date(notif.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-700 p-2">
                      <button
                        onClick={() => markAllAsRead()}
                        className="w-full rounded py-2 text-xs text-gray-400 hover:bg-gray-700/50 hover:text-white"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative ml-4" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--sidebar-hover)] rounded-lg transition"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-semibold text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'MP'}
                </div>
                <svg className="w-4 h-4 text-[var(--sidebar-muted)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Profile Dropdown Panel */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg)] border border-[var(--line)] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-[var(--line)]">
                    <p className="text-sm font-medium text-[var(--body-ink)]">{user?.name}</p>
                    <p className="text-xs text-[var(--sidebar-muted)]">{user?.email}</p>
                  </div>
                  <div className="space-y-1 p-2">
                    <Link href="/settings" className="block px-3 py-2 text-sm text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] rounded transition">
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar (Left) + Content (Right) */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden lg:block w-64 border-r border-[var(--line)] bg-[var(--sidebar-bg)] overflow-y-auto">
          <nav className="space-y-4 p-4">
            {navSections.map((section) => {
              const visibleItems = section.items.filter((item: any) => {
                if (item.permission && !hasPermission(item.permission)) return false;
                return true;
              });
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sidebar-muted)] mb-2 border-l-2 border-[var(--accent)] pl-2">
                    {section.label}
                  </p>
                  <div className="space-y-1 ml-2">
                    {visibleItems.map((item: any) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-3 py-2 text-sm rounded transition ${
                            isActive
                              ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                              : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[var(--bg)] px-2 py-4 lg:p-8">
          <div className="min-h-screen max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Chat */}
      <FloatingChat />
    </div>
  );
}
