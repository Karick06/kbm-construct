import { NextRequest, NextResponse } from "next/server";
import type { RAMSDocument } from "@/lib/rams-data";
import { readGlobalJsonStore, writeGlobalJsonStore } from "@/lib/global-storage";

const LOCAL_RELATIVE_PATH = "data/rams-documents.json";
const REMOTE_RELATIVE_PATH = "data/rams-documents.json";

async function readStore(): Promise<RAMSDocument[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as RAMSDocument[]) : [];
}

async function writeStore(items: RAMSDocument[]): Promise<void> {
  await writeGlobalJsonStore<RAMSDocument[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

// GET - List all RAMS documents
export async function GET() {
  try {
    const documents = await readStore();

    // Sort by last modified date, newest first
    documents.sort((a, b) => 
      new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime()
    );

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error("Error loading RAMS documents:", error);
    return NextResponse.json({ success: false, error: "Failed to load documents" }, { status: 500 });
  }
}

// POST - Create or update a RAMS document
export async function POST(request: NextRequest) {
  try {
    const document = (await request.json()) as RAMSDocument;

    if (!document.id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    const current = await readStore();
    const next = [document, ...current.filter((entry) => entry.id !== document.id)];
    await writeStore(next);

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Error saving RAMS document:", error);
    return NextResponse.json({ success: false, error: "Failed to save document" }, { status: 500 });
  }
}

// DELETE - Delete a RAMS document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    const current = await readStore();
    const next = current.filter((entry) => entry.id !== id);

    if (next.length === current.length) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    await writeStore(next);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting RAMS document:", error);
    return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 });
  }
}
