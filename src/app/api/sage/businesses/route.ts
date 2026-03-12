import { NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';

export async function GET() {
  try {
    const businesses = await sageAPI.getBusinesses();

    return NextResponse.json({
      success: true,
      count: businesses.length,
      data: businesses,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch businesses',
      },
      { status: 500 }
    );
  }
}