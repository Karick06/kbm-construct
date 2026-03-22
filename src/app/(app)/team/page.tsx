"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  focus: string;
};

export default function TeamPage() {
  const { getAllUsers } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);

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

  const workforceBalance = useMemo(() => {
    const byFocus = new Map<string, number>();
    team.forEach((member) => {
      byFocus.set(member.focus, (byFocus.get(member.focus) || 0) + 1);
    });

    return Array.from(byFocus.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([focus, count]) => ({
        focus,
        load: team.length ? Math.round((count / team.length) * 100) : 0,
      }));
  }, [team]);

  const contractorCount = useMemo(
    () => team.filter((member) => /contractor/i.test(member.role)).length,
    [team]
  );

  const activeRoles = useMemo(
    () => new Set(team.map((member) => member.role)).size,
    [team]
  );

  return (
    <PermissionGuard permission="staff">
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team and resources"
        subtitle="Team"
        actions={
          <>
            <Link href="/admin" className="h-11 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] inline-flex items-center">
              Invite
            </Link>
            <Link href="/allocation" className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white inline-flex items-center">
              Plan capacity
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        {team.map((member) => (
          <div
            key={member.name}
            className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                  {member.role}
                </p>
                <p className="font-display text-2xl font-semibold">
                  {member.name}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold text-[var(--accent)]">
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted)]">
              Focus: {member.focus}
            </div>
          </div>
        ))}
        {team.length === 0 && (
          <div className="md:col-span-2 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
            No team members found in user records.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Workforce balance
        </p>
        <p className="font-display text-2xl font-semibold">
          {activeRoles} active roles, {contractorCount} contractors
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {workforceBalance.map((group) => (
            <div
              key={group.focus}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm"
            >
              <p className="font-semibold text-[var(--ink)]">{group.focus}</p>
              <p className="text-xs text-[var(--muted)]">Load: {group.load}%</p>
            </div>
          ))}
          {workforceBalance.length === 0 && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted)]">
              No workload breakdown available.
            </div>
          )}
        </div>
      </section>
    </div>
    </PermissionGuard>
  );
}
