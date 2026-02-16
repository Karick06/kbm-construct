/**
 * API Route: Fetch Geofences
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_GEOFENCES } from '@/lib/geofence';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      count: DEFAULT_GEOFENCES.length,
      data: DEFAULT_GEOFENCES,
    });
  } catch (error) {
    console.error('Error fetching geofences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch geofences' },
      { status: 500 }
    );
  }
}
