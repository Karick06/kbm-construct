"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  focus: string;
};

export default function StaffPage() {
  const { getAllUsers } = useAuth();
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [team, setTeam] = useState<StaffMember[]>([]);

  useEffect(() => {
    const hydrate = () => {
      const users = getAllUsers();
      setTeam(
        users.map((user) => ({
          id: user.id,
          name: user.name,
          role: user.role,
          focus: user.department || user.jobTitle || user.role,
        }))
      );
    };

    hydrate();
    window.addEventListener("storage", hydrate);
    window.addEventListener("focus", hydrate);
    return () => {
      window.removeEventListener("storage", hydrate);
      window.removeEventListener("focus", hydrate);
    };
  }, [getAllUsers]);

  const roles = useMemo(
    () => ["all", ...Array.from(new Set(team.map((member) => member.role)))],
    [team]
  );
  
  const filteredStaff = team.filter(member => {
    const matchesRole = filterRole === "all" || member.role === filterRole;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.focus.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <PermissionGuard permission="staff">
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff Management"
        subtitle="Manage staff, roles, and assignments"
        actions={
          <Link href="/admin" className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-orange-600 inline-flex items-center">
            + Add Staff Member
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
        >
          {roles.map(role => (
            <option key={role} value={role}>
              {role === "all" ? "All Roles" : role}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--muted)] mb-1">Total Staff</p>
          <p className="text-2xl font-bold text-[var(--ink)]">{team.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--muted)] mb-1">Active</p>
          <p className="text-2xl font-bold text-green-500">{team.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--muted)] mb-1">On Leave</p>
          <p className="text-2xl font-bold text-yellow-500">0</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--muted)] mb-1">Roles</p>
          <p className="text-2xl font-bold text-[var(--accent)]">{roles.length - 1}</p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--surface-2)] border-b border-[var(--line)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Staff Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Focus Area</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member, index) => (
              <tr 
                key={member.id}
                className={`border-b border-[var(--line)] hover:bg-[var(--surface-2)] ${index % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{member.name}</p>
                      <p className="text-xs text-[var(--muted)]">ID: {member.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-500">
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--muted)]">{member.focus}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/10 text-green-500">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href="/team" className="px-3 py-1 rounded text-xs font-semibold text-[var(--accent)] hover:bg-[var(--surface-2)]">
                      View
                    </Link>
                    <Link href="/admin" className="px-3 py-1 rounded text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)]">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12 text-[var(--muted)]">
          No staff members found matching your search criteria.
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
