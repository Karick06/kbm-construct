import nodemailer from "nodemailer";
import type { SupplierEnquiry, SupplierInvite } from "@/lib/supplier-portal-types";

type EmailSendResult = {
  sent: boolean;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toDisplayName(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Supplier";
  return trimmed
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCategory(category: SupplierEnquiry["category"]) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function buildSupplierResponseUrl(token: string, portalUrl: string) {
  const template =
    process.env.SUPPLIER_ENQUIRY_URL_TEMPLATE ||
    process.env.NEXT_PUBLIC_SUPPLIER_ENQUIRY_URL_TEMPLATE ||
    "";

  if (template.trim()) {
    if (template.includes("{token}")) {
      return template.replaceAll("{token}", encodeURIComponent(token));
    }

    const normalized = template.endsWith("/") ? template : `${template}/`;
    return `${normalized}${encodeURIComponent(token)}`;
  }

  return `${portalUrl.replace(/\/$/, "")}/supplier-portal/enquiry/${encodeURIComponent(token)}`;
}

function getTransportConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  };
}

function buildMessage(enquiry: SupplierEnquiry, invite: SupplierInvite, portalUrl: string) {
  const responseUrl = buildSupplierResponseUrl(invite.inviteToken, portalUrl);
  const supplierName = toDisplayName(invite.supplierName);
  const safeSupplierName = escapeHtml(supplierName);
  const safeReference = escapeHtml(enquiry.reference);
  const safeTitle = escapeHtml(enquiry.title);
  const safeCategory = escapeHtml(formatCategory(enquiry.category));
  const safeResponseUrl = escapeHtml(responseUrl);
  const requiredBy = enquiry.requiredBy ? new Date(enquiry.requiredBy).toLocaleDateString("en-GB") : "Not specified";
  const itemCountText = `${enquiry.items.length} ${enquiry.items.length === 1 ? "item" : "items"}`;
  const safeRequiredBy = escapeHtml(requiredBy);
  const safeItemCount = escapeHtml(itemCountText);

  return {
    subject: `Supplier Enquiry ${enquiry.reference} - ${enquiry.title}`,
    text: [
      `Hello ${supplierName},`,
      "",
      "VALESCAPE LTD has invited you to quote on the enquiry below.",
      "",
      `Title: ${enquiry.title}`,
      `Reference: ${enquiry.reference}`,
      `Category: ${formatCategory(enquiry.category)}`,
      `Items: ${itemCountText}`,
      `Required by: ${requiredBy}`,
      "",
      "View full details and submit your quotation:",
      responseUrl,
      "",
      "Regards,",
      "VALESCAPE LTD",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="margin:0;padding:24px 0;background:#5b5f66;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 16px;">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;border-collapse:collapse;background:#1f2126;border:1px solid #2d3138;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px 20px;border-bottom:1px solid #383d45;text-align:center;background:linear-gradient(180deg,#23262d 0%,#1f2126 100%);">
                    <div style="font-size:22px;letter-spacing:6px;color:#f59e0b;font-weight:700;">VALESCAPE</div>
                    <div style="margin-top:6px;font-size:20px;color:#ffffff;font-weight:700;">VALESCAPE LTD</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 40px;color:#d1d5db;">
                    <p style="margin:0 0 14px;font-size:18px;line-height:1.6;color:#cbd5e1;">Dear ${safeSupplierName},</p>
                    <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#b9c2d2;">
                      VALESCAPE LTD has invited you to quote on the enquiry below. Click through to view full details and submit your quotation.
                    </p>
                    <p style="margin:0 0 22px;font-size:13px;line-height:1.5;color:#8e9ab1;letter-spacing:1.2px;text-transform:uppercase;text-align:center;">
                      Request For Quotation
                    </p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 28px;">
                      <tr>
                        <td style="padding:8px 0;font-size:15px;color:#9ca3af;">Items</td>
                        <td align="right" style="padding:8px 0;font-size:15px;color:#fbbf24;font-weight:700;">${safeItemCount}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:15px;color:#9ca3af;">Reference</td>
                        <td align="right" style="padding:8px 0;font-size:15px;color:#e5e7eb;font-weight:700;">${safeReference}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:15px;color:#9ca3af;">Required By</td>
                        <td align="right" style="padding:8px 0;font-size:15px;color:#fbbf24;font-weight:700;">${safeRequiredBy}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:15px;color:#9ca3af;">Category</td>
                        <td align="right" style="padding:8px 0;font-size:15px;color:#d1d5db;">${safeCategory}</td>
                      </tr>
                    </table>

                    <div style="text-align:center;margin:0 0 20px;">
                      <a href="${safeResponseUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;font-size:22px;">View &amp; Submit Quote →</a>
                    </div>

                    <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;text-align:center;">${safeTitle}</p>
                    <p style="margin:0;font-size:14px;color:#94a3b8;text-align:center;">View the full item list, attachments, and submit your quotation online.</p>
                    <p style="margin:14px 0 0;font-size:13px;color:#6b7280;word-break:break-all;text-align:center;">${safeResponseUrl}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  };
}

export async function sendSupplierEnquiryEmail(
  enquiry: SupplierEnquiry,
  invite: SupplierInvite,
  portalUrl: string
): Promise<EmailSendResult> {
  const config = getTransportConfig();

  if (!config) {
    return {
      sent: false,
      message: "SMTP is not configured. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.",
    };
  }

  const transport = nodemailer.createTransport(config);
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@kbmconstruct.local";
  const message = buildMessage(enquiry, invite, portalUrl);

  await transport.sendMail({
    from: smtpFrom,
    to: invite.supplierEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return {
    sent: true,
    message: `Sent to ${invite.supplierEmail}`,
  };
}
