"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getEmailActivityForRecord } from "@/lib/email-insights";
import type { EmailLinkedRecordType } from "@/lib/email-links";

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type Props = {
  recordType: EmailLinkedRecordType;
  recordId: string;
  title?: string;
  compact?: boolean;
};

export default function EmailActivityPanel({ recordType, recordId, title = "Email activity", compact = false }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const activity = useMemo(() => getEmailActivityForRecord(recordType, recordId), [recordId, recordType, refreshKey]);

  const gridClass = compact ? "grid-cols-2" : "grid-cols-4";

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs text-gray-400">Last contact {formatDate(activity.lastContactAt)}</p>
        </div>
        <Link href={`/mail?recordType=${encodeURIComponent(recordType)}&recordId=${encodeURIComponent(recordId)}`} className="rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700">
          Open mail
        </Link>
      </div>

      <div className={`mt-4 grid gap-3 ${gridClass}`}>
        <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Emails</p>
          <p className="mt-1 text-xl font-semibold text-white">{activity.total}</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Unread</p>
          <p className="mt-1 text-xl font-semibold text-orange-300">{activity.unread}</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Attachments</p>
          <p className="mt-1 text-xl font-semibold text-sky-300">{activity.attachments}</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Status</p>
          <p className={`mt-1 text-sm font-semibold ${activity.awaitingResponse ? "text-amber-300" : "text-emerald-300"}`}>
            {activity.awaitingResponse ? "Awaiting reply" : "Up to date"}
          </p>
        </div>
      </div>
    </div>
  );
}
