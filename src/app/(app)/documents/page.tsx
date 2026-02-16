import PageHeader from "@/components/PageHeader";
import { documents } from "@/lib/sample-data";

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Document library"
        subtitle="Documents"
        actions={
          <>
            <button className="h-11 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)]">
              Upload
            </button>
            <button className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white">
              New folder
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {documents.map((doc) => (
          <div
            key={doc.title}
            className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-lg font-semibold text-[var(--accent)]">
              DOC
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--ink)]">
              {doc.title}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {doc.owner} · {doc.updated}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Storage health
        </p>
        <p className="font-display text-2xl font-semibold">
          68% used of 2.5TB
        </p>
        <div className="mt-4 h-3 w-full rounded-full bg-[var(--surface-2)]">
          <div className="h-3 w-[68%] rounded-full bg-[var(--accent)]" />
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Clean out archive files to keep the workspace fast.
        </p>
      </section>
    </div>
  );
}
