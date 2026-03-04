import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const RAMS_DIR = path.join(process.cwd(), "data", "rams");

// Ensure directory exists
async function ensureRamsDir() {
  try {
    await fs.mkdir(RAMS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// GET - List all RAMS documents
export async function GET() {
  try {
    await ensureRamsDir();
    const files = await fs.readdir(RAMS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const documents = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(RAMS_DIR, file), "utf-8");
        return JSON.parse(content);
      })
    );

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
    await ensureRamsDir();
    const document = await request.json();

    if (!document.id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    const filename = `${document.id}.json`;
    const filepath = path.join(RAMS_DIR, filename);

    await fs.writeFile(filepath, JSON.stringify(document, null, 2), "utf-8");

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

    const filename = `${id}.json`;
    const filepath = path.join(RAMS_DIR, filename);

    await fs.unlink(filepath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting RAMS document:", error);
    return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 });
  }
}
