import PageHeader from "@/components/PageHeader";
import { reports } from "@/lib/sample-data";

const monthly = [
  { label: "Jan", value: 48 },
  { label: "Feb", value: 62 },
  { label: "Mar", value: 54 },
  { label: "Apr", value: 71 },
  { label: "May", value: 66 },
  { label: "Jun", value: 78 },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Performance analytics"
        subtitle="Reports"
        actions={
          <>
            <button className="h-11 rounded-lg border border-gray-700/50 bg-gray-700/30 px-5 text-sm font-semibold text-white hover:bg-gray-700/50">
              Download pack
            </button>
            <button className="h-11 rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-orange-600">
              Share board
            </button>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.label}
            className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              {report.label}
            </p>
            <p className="font-display text-3xl font-semibold text-white">{report.value}</p>
            <p className="text-sm text-gray-400">Trend {report.trend}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Monthly revenue
            </p>
            <p className="font-display text-2xl font-semibold text-white">
              £1.2m run rate
            </p>
          </div>
          <button className="h-10 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 text-xs font-semibold text-white hover:bg-gray-700/50">
            Export
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          {monthly.map((item) => (
            <div key={item.label} className="text-center">
              <div className="mx-auto flex h-32 w-10 items-end rounded-full bg-gray-700/30">
                <div
                  className="w-full rounded-full bg-[var(--accent-2)]"
                  style={{ height: `${item.value}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
