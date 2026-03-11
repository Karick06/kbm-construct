"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useEffect, useMemo, useState } from "react";

type TenderFilter = {
  id: string;
  name: string;
  region: string;
  trade: string;
  lastSynced: string | null;
};

type TenderItem = {
  id: string;
  title: string;
  portal: string;
  region: string;
  trade: string;
  value: string;
  deadline: string;
  status: "Open" | "Closing Soon" | "Closed";
};

const REGION_OPTIONS = [
  "London",
  "South East",
  "South West",
  "Midlands",
  "North West",
  "North East",
  "Scotland",
  "Wales",
  "Northern Ireland",
];

const TRADE_OPTIONS = [
  "Civils",
  "Groundworks",
  "Tarmac",
  "Asphalt",
  "Surfacing",
  "Earthworks",
];

const PORTALS = [
  { name: "Constructionline", status: "Not connected" },
  { name: "Bidstats", status: "Not connected" },
  { name: "Contracts Finder", status: "Not connected" },
  { name: "Proactis", status: "Not connected" },
];

const MOCK_TENDERS: TenderItem[] = [
  {
    id: "TN-1001",
    title: "A127 Junction Improvements",
    portal: "Constructionline",
    region: "South East",
    trade: "Civils",
    value: "£2.4M",
    deadline: "2026-03-12",
    status: "Open",
  },
  {
    id: "TN-1002",
    title: "City Ring Road Resurfacing",
    portal: "Bidstats",
    region: "Midlands",
    trade: "Asphalt",
    value: "£850k",
    deadline: "2026-03-05",
    status: "Closing Soon",
  },
  {
    id: "TN-1003",
    title: "Rail Depot Access Roads",
    portal: "Contracts Finder",
    region: "North West",
    trade: "Groundworks",
    value: "£1.1M",
    deadline: "2026-03-19",
    status: "Open",
  },
  {
    id: "TN-1004",
    title: "Coastal Protection Works",
    portal: "Proactis",
    region: "Wales",
    trade: "Earthworks",
    value: "£3.6M",
    deadline: "2026-03-28",
    status: "Open",
  },
  {
    id: "TN-1005",
    title: "Logistics Park Surfacing",
    portal: "Constructionline",
    region: "London",
    trade: "Surfacing",
    value: "£620k",
    deadline: "2026-03-02",
    status: "Closing Soon",
  },
  {
    id: "TN-1006",
    title: "Airport Taxiway Repairs",
    portal: "Bidstats",
    region: "Scotland",
    trade: "Tarmac",
    value: "£4.2M",
    deadline: "2026-04-01",
    status: "Open",
  },
];

const STORAGE_KEY = "kbm-tender-portal-v1";

export default function TenderPortalPage() {
  const [filters, setFilters] = useState<TenderFilter[]>([
    {
      id: "F-001",
      name: "South East Civils",
      region: "South East",
      trade: "Civils",
      lastSynced: null,
    },
    {
      id: "F-002",
      name: "London Surfacing",
      region: "London",
      trade: "Surfacing",
      lastSynced: null,
    },
  ]);
  const [filterResults, setFilterResults] = useState<Record<string, TenderItem[]>>({});
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [newFilter, setNewFilter] = useState({
    name: "",
    region: REGION_OPTIONS[0],
    trade: TRADE_OPTIONS[0],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        filters: TenderFilter[];
        filterResults: Record<string, TenderItem[]>;
        activeFilterId: string | null;
      };
      if (Array.isArray(parsed.filters)) setFilters(parsed.filters);
      if (parsed.filterResults) setFilterResults(parsed.filterResults);
      if (parsed.activeFilterId) setActiveFilterId(parsed.activeFilterId);
    } catch {
      setFilters((prev) => prev);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ filters, filterResults, activeFilterId })
    );
  }, [filters, filterResults, activeFilterId]);

  const activeResults = useMemo(() => {
    if (!activeFilterId) return [];
    return filterResults[activeFilterId] ?? [];
  }, [activeFilterId, filterResults]);

  const handleAddFilter = () => {
    if (!newFilter.name.trim()) return;
    const newEntry: TenderFilter = {
      id: `F-${String(filters.length + 1).padStart(3, "0")}`,
      name: newFilter.name.trim(),
      region: newFilter.region,
      trade: newFilter.trade,
      lastSynced: null,
    };
    setFilters((prev) => [...prev, newEntry]);
    setNewFilter({ name: "", region: REGION_OPTIONS[0], trade: TRADE_OPTIONS[0] });
  };

  const handleSync = (filter: TenderFilter) => {
    const results = MOCK_TENDERS.filter(
      (tender) => tender.region === filter.region && tender.trade === filter.trade
    );
    setFilterResults((prev) => ({ ...prev, [filter.id]: results }));
    setFilters((prev) =>
      prev.map((item) =>
        item.id === filter.id
          ? { ...item, lastSynced: new Date().toISOString() }
          : item
      )
    );
    setActiveFilterId(filter.id);
  };

  return (
    <PermissionGuard permission="clients">
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Saved Filters</h2>
            <span className="text-xs text-gray-400">Region + Trade</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Filter Name</label>
              <input
                type="text"
                value={newFilter.name}
                onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Midlands Asphalt"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Region</label>
              <select
                value={newFilter.region}
                onChange={(e) => setNewFilter({ ...newFilter, region: e.target.value })}
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {REGION_OPTIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Trade</label>
              <select
                value={newFilter.trade}
                onChange={(e) => setNewFilter({ ...newFilter, trade: e.target.value })}
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {TRADE_OPTIONS.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddFilter}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              + Add Filter
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={`rounded-lg border px-4 py-3 ${
                  activeFilterId === filter.id
                    ? "border-orange-500/60 bg-orange-500/10"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{filter.name}</p>
                    <p className="text-xs text-gray-400">{filter.region} • {filter.trade}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {filter.lastSynced
                        ? `Last synced ${new Date(filter.lastSynced).toLocaleDateString("en-GB")}`
                        : "Not synced yet"}
                    </span>
                    <button
                      onClick={() => handleSync(filter)}
                      className="rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Sync
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Portal Connections</h2>
          <div className="space-y-3">
            {PORTALS.map((portal) => (
              <div key={portal.name} className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{portal.name}</span>
                  <span className="text-xs text-gray-400">{portal.status}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">API keys required to pull live tenders.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Matched Tenders</h2>
          <span className="text-xs text-gray-400">
            {activeFilterId
              ? `${activeResults.length} results`
              : "Select a filter to view results"}
          </span>
        </div>

        {activeFilterId ? (
          activeResults.length > 0 ? (
            <div className="space-y-3">
              {activeResults.map((tender) => (
                <div key={tender.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{tender.title}</p>
                      <p className="text-xs text-gray-400">{tender.portal} • {tender.region} • {tender.trade}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        tender.status === "Open"
                          ? "border-green-500/40 text-green-400"
                          : tender.status === "Closing Soon"
                            ? "border-yellow-500/40 text-yellow-400"
                            : "border-gray-500/40 text-gray-400"
                      }`}
                    >
                      {tender.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-400">
                    <div>
                      <span className="text-gray-500">Value:</span> {tender.value}
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline:</span> {new Date(tender.deadline).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-gray-400">No tenders match this filter yet</p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">🧭</p>
            <p className="text-gray-400">Choose a filter and click Sync to load tenders</p>
          </div>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}
