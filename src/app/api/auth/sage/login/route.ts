import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSageAuthorizeUrl, getSageConfig, hasSageCredentials } from '@/lib/sage-config';

export async function GET(request: NextRequest) {
  const config = getSageConfig();

  if (!hasSageCredentials(config)) {
    return NextResponse.json(
      {
        error: 'Set Sage Client ID, Client Secret and Business ID first.',
      },
      { status: 400 }
    );
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${appOrigin}/api/auth/sage/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: 'full_access offline_access',
    state,
  });

  const authUrl = `${getSageAuthorizeUrl(config)}?${params.toString()}`;

  const cookieStore = await cookies();
  cookieStore.set('sage_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  return NextResponse.json({ authUrl });
}