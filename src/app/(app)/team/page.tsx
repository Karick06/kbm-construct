import PageHeader from "@/components/PageHeader";
import { team } from "@/lib/sample-data";

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team and resources"
        subtitle="Team"
        actions={
          <>
            <button className="h-11 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)]">
              Invite
            </button>
            <button className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white">
              Plan capacity
            </button>
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
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Workforce balance
        </p>
        <p className="font-display text-2xl font-semibold">
          12 active roles, 3 contractors
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Scheduling", "Client success", "Commercial"].map((group) => (
            <div
              key={group}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm"
            >
              <p className="font-semibold text-[var(--ink)]">{group}</p>
              <p className="text-xs text-[var(--muted)]">Load: 72%</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
