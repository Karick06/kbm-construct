/**
 * API Route: Clock in/out via geofencing
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, latitude, longitude, action } = body;

    // Validate input
    if (!employeeId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production: Store in database and check geofences
    const mockResponse = {
      success: true,
      data: {
        id: `entry-${Date.now()}`,
        employeeId,
        employeeName: 'John Smith',
        action,
        timestamp: new Date().toISOString(),
        latitude,
        longitude,
        geofenceName: 'London Construction Site',
        message:
          action === 'clock-in'
            ? 'Clocked in successfully'
            : 'Clocked out successfully',
      },
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error processing clock action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
