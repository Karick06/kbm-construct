import { NextRequest, NextResponse } from "next/server";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

type IssueSeverity = "low" | "medium" | "high";
type IssueStatus = "open" | "in-progress" | "resolved";

type AuditPhoto = {
  id: string;
  base64: string;
  caption: string;
  uploadedAt: string;
};

type AuditIssue = {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  photos: AuditPhoto[];
  createdAt: string;
  updatedAt: string;
};

export type AuditProject = {
  id: string;
  title: string;
  projectRef: string;
  clientName: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  issues: AuditIssue[];
};

const LOCAL_RELATIVE_PATH = "data/site-audits.json";
const REMOTE_RELATIVE_PATH = "data/site-audits.json";

async function readStore(): Promise<AuditProject[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as AuditProject[]) : [];
}

async function writeStore(items: AuditProject[]): Promise<void> {
  await writeGlobalJsonStore<AuditProject[]>({
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
  const body = (await request.json()) as { projects?: AuditProject[] };

  if (!body.projects || !Array.isArray(body.projects)) {
    return NextResponse.json(
      { error: "projects array is required" },
      { status: 400 }
    );
  }

  const projects = body.projects;

  await writeStore(projects);

  return NextResponse.json({ audits: projects });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const current = await readStore();
  const next = current.filter((item) => item.id !== id);

  if (next.length === current.length) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await writeStore(next);
  return NextResponse.json({ ok: true, audits: next });
}

