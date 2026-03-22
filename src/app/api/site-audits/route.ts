import { NextRequest, NextResponse } from "next/server";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

type AuditStatus = "pass" | "fail" | "na";
type ActionStatus = "open" | "in-progress" | "closed";
type Severity = "low" | "medium" | "high";

type QuestionResponse = {
  status: AuditStatus;
  note: string;
};

type AuditAction = {
  id: string;
  sourceQuestionId: string;
  title: string;
  severity: Severity;
  owner: string;
  dueDate: string;
  status: ActionStatus;
};

type AuditMeta = {
  siteName: string;
  projectRef: string;
  auditor: string;
  auditDate: string;
  weather: string;
};

export type SiteAuditRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  meta: AuditMeta;
  responses: Record<string, QuestionResponse>;
  actions: AuditAction[];
};

const LOCAL_RELATIVE_PATH = "data/site-audits.json";
const REMOTE_RELATIVE_PATH = "data/site-audits.json";

async function readStore(): Promise<SiteAuditRecord[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as SiteAuditRecord[]) : [];
}

async function writeStore(items: SiteAuditRecord[]): Promise<void> {
  await writeGlobalJsonStore<SiteAuditRecord[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

export async function GET() {
  const audits = await readStore();
  audits.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
  return NextResponse.json({ audits });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<SiteAuditRecord>;
  if (!body.meta || !body.responses || !Array.isArray(body.actions)) {
    return NextResponse.json(
      { error: "meta, responses and actions are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const incomingId = body.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const record: SiteAuditRecord = {
    id: incomingId,
    createdAt: body.createdAt || now,
    updatedAt: now,
    meta: body.meta,
    responses: body.responses,
    actions: body.actions,
  };

  const current = await readStore();
  const existing = current.find((item) => item.id === incomingId);
  if (existing) {
    record.createdAt = existing.createdAt;
  }

  const next = [record, ...current.filter((item) => item.id !== incomingId)];
  await writeStore(next);

  return NextResponse.json({ audit: record, audits: next });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const current = await readStore();
  const next = current.filter((item) => item.id !== id);

  if (next.length === current.length) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  await writeStore(next);
  return NextResponse.json({ ok: true });
}
