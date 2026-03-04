import PageHeader from "@/components/PageHeader";
import { clients } from "@/lib/sample-data";

export default function CrmPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Client relationships"
        subtitle="CRM"
        actions={
          <>
            <button className="h-11 rounded-lg border border-gray-700/50 bg-gray-700/30 px-5 text-sm font-semibold text-white hover:bg-gray-700/50">
              Import list
            </button>
            <button className="h-11 rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-orange-600">
              Add client
            </button>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Active clients
          </p>
          <p className="font-display text-3xl font-semibold text-white">18</p>
          <p className="text-sm text-gray-400">4 awaiting follow-up</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Satisfaction
          </p>
          <p className="font-display text-3xl font-semibold text-white">92%</p>
          <p className="text-sm text-gray-400">Weekly pulse score</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Renewal pipeline
          </p>
          <p className="font-display text-3xl font-semibold text-white">£640k</p>
          <p className="text-sm text-gray-400">Next 90 days</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Client list
            </p>
            <p className="font-display text-2xl font-semibold text-white">
              Relationship overview
            </p>
          </div>
          <button className="h-10 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 text-xs font-semibold text-white hover:bg-gray-700/50">
            Export
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {clients.map((client) => (
            <div
              key={client.name}
              className="grid gap-2 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 py-3 text-sm md:grid-cols-[1.2fr_0.7fr_0.4fr_0.4fr]"
            >
              <div>
                <p className="font-semibold text-white">{client.name}</p>
                <p className="text-xs text-gray-400">Owner: {client.owner}</p>
              </div>
              <p className="text-gray-400">Projects: {client.projects}</p>
              <p className="text-gray-400">Status: {client.status}</p>
              <p className="font-semibold text-white">{client.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
