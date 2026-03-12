import { NextResponse } from 'next/server';
import { getSageConfig, hasSageOAuthTokens, saveSageConfig, type SageConfig } from '@/lib/sage-config';

function isValidEnvironment(value: unknown): value is SageConfig['environment'] {
  return value === 'sandbox' || value === 'production';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function GET() {
  const config = getSageConfig();

  return NextResponse.json({
    success: true,
    data: {
      businessName: config.businessName,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      businessId: config.businessId,
      environment: config.environment,
      connected: hasSageOAuthTokens(config),
      tokenExpiry: config.tokenExpiry,
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<SageConfig>;

    if (
      !isNonEmptyString(payload.businessName) ||
      !isNonEmptyString(payload.clientId) ||
      !isNonEmptyString(payload.clientSecret) ||
      !isNonEmptyString(payload.businessId) ||
      !isValidEnvironment(payload.environment)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business name, client ID, client secret, business ID and environment are required',
        },
        { status: 400 }
      );
    }

    const current = getSageConfig();

    const config: SageConfig = {
      businessName: payload.businessName.trim(),
      clientId: payload.clientId.trim(),
      clientSecret: payload.clientSecret,
      businessId: payload.businessId.trim(),
      environment: payload.environment,
      accessToken: current.accessToken,
      refreshToken: current.refreshToken,
      tokenExpiry: current.tokenExpiry,
    };

    saveSageConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Sage configuration saved',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save Sage configuration',
      },
      { status: 500 }
    );
  }
}