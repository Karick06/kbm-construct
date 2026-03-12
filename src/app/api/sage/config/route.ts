import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import { SAGE_CONFIG_FILE, getSageConfig, type SageConfig } from '@/lib/sage-config';

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
    data: config,
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<SageConfig>;

    if (
      !isNonEmptyString(payload.businessName) ||
      !isNonEmptyString(payload.username) ||
      !isNonEmptyString(payload.password) ||
      !isNonEmptyString(payload.apiKey) ||
      !isNonEmptyString(payload.tenantId) ||
      !isValidEnvironment(payload.environment)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'All Sage configuration fields are required',
        },
        { status: 400 }
      );
    }

    const config: SageConfig = {
      businessName: payload.businessName.trim(),
      username: payload.username.trim(),
      password: payload.password,
      apiKey: payload.apiKey.trim(),
      tenantId: payload.tenantId.trim(),
      environment: payload.environment,
    };

    await writeFile(SAGE_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');

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