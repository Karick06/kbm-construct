import { NextResponse } from "next/server";

export async function GET() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";

  const smtpConfigured = Boolean(smtpHost && smtpPort && smtpUser && smtpPass && smtpFrom);
  const appUrlConfigured = Boolean(appUrl);
  const appUrlPublic = appUrlConfigured && !/localhost|127\.0\.0\.1/.test(appUrl);

  return NextResponse.json({
    smtpConfigured,
    appUrl,
    appUrlConfigured,
    appUrlPublic,
    canEmailSuppliersExternally: smtpConfigured && appUrlPublic,
  });
}
