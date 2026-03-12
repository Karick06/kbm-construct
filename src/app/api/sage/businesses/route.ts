import { NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';
import { getSageConfig } from '@/lib/sage-config';

export async function GET() {
  try {
    const businesses = await sageAPI.getBusinesses();

    return NextResponse.json({
      success: true,
      count: businesses.length,
      data: businesses,
    });
  } catch (error) {
    const config = getSageConfig();
    if (config.businessId.trim()) {
      return NextResponse.json({
        success: true,
        count: 1,
        data: [
          {
            id: config.businessId,
            name: config.businessName || 'Configured Business',
          },
        ],
        fallback: true,
        message:
          'Using configured Business ID because business discovery endpoint is unavailable for this account.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch businesses',
      },
      { status: 500 }
    );
  }
}