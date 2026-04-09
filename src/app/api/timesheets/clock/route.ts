/**
 * API Route: Clock in/out via geofencing
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_GEOFENCES, getDistanceFromLatLonInMeters, getGeofencesAtLocation } from '@/lib/geofence';
import type { DailyTimesheet, TimesheetEntry } from '@/lib/timesheet-models';
import type { Geofence } from '@/lib/geofence';
import { readGlobalJsonStore, writeGlobalJsonStore } from '@/lib/global-storage';

const GEOFENCE_LOCAL_PATH = 'data/geofences.json';
const GEOFENCE_REMOTE_PATH = 'data/geofences.json';
const TIMESHEET_LOCAL_PATH = 'data/timesheets.json';
const TIMESHEET_REMOTE_PATH = 'data/timesheets.json';

function getLocalDateString(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalTimeString(value = new Date()): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getDurationMinutes(date: string, checkInTime: string, now: Date): number {
  const checkIn = new Date(`${date}T${checkInTime}:00`);
  if (Number.isNaN(checkIn.getTime())) return 0;
  const diff = now.getTime() - checkIn.getTime();
  return Math.max(0, Math.round(diff / 60000));
}

function recalculateTimesheetTotalHours(entries: TimesheetEntry[]): number {
  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  return Number((totalMinutes / 60).toFixed(2));
}

async function readStoredGeofences(): Promise<Geofence[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: GEOFENCE_LOCAL_PATH,
    remoteRelativePath: GEOFENCE_REMOTE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as Geofence[]) : [];
}

async function getAllGeofences(): Promise<Geofence[]> {
  const stored = await readStoredGeofences();
  const merged = [...DEFAULT_GEOFENCES];

  stored.forEach((item) => {
    const existingIndex = merged.findIndex((entry) => entry.id === item.id);
    if (existingIndex >= 0) {
      merged[existingIndex] = item;
      return;
    }
    merged.push(item);
  });

  return merged.filter((item) => !item.deleted);
}

async function readTimesheets(): Promise<DailyTimesheet[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: TIMESHEET_LOCAL_PATH,
    remoteRelativePath: TIMESHEET_REMOTE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as DailyTimesheet[]) : [];
}

async function writeTimesheets(items: DailyTimesheet[]): Promise<void> {
  await writeGlobalJsonStore<DailyTimesheet[]>({
    localRelativePath: TIMESHEET_LOCAL_PATH,
    remoteRelativePath: TIMESHEET_REMOTE_PATH,
    value: items,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, latitude, longitude, action, employeeName, source } = body;
    const entrySource =
      source === 'auto-geofence' || source === 'manual-clock' || source === 'offline-queued'
        ? source
        : 'manual-clock';

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

    const allGeofences = await getAllGeofences();
    const activeGeofences = allGeofences.filter((geofence) => geofence.active);
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
    const now = new Date();
    const nowDate = getLocalDateString(now);
    const nowTime = getLocalTimeString(now);
    const resolvedEmployeeName = typeof employeeName === 'string' && employeeName.trim()
      ? employeeName.trim()
      : 'Employee';

    const currentTimesheets = await readTimesheets();
    const timesheets = [...currentTimesheets];

    if (action === 'clock-in') {
      const hasOpenEntry = timesheets.some((timesheet) =>
        timesheet.employeeId === employeeId &&
        timesheet.entries.some((entry) => entry.status === 'active' && !entry.checkOutTime)
      );

      if (hasOpenEntry) {
        return NextResponse.json(
          { success: false, error: 'Employee is already clocked in.' },
          { status: 409 }
        );
      }

      const entry: TimesheetEntry = {
        id: `entry-${Date.now()}`,
        employeeId,
        employeeName: resolvedEmployeeName,
        date: nowDate,
        checkInTime: nowTime,
        checkOutTime: null,
        geofenceId: currentGeofence?.id || 'outside-geofence',
        geofenceName: currentGeofence?.name || 'Outside configured geofences',
        duration: 0,
        status: 'active',
        source: entrySource,
        latitude: numericLatitude,
        longitude: numericLongitude,
      };

      const todayId = `ts-${employeeId}-${nowDate}`;
      const todayIndex = timesheets.findIndex((timesheet) => timesheet.id === todayId);

      if (todayIndex >= 0) {
        const updatedEntries = [entry, ...timesheets[todayIndex].entries];
        timesheets[todayIndex] = {
          ...timesheets[todayIndex],
          entries: updatedEntries,
          totalHours: recalculateTimesheetTotalHours(updatedEntries),
          submissionStatus: 'draft',
        };
      } else {
        timesheets.unshift({
          id: todayId,
          employeeId,
          employeeName: resolvedEmployeeName,
          date: nowDate,
          entries: [entry],
          totalHours: 0,
          submissionStatus: 'draft',
        });
      }

      await writeTimesheets(timesheets);

      return NextResponse.json({
        success: true,
        data: {
          ...entry,
          action,
          timestamp: now.toISOString(),
          withinGeofence: matchingGeofences.length > 0,
          nearestDistanceMeters: nearestGeofence?.distanceMeters ?? null,
          message: `Clocked in at ${entry.geofenceName} successfully`,
        },
      });
    }

    let targetTimesheetIndex = -1;
    let targetEntryIndex = -1;

    for (let i = 0; i < timesheets.length; i += 1) {
      const timesheet = timesheets[i];
      if (timesheet.employeeId !== employeeId) continue;

      const entryIndex = timesheet.entries.findIndex((entry) => entry.status === 'active' && !entry.checkOutTime);
      if (entryIndex >= 0) {
        targetTimesheetIndex = i;
        targetEntryIndex = entryIndex;
        break;
      }
    }

    if (targetTimesheetIndex < 0 || targetEntryIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'No active clock-in found for this employee.' },
        { status: 409 }
      );
    }

    const targetTimesheet = timesheets[targetTimesheetIndex];
    const targetEntry = targetTimesheet.entries[targetEntryIndex];
    const completedEntry: TimesheetEntry = {
      ...targetEntry,
      checkOutTime: nowTime,
      duration: getDurationMinutes(targetEntry.date, targetEntry.checkInTime, now),
      status: 'completed',
      source: targetEntry.source || entrySource,
      latitude: numericLatitude,
      longitude: numericLongitude,
      geofenceId: currentGeofence?.id || targetEntry.geofenceId,
      geofenceName: currentGeofence?.name || targetEntry.geofenceName,
    };

    const updatedEntries = [...targetTimesheet.entries];
    updatedEntries[targetEntryIndex] = completedEntry;

    timesheets[targetTimesheetIndex] = {
      ...targetTimesheet,
      entries: updatedEntries,
      totalHours: recalculateTimesheetTotalHours(updatedEntries),
      submissionStatus: 'draft',
    };

    await writeTimesheets(timesheets);

    return NextResponse.json({
      success: true,
      data: {
        ...completedEntry,
        action,
        timestamp: now.toISOString(),
        withinGeofence: matchingGeofences.length > 0,
        nearestDistanceMeters: nearestGeofence?.distanceMeters ?? null,
        message:
          matchingGeofences.length > 0
            ? `Clocked out at ${completedEntry.geofenceName} successfully`
            : 'Clocked out successfully (outside geofence)',
      },
    });
  } catch (error) {
    console.error('Error processing clock action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
