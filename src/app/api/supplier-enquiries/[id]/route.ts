import { NextResponse } from "next/server";
import { getSupplierEnquiryById, updateSupplierEnquiryStatus } from "@/lib/supplier-portal-store";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const enquiry = await getSupplierEnquiryById(params.id);
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }
    return NextResponse.json(enquiry);
  } catch (error) {
    console.error("Supplier enquiry GET error:", error);
    return NextResponse.json({ error: "Failed to load supplier enquiry" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json();
    const status = String(body.status || "") as "draft" | "sent" | "closed";

    if (!["draft", "sent", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const enquiry = await updateSupplierEnquiryStatus(params.id, status);
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json(enquiry);
  } catch (error) {
    console.error("Supplier enquiry PATCH error:", error);
    return NextResponse.json({ error: "Failed to update supplier enquiry" }, { status: 500 });
  }
}
