import { NextResponse } from "next/server";
import { getSupplierEnquiryById, sendSupplierEnquiry } from "@/lib/supplier-portal-store";
import { sendSupplierEnquiryEmail } from "@/lib/supplier-portal-email";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const recipients = Array.isArray(body.recipients) ? body.recipients : [];
    if (recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    const enquiry = await sendSupplierEnquiry(id, recipients);
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
    const recipientSet = new Set(
      recipients
        .map((recipient: { supplierEmail?: string }) => String(recipient.supplierEmail || "").toLowerCase())
        .filter(Boolean)
    );
    const invitesToSend = enquiry.invites.filter((invite) => recipientSet.has(invite.supplierEmail.toLowerCase()));

    const emailResults = [] as Array<{ email: string; sent: boolean; message: string }>;
    for (const invite of invitesToSend) {
      const result = await sendSupplierEnquiryEmail(enquiry, invite, portalUrl);
      emailResults.push({
        email: invite.supplierEmail,
        sent: result.sent,
        message: result.message,
      });
    }

    return NextResponse.json({
      enquiry,
      emailResults,
    });
  } catch (error) {
    console.error("Supplier enquiry send error:", error);
    return NextResponse.json({ error: "Failed to send supplier enquiry" }, { status: 500 });
  }
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const enquiry = await getSupplierEnquiryById(params.id);
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json(enquiry);
  } catch (error) {
    console.error("Supplier enquiry GET by id error:", error);
    return NextResponse.json({ error: "Failed to load supplier enquiry" }, { status: 500 });
  }
}
