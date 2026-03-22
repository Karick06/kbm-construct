"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getVisibleNavSections, type NavSection } from "@/lib/navigation";
import { useNotifications } from "@/lib/notifications-context";
import { useFloatingChat } from "@/lib/floating-chat-context";
import FloatingChat from "@/components/FloatingChat";

type AppShellProps = {
  children: ReactNode;
};

function formatNotificationTimestamp(value?: string | Date) {
  if (!value) {
    return "Unknown time";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }

  return `${parsed.toLocaleDateString()} at ${parsed.toLocaleTimeString()}`;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { toggleChat } = useFloatingChat();
  const visibleNavSections = getVisibleNavSections(hasPermission);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [expandedSectionLabel, setExpandedSectionLabel] = useState<string>("");
  const lastPathnameRef = useRef<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isSectionActive = (section: NavSection) => {
    const matchesSectionHref = Boolean(
      section.href &&
        (pathname === section.href ||
          (section.activeMatchPrefixes || []).some((prefix) => pathname.startsWith(prefix)))
    );

    if (matchesSectionHref) return true;

    const sectionItems = section.items || [];
    return sectionItems.some(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
  };

  useEffect(() => {
    if (lastPathnameRef.current === pathname) {
      return;
    }

    const activeSection = visibleNavSections.find((section) => isSectionActive(section));

    setExpandedSectionLabel(activeSection?.label || "");
    lastPathnameRef.current = pathname;
  }, [pathname, visibleNavSections]);

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
    <div className="kbm-theme flex min-h-screen flex-col bg-[var(--bg)] text-[var(--body-ink)]">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[var(--line)] bg-[#1f232a]/95 px-4 py-3 backdrop-blur-sm lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="w-50 shrink-0 mt-[2pt]">
            <img
              src="/valescape-logo-white.png"
              alt="Valescape"
              className="h-auto w-full"
            />
          </div>

          {/* Profile on Right */}
          <div className="flex items-center gap-0">
            {/* Chat Pop-out Button */}
            <button
              onClick={() => toggleChat()}
              className="relative ml-[19px] mt-[10px] flex h-10 w-10 items-center justify-center text-gray-300 transition hover:text-white"
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
                className="relative ml-[19px] mt-[10px] flex h-10 w-10 items-center justify-center text-gray-300 transition hover:text-white"
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
                <div className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-2xl border border-gray-600/70 bg-[#1f232a] shadow-2xl shadow-black/45">
                  <div className="border-b border-gray-600/70 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      <span className="text-xs text-gray-300">{unreadCount} unread</span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-300">
                        <p className="text-3xl mb-2">🔕</p>
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full border-b border-gray-600/60 p-4 text-left transition-colors hover:bg-gray-700/35 ${
                            !notif.read ? "bg-amber-500/10" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">{notif.title}</p>
                              <p className="mt-1 text-xs text-gray-300">{notif.message}</p>
                              <p className="mt-1 text-xs text-gray-400">
                                {formatNotificationTimestamp(notif.timestamp)}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="h-2 w-2 rounded-full bg-amber-400" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-600/70 p-2">
                      <button
                        onClick={() => markAllAsRead()}
                        className="w-full rounded-md py-2 text-xs text-gray-300 hover:bg-gray-700/45 hover:text-white"
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
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-[var(--sidebar-hover)]"
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
                <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--line)] bg-[#1f232a] shadow-2xl shadow-black/45">
                  <div className="border-b border-[var(--line)] p-3">
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
        <aside className="hidden w-64 overflow-y-auto border-r border-[var(--line)] bg-[var(--sidebar-bg)] lg:block">
          <nav className="space-y-5 p-4">
            {visibleNavSections.map((section, sectionIndex) => {
              const sectionActive = isSectionActive(section);
              const sectionItems = section.items || [];
              const hasItems = sectionItems.length > 0;
              const isExpanded = hasItems && expandedSectionLabel === section.label;
              return (
                <div
                  key={section.label}
                  className={`pb-2 ${sectionIndex < visibleNavSections.length - 1 ? "border-b border-[var(--line)]/40" : ""}`}
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    {section.href ? (
                      <Link
                        href={section.href}
                        className={`flex-1 rounded-r-md border-l-2 px-2 py-1 text-sm font-bold uppercase tracking-wide transition ${
                          sectionActive
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--accent)] text-[var(--sidebar-text)]/90 hover:text-[var(--sidebar-text)]"
                        }`}
                      >
                        {section.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => hasItems && setExpandedSectionLabel((current) => (current === section.label ? "" : section.label))}
                        className="flex-1 rounded-r-md border-l-2 border-[var(--accent)] px-2 py-1 text-left text-sm font-bold uppercase tracking-wide text-[var(--sidebar-text)]/90 hover:text-[var(--sidebar-text)]"
                        aria-expanded={hasItems ? isExpanded : undefined}
                      >
                        {section.label}
                      </button>
                    )}
                    {hasItems && (
                      <button
                        type="button"
                        onClick={() => setExpandedSectionLabel((current) => (current === section.label ? "" : section.label))}
                        className="rounded px-1 py-1 text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                        aria-label={`Toggle ${section.label} links`}
                        aria-expanded={isExpanded}
                      >
                        <svg
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {hasItems && isExpanded && (
                    <div className="ml-2 space-y-1.5">
                      {sectionItems.map((item) => {
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
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-transparent px-2 py-4 lg:p-8">
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
