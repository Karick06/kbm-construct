/**
 * API Route: Fetch Timesheets
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  try {
    // In production, fetch from database
    // Mock data for now
    const mockTimesheets = {
      success: true,
      data: [
        {
          id: 'ts-001',
          employeeId: 'emp-001',
          employeeName: 'John Smith',
          date: new Date().toISOString().split('T')[0],
          entries: [
            {
              id: 'entry-001',
              employeeId: 'emp-001',
              employeeName: 'John Smith',
              date: new Date().toISOString().split('T')[0],
              checkInTime: '08:00',
              checkOutTime: '17:00',
              geofenceId: 'london-project',
              geofenceName: 'London Construction Site',
              duration: 540,
              status: 'completed',
            },
          ],
          totalHours: 9,
          submissionStatus: 'submitted',
        },
      ],
    };

    return NextResponse.json(mockTimesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timesheets' },
      { status: 500 }
    );
  }
}
