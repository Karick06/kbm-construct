"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  getProjectDocumentsForProject,
  getProjectDocumentsFromStorage,
  getProjectsFromStorage,
} from "@/lib/operations-data";
import type { ProjectDocument } from "@/lib/operations-models";

type DocumentCard = {
  id: string;
  title: string;
  owner: string;
  updated: string;
};

const TOTAL_STORAGE_BYTES = 2.5 * 1024 * 1024 * 1024 * 1024;

function formatRelativeDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  const now = Date.now();
  const diffHours = Math.floor((now - parsed.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function flattenDocuments(): ProjectDocument[] {
  const projects = getProjectsFromStorage();
  const merged = new Map<string, ProjectDocument>();

  projects.forEach((project) => {
    getProjectDocumentsForProject(project.id).forEach((document) => {
      merged.set(document.id, document);
    });
  });

  getProjectDocumentsFromStorage().forEach((document) => {
    merged.set(document.id, document);
  });

  return Array.from(merged.values()).sort(
    (left, right) =>
      new Date(right.uploadedDate).getTime() - new Date(left.uploadedDate).getTime()
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);

  useEffect(() => {
    const hydrate = () => {
      setDocuments(flattenDocuments());
    };

    hydrate();
    window.addEventListener("storage", hydrate);
    window.addEventListener("focus", hydrate);
    return () => {
      window.removeEventListener("storage", hydrate);
      window.removeEventListener("focus", hydrate);
    };
  }, []);

  const cards = useMemo<DocumentCard[]>(
    () =>
      documents.map((document) => ({
        id: document.id,
        title: document.title,
        owner: document.uploadedBy,
        updated: formatRelativeDate(document.uploadedDate),
      })),
    [documents]
  );

  const storageBytesUsed = useMemo(
    () => documents.reduce((sum, document) => sum + (document.fileSize || 0), 0),
    [documents]
  );

  const storageUsedPercentage = useMemo(
    () => Math.min(100, Math.round((storageBytesUsed / TOTAL_STORAGE_BYTES) * 100)),
    [storageBytesUsed]
  );

  return (
    <PermissionGuard permission="documents">
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Document library"
        subtitle="Documents"
        actions={
          <>
            <Link href="/library-resources" className="h-11 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] inline-flex items-center">
              Upload
            </Link>
            <Link href="/library-templates" className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white inline-flex items-center">
              New folder
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((doc) => (
          <div
            key={doc.id}
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
        {cards.length === 0 && (
          <div className="col-span-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
            No project documents found yet.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Storage health
        </p>
        <p className="font-display text-2xl font-semibold">
          {storageUsedPercentage}% used of 2.5TB
        </p>
        <div className="mt-4 h-3 w-full rounded-full bg-[var(--surface-2)]">
          <div className="h-3 rounded-full bg-[var(--accent)]" style={{ width: `${storageUsedPercentage}%` }} />
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {documents.length} document(s) indexed across connected project records.
        </p>
      </section>
    </div>
    </PermissionGuard>
  );
}
