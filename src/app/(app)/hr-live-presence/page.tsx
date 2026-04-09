"use client";

import { useCallback, useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";

type PresencePerson = {
  employeeId: string;
  employeeName: string;
  geofenceName: string;
  source: "manual" | "manual-clock" | "auto-geofence" | "offline-queued";
  checkInDate: string;
  checkInTime: string;
  minutesOnSite: number;
};

type PresenceSite = {
  geofenceId: string;
  geofenceName: string;
  count: number;
};

type PresencePayload = {
  summary: {
    totalOnSite: number;
    activeSites: number;
    autoClocked: number;
    manualClocked: number;
  };
  sites: PresenceSite[];
  onSite: PresencePerson[];
  timestamp: string;
};

function formatMinutesOnSite(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs <= 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

export default function HRLivePresencePage() {
  const [presence, setPresence] = useState<PresencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPresence = useCallback(async () => {
    try {
      const response = await fetch("/api/timesheets/presence", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to load live presence");
      }

      setPresence(result as PresencePayload);
      setError(null);
    } catch (err) {
      console.error("Failed to load HR live presence:", err);
      setError("Unable to load live site presence right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await loadPresence();
    };

    run();
    const interval = window.setInterval(run, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadPresence]);

  return (
    <PermissionGuard permission="leave">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Workforce Presence</h1>
            <p className="mt-1 text-sm text-gray-400">
              Real-time view of who is currently clocked in on site.
              {presence?.timestamp ? ` Last update ${new Date(presence.timestamp).toLocaleTimeString()}.` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadPresence();
            }}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700"
          >
            Refresh Now
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6 text-sm text-gray-300">Loading live presence...</div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-6 text-sm text-red-300">{error}</div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">On Site</p>
                <p className="mt-2 text-3xl font-bold text-white">{presence?.summary.totalOnSite || 0}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Sites</p>
                <p className="mt-2 text-3xl font-bold text-white">{presence?.summary.activeSites || 0}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Auto Clocked</p>
                <p className="mt-2 text-3xl font-bold text-green-400">{presence?.summary.autoClocked || 0}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Manual Clocked</p>
                <p className="mt-2 text-3xl font-bold text-orange-400">{presence?.summary.manualClocked || 0}</p>
              </div>
            </section>

            <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
              <div className="flex flex-wrap items-center gap-2">
                {(presence?.sites.length || 0) > 0 ? (
                  presence?.sites.map((site) => (
                    <span
                      key={site.geofenceId}
                      className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300"
                    >
                      {site.geofenceName}: {site.count}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No active sites right now.</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Currently Clocked In</h2>
                <p className="text-xs text-gray-400">Auto-refresh every 30 seconds</p>
              </div>

              {(presence?.onSite.length || 0) > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px]">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Employee</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Site</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Clocked In</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Time On Site</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {presence?.onSite.map((person) => (
                        <tr key={person.employeeId} className="hover:bg-gray-700/30">
                          <td className="py-3 text-sm font-semibold text-white">{person.employeeName}</td>
                          <td className="py-3 text-sm text-gray-300">{person.geofenceName}</td>
                          <td className="py-3 text-sm text-gray-300">{person.checkInDate}</td>
                          <td className="py-3 text-sm text-gray-300">{person.checkInTime}</td>
                          <td className="py-3 text-sm text-gray-300">{formatMinutesOnSite(person.minutesOnSite)}</td>
                          <td className="py-3 text-sm text-gray-300">
                            {person.source === "auto-geofence" ? "Auto geofence" : "Manual"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No operatives are currently clocked in.</p>
              )}
            </section>
          </>
        )}
      </div>
    </PermissionGuard>
  );
}
