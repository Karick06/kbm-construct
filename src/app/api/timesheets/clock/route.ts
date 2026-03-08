/**
 * API Route: Clock in/out via geofencing
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_GEOFENCES, getDistanceFromLatLonInMeters, getGeofencesAtLocation } from '@/lib/geofence';

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

    if (action !== 'clock-in' && action !== 'clock-out') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use clock-in or clock-out.' },
        { status: 400 }
      );
    }

    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);

    if (Number.isNaN(numericLatitude) || Number.isNaN(numericLongitude)) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    const activeGeofences = DEFAULT_GEOFENCES.filter((geofence) => geofence.active);
    const matchingGeofences = getGeofencesAtLocation(numericLatitude, numericLongitude, activeGeofences);

    const nearestGeofence = activeGeofences
      .map((geofence) => ({
        geofence,
        distanceMeters: Math.round(
          getDistanceFromLatLonInMeters(
            numericLatitude,
            numericLongitude,
            geofence.latitude,
            geofence.longitude
          )
        ),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

    // Enforce geofence for clock-in. Clock-out is allowed to support end-of-shift outside site.
    if (action === 'clock-in' && matchingGeofences.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'OUTSIDE_GEOFENCE',
          error: nearestGeofence
            ? `You are outside all geofences. Nearest site is ${nearestGeofence.geofence.name} (${nearestGeofence.distanceMeters}m away).`
            : 'You are outside all configured geofences.',
          nearestGeofence: nearestGeofence
            ? {
                id: nearestGeofence.geofence.id,
                name: nearestGeofence.geofence.name,
                distanceMeters: nearestGeofence.distanceMeters,
              }
            : null,
        },
        { status: 403 }
      );
    }

    const currentGeofence = matchingGeofences[0] || nearestGeofence?.geofence;

    // In production: Store in database and check geofences
    const mockResponse = {
      success: true,
      data: {
        id: `entry-${Date.now()}`,
        employeeId,
        employeeName: 'John Smith',
        action,
        timestamp: new Date().toISOString(),
        latitude: numericLatitude,
        longitude: numericLongitude,
        geofenceId: currentGeofence?.id || null,
        geofenceName: currentGeofence?.name || 'Outside configured geofences',
        withinGeofence: matchingGeofences.length > 0,
        nearestDistanceMeters: nearestGeofence?.distanceMeters ?? null,
        message:
          action === 'clock-in'
            ? `Clocked in at ${currentGeofence?.name || 'site'} successfully`
            : matchingGeofences.length > 0
            ? `Clocked out at ${currentGeofence?.name || 'site'} successfully`
            : 'Clocked out successfully (outside geofence)',
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
