import { NextResponse } from "next/server";
import { getInviteByToken, markInviteViewed, submitSupplierResponse } from "@/lib/supplier-portal-store";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const params = await context.params;
    const found = await getInviteByToken(params.token);
    if (!found) {
      return NextResponse.json({ error: "Invalid or expired supplier link" }, { status: 404 });
    }

    await markInviteViewed(params.token);

    const { enquiry, invite } = found;
    const existingResponse = enquiry.responses.find((response) => response.inviteToken === params.token);

    return NextResponse.json({
      enquiry: {
        id: enquiry.id,
        reference: enquiry.reference,
        title: enquiry.title,
        category: enquiry.category,
        requiredBy: enquiry.requiredBy,
        notes: enquiry.notes,
        linkedRecordName: enquiry.linkedRecordName,
        items: enquiry.items,
        documents: enquiry.documents,
      },
      invite: {
        supplierName: invite.supplierName,
        supplierEmail: invite.supplierEmail,
        status: invite.status,
      },
      existingResponse,
    });
  } catch (error) {
    console.error("Supplier response GET error:", error);
    return NextResponse.json({ error: "Failed to load supplier response form" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json();

    const lineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
    const additionalLines = Array.isArray(body.additionalLines) ? body.additionalLines : [];
    const quoteDocuments = Array.isArray(body.quoteDocuments) ? body.quoteDocuments : [];
    if (lineItems.length === 0) {
      return NextResponse.json({ error: "At least one line item response is required" }, { status: 400 });
    }

    const response = await submitSupplierResponse(params.token, {
      supplierName: String(body.supplierName || "").trim(),
      supplierEmail: String(body.supplierEmail || "").trim().toLowerCase(),
      currency: String(body.currency || "GBP").toUpperCase(),
      validityDays: body.validityDays ? Number(body.validityDays) : undefined,
      validityDate: body.validityDate ? String(body.validityDate) : undefined,
      leadTime: body.leadTime ? String(body.leadTime) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      lineItems,
      additionalLines,
      quoteDocuments,
      grandTotal: Number(body.grandTotal || 0),
    });

    if (!response) {
      return NextResponse.json({ error: "Invalid supplier response link" }, { status: 404 });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Supplier response POST error:", error);
    return NextResponse.json({ error: "Failed to submit supplier response" }, { status: 500 });
  }
}
