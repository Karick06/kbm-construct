import PermissionGuard from "@/components/PermissionGuard";

import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { invoices } from "@/lib/sample-data";

export default function InvoicesPage() {
  return (
    <PermissionGuard permission="invoices">
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Billing and collections"
        subtitle="Invoices"
        actions={
          <>
            <button className="h-11 rounded-lg border border-gray-700/50 bg-gray-700/30 px-5 text-sm font-semibold text-white hover:bg-gray-700/50">
              Sync payments
            </button>
            <button className="h-11 rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-orange-600">
              New invoice
            </button>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Outstanding
          </p>
          <p className="font-display text-3xl font-semibold text-white">£54.2k</p>
          <p className="text-sm text-gray-400">Across 8 invoices</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Paid this month
          </p>
          <p className="font-display text-3xl font-semibold text-white">£88.4k</p>
          <p className="text-sm text-gray-400">+12% vs last month</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Average days
          </p>
          <p className="font-display text-3xl font-semibold text-white">16</p>
          <p className="text-sm text-gray-400">Payment cycle time</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Invoice ledger
            </p>
            <p className="font-display text-2xl font-semibold text-white">
              Recent activity
            </p>
          </div>
          <button className="h-10 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 text-xs font-semibold text-white hover:bg-gray-700/50">
            Filter
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="grid gap-2 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 py-3 text-sm md:grid-cols-[0.6fr_1.2fr_0.6fr_0.6fr]"
            >
              <p className="font-semibold text-white">{invoice.id}</p>
              <p className="text-gray-400">{invoice.client}</p>
              <p className="font-semibold text-white">{invoice.amount}</p>
              <div className="flex items-center justify-between gap-2">
                <StatusPill label={invoice.status} tone={invoice.status} />
                <span className="text-xs text-gray-400">
                  {invoice.due}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
    </PermissionGuard>
  );
}
