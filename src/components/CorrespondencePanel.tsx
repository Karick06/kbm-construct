"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getLinkedMessagesForRecord,
  type EmailLinkedRecordType,
  type EmailMessageSnapshot,
} from "@/lib/email-links";

type CorrespondencePanelProps = {
  recordType: EmailLinkedRecordType;
  recordId?: string;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
};

function formatRelativeDate(value?: string) {
  if (!value) return "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAddress(snapshot: EmailMessageSnapshot) {
  if (snapshot.from?.name && snapshot.from?.address) {
    return `${snapshot.from.name} <${snapshot.from.address}>`;
  }
  return snapshot.from?.address || snapshot.from?.name || "Unknown sender";
}

export default function CorrespondencePanel({
  recordType,
  recordId,
  title,
  subtitle,
  emptyMessage = "No linked emails yet.",
  className = "",
}: CorrespondencePanelProps) {
  const { hasPermission } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const canViewSensitiveContent =
    hasPermission("documents") || hasPermission("invoices") || hasPermission("procurement") || hasPermission("clients") || hasPermission("user_management");
  const isSensitiveRecord = recordType === "invoice" || recordType === "purchase-order" || recordType === "supplier" || recordType === "client";

  useEffect(() => {
    const handleStorage = () => setRefreshKey((value) => value + 1);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleStorage);
    };
  }, []);

  const linkedMessages = useMemo(() => {
    if (!recordId) return [];
    return getLinkedMessagesForRecord(recordType, recordId);
  }, [recordId, recordType, refreshKey]);

  return (
    <section className={`rounded-xl border border-gray-700/50 bg-gray-800/50 p-6 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
        </div>
        {recordId && (
          <Link
            href={`/mail?recordType=${encodeURIComponent(recordType)}&recordId=${encodeURIComponent(recordId)}`}
            className="rounded-lg border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-700"
          >
            Open Mail View
          </Link>
        )}
      </div>

      {!recordId ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-600 p-5 text-sm text-gray-400">
          Select a record to view linked correspondence.
        </div>
      ) : linkedMessages.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-600 p-5 text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {linkedMessages.slice(0, 6).map((message) => (
            <div key={message.messageId} className="rounded-lg border border-gray-700 bg-gray-900/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{message.subject || "(No subject)"}</p>
                  <p className="mt-1 truncate text-xs text-gray-400">{formatAddress(message)}</p>
                </div>
                <span className="whitespace-nowrap text-[11px] text-gray-500">{formatRelativeDate(message.receivedDateTime)}</span>
              </div>
              {isSensitiveRecord && !canViewSensitiveContent && (
                <p className="mt-2 line-clamp-2 text-sm text-gray-400">Preview hidden for restricted correspondence.</p>
              )}
              {(!isSensitiveRecord || canViewSensitiveContent) && (
                <p className="mt-2 line-clamp-2 text-sm text-gray-300">{message.bodyPreview || "No preview available."}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/mail?recordType=${encodeURIComponent(recordType)}&recordId=${encodeURIComponent(recordId)}&messageId=${encodeURIComponent(message.messageId)}`}
                  className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                >
                  Open Email
                </Link>
                {message.hasAttachments && (
                  <span className="rounded-md border border-gray-600 px-2 py-1 text-[11px] text-gray-300">📎 Attachments</span>
                )}
                {message.importance === "high" && (
                  <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">High importance</span>
                )}
              </div>
            </div>
          ))}

          {linkedMessages.length > 6 && (
            <p className="text-xs text-gray-500">Showing 6 of {linkedMessages.length} linked emails.</p>
          )}
        </div>
      )}
    </section>
  );
}
