import { NextResponse } from 'next/server';
import type { DailyTimesheet, TimesheetEntry } from '@/lib/timesheet-models';
import { readGlobalJsonStore } from '@/lib/global-storage';

const TIMESHEET_LOCAL_PATH = 'data/timesheets.json';
const TIMESHEET_REMOTE_PATH = 'data/timesheets.json';

type ActivePresence = {
  employeeId: string;
  employeeName: string;
  geofenceId: string;
  geofenceName: string;
  source: TimesheetEntry['source'] | 'manual-clock';
  checkInDate: string;
  checkInTime: string;
  checkedInAt: string;
  minutesOnSite: number;
  latitude: number | null;
  longitude: number | null;
};

function toDateValue(date: string, time: string): Date {
  const value = new Date(`${date}T${time}:00`);
  if (!Number.isNaN(value.getTime())) return value;
  const fallback = new Date(date);
  return Number.isNaN(fallback.getTime()) ? new Date(0) : fallback;
}

function getMinutesOnSite(date: string, time: string): number {
  const started = toDateValue(date, time);
  const diffMs = Date.now() - started.getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

async function readTimesheets(): Promise<DailyTimesheet[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: TIMESHEET_LOCAL_PATH,
    remoteRelativePath: TIMESHEET_REMOTE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as DailyTimesheet[]) : [];
}

export async function GET() {
  try {
    const timesheets = await readTimesheets();
    const latestByEmployee = new Map<string, { entry: TimesheetEntry; startedAt: Date }>();

    timesheets.forEach((timesheet) => {
      timesheet.entries
        .filter((entry) => entry.status === 'active' && !entry.checkOutTime)
        .forEach((entry) => {
          const startedAt = toDateValue(entry.date, entry.checkInTime);
          const current = latestByEmployee.get(entry.employeeId);
          if (!current || startedAt.getTime() > current.startedAt.getTime()) {
            latestByEmployee.set(entry.employeeId, { entry, startedAt });
          }
        });
    });

    const onSite: ActivePresence[] = Array.from(latestByEmployee.values())
      .map(({ entry, startedAt }) => ({
        employeeId: entry.employeeId,
        employeeName: entry.employeeName,
        geofenceId: entry.geofenceId,
        geofenceName: entry.geofenceName,
        source: entry.source || 'manual-clock',
        checkInDate: entry.date,
        checkInTime: entry.checkInTime,
        checkedInAt: startedAt.toISOString(),
        minutesOnSite: getMinutesOnSite(entry.date, entry.checkInTime),
        latitude: typeof entry.latitude === 'number' ? entry.latitude : null,
        longitude: typeof entry.longitude === 'number' ? entry.longitude : null,
      }))
      .sort((a, b) => a.geofenceName.localeCompare(b.geofenceName) || a.employeeName.localeCompare(b.employeeName));

    const groupedBySite = onSite.reduce<Record<string, { geofenceId: string; geofenceName: string; count: number }>>(
      (acc, item) => {
        const key = item.geofenceId || item.geofenceName;
        if (!acc[key]) {
          acc[key] = {
            geofenceId: item.geofenceId,
            geofenceName: item.geofenceName,
            count: 0,
          };
        }
        acc[key].count += 1;
        return acc;
      },
      {}
    );

    const sites = Object.values(groupedBySite).sort((a, b) => b.count - a.count || a.geofenceName.localeCompare(b.geofenceName));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalOnSite: onSite.length,
        activeSites: sites.length,
        autoClocked: onSite.filter((item) => item.source === 'auto-geofence').length,
        manualClocked: onSite.filter((item) => item.source !== 'auto-geofence').length,
      },
      sites,
      onSite,
    });
  } catch (error) {
    console.error('Failed to build timesheet presence view:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load current site presence',
      },
      { status: 500 }
    );
  }
}
