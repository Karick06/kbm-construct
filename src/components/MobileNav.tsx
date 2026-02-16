'use client';

import { useState } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

const navSections = [
  { 
    label: "Overview", 
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Chat", href: "/chat" },
    ] 
  },
  { 
    label: "Business Dev", 
    items: [
      { label: "BD Overview", href: "/bd-overview" },
      { label: "Clients", href: "/clients" },
      { label: "Tenders", href: "/tender-portal" },
    ] 
  },
  { 
    label: "Estimating", 
    items: [
      { label: "Overview", href: "/estimating-overview" },
      { label: "BoQ Creator", href: "/boq-creator" },
      { label: "Rates", href: "/labour-rates" },
    ] 
  },
  { 
    label: "Operations", 
    items: [
      { label: "Projects", href: "/projects" },
      { label: "Tasks", href: "/tasks" },
      { label: "Schedule", href: "/schedule" },
    ] 
  },
  { 
    label: "Resources", 
    items: [
      { label: "Staff", href: "/staff" },
      { label: "My Timesheets", href: "/my-timesheets" },
      { label: "Leave", href: "/leave" },
    ] 
  },
  { 
    label: "Settings", 
    items: [
      { label: "User Settings", href: "/settings" },
      { label: "Admin", href: "/admin", adminOnly: true },
    ] 
  },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <Image
          src="/valescape-logo.png"
          alt="KBM Construct"
          width={120}
          height={20}
          priority
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
          <nav className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 overflow-y-auto shadow-2xl">
            <div className="p-4">
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* User Info */}
              {user && (
                <div className="mt-4 mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.role}</p>
                </div>
              )}

              {/* Navigation Sections */}
              <div className="space-y-6">
                {navSections.map((section) => (
                  <div key={section.label}>
                    <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {section.label}
                    </p>
                    <div className="space-y-1">
                      {section.items
                        .filter((item: any) => !item.adminOnly || isAdmin())
                        .map((item: any) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-orange-100 text-orange-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="mt-8 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
