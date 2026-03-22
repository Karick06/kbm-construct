import { NextResponse } from "next/server";
import { createSupplierEnquiry, listSupplierEnquiries } from "@/lib/supplier-portal-store";
import type { SupplierEnquiryCategory, SupplierEnquiryDocument, SupplierEnquiryItem } from "@/lib/supplier-portal-types";

export async function GET() {
  try {
    const enquiries = await listSupplierEnquiries();
    return NextResponse.json(enquiries);
  } catch (error) {
    console.error("Supplier enquiries GET error:", error);
    return NextResponse.json({ error: "Failed to load supplier enquiries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title || "").trim();
    const category = String(body.category || "").trim() as SupplierEnquiryCategory;
    const items = (body.items || []) as SupplierEnquiryItem[];
    const documents = (body.documents || []) as SupplierEnquiryDocument[];

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!["labour", "plant", "materials", "subcontract"].includes(category)) {
      return NextResponse.json({ error: "Invalid enquiry category" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    const created = await createSupplierEnquiry({
      title,
      category,
      linkedRecordType: body.linkedRecordType,
      linkedRecordId: body.linkedRecordId,
      linkedRecordName: body.linkedRecordName,
      requiredBy: body.requiredBy,
      notes: body.notes,
      items,
      documents,
      createdBy: body.createdBy,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Supplier enquiries POST error:", error);
    return NextResponse.json({ error: "Failed to create supplier enquiry" }, { status: 500 });
  }
}
