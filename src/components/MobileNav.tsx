'use client';

import { useState } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getVisibleNavSections } from "@/lib/navigation";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();
  const visibleNavSections = getVisibleNavSections(hasPermission);

  const handleLogout = () => {
    logout();
    router.push("/login");
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[var(--line)] bg-[#1f232a]/95 px-4 py-3 backdrop-blur-sm">
        <img
          src="/valescape-logo-white.png"
          alt="KBM Construct"
          className="h-auto w-[120px]"
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--sidebar-text)]"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <nav className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] overflow-y-auto border-l border-[var(--line)] bg-[var(--sidebar-bg)] shadow-2xl shadow-black/45">
            <div className="p-4">
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto block p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--sidebar-text)]"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* User Info */}
              {user && (
                <div className="app-panel mt-4 mb-6 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-semibold text-white">
                      {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--sidebar-text)]">{user.name}</p>
                      <p className="text-xs text-[var(--sidebar-muted)]">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Sections */}
              <div className="space-y-7">
                {visibleNavSections.map((section, sectionIndex) => {
                  const sectionActive = Boolean(
                    section.href &&
                      (pathname === section.href ||
                        (section.activeMatchPrefixes || []).some((prefix) => pathname.startsWith(prefix)))
                  );
                  return (
                    <div
                      key={section.label}
                      className={`pb-2 ${sectionIndex < visibleNavSections.length - 1 ? "border-b border-[var(--line)]/40" : ""}`}
                    >
                      {section.href ? (
                        <Link
                          href={section.href}
                          onClick={() => setIsOpen(false)}
                          className={`mb-2.5 block rounded-r-md border-l-2 px-2 py-1 text-sm font-bold uppercase tracking-wide transition ${
                            sectionActive
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-[var(--accent)] text-[var(--sidebar-text)]/90 hover:text-[var(--sidebar-text)]"
                          }`}
                        >
                          {section.label}
                        </Link>
                      ) : (
                        <p className="mb-2.5 rounded-r-md border-l-2 border-[var(--accent)] px-2 py-1 text-sm font-bold uppercase tracking-wide text-[var(--sidebar-text)]/90">
                          {section.label}
                        </p>
                      )}
                      {section.items && section.items.length > 0 && (
                        <div className="space-y-1.5">
                          {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="mt-8 w-full rounded-lg border border-[var(--line)] bg-[#2b3139] px-4 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
