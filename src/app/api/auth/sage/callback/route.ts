import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSageConfig, getSageTokenUrl, updateSageConfig } from '@/lib/sage-config';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');
  const errorDescription = request.nextUrl.searchParams.get('error_description');

  if (error) {
    const message = errorDescription ? `${error}: ${errorDescription}` : error;
    return NextResponse.redirect(new URL(`/sage-settings?sage_error=${encodeURIComponent(message)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/sage-settings?sage_error=no_code', request.url));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get('sage_oauth_state')?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/sage-settings?sage_error=invalid_state', request.url));
  }

  try {
    const config = getSageConfig();
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = process.env.SAGE_REDIRECT_URI || `${appOrigin}/api/auth/sage/callback`;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const tokenResponse = await fetch(getSageTokenUrl(config), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      return NextResponse.redirect(
        new URL(`/sage-settings?sage_error=${encodeURIComponent(tokenError || 'token_exchange_failed')}`, request.url)
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    updateSageConfig({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: Date.now() + tokenData.expires_in * 1000,
    });

    cookieStore.delete('sage_oauth_state');

    return NextResponse.redirect(new URL('/sage-settings?sage_connected=1', request.url));
  } catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : 'callback_failed';
    return NextResponse.redirect(new URL(`/sage-settings?sage_error=${encodeURIComponent(message)}`, request.url));
  }
}