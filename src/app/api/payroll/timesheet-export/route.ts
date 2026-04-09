import { NextRequest, NextResponse } from 'next/server';
import { readGlobalJsonStore } from '@/lib/global-storage';
import type { DailyTimesheet, TimesheetEntry } from '@/lib/timesheet-models';

const TIMESHEET_LOCAL_PATH = 'data/timesheets.json';
const TIMESHEET_REMOTE_PATH = 'data/timesheets.json';

type SourceKey = 'manual' | 'manual-clock' | 'auto-geofence' | 'offline-queued' | 'unknown';

function getMondayOfWeek(value: Date): Date {
  const monday = new Date(value);
  const day = monday.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseWeekStart(raw: string | null): Date {
  if (!raw) return getMondayOfWeek(new Date());
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return getMondayOfWeek(new Date());
  return getMondayOfWeek(parsed);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function escapeCsvValue(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function sourceOf(entry: TimesheetEntry): SourceKey {
  if (
    entry.source === 'manual' ||
    entry.source === 'manual-clock' ||
    entry.source === 'auto-geofence' ||
    entry.source === 'offline-queued'
  ) {
    return entry.source;
  }
  return 'unknown';
}

async function readTimesheets(): Promise<DailyTimesheet[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: TIMESHEET_LOCAL_PATH,
    remoteRelativePath: TIMESHEET_REMOTE_PATH,
    fallback: [],
  });

  return Array.isArray(parsed) ? (parsed as DailyTimesheet[]) : [];
}

export async function GET(request: NextRequest) {
  try {
    const weekStart = parseWeekStart(request.nextUrl.searchParams.get('weekStart'));
    const weekEnd = addDays(weekStart, 6);
    const weekStartKey = toDateKey(weekStart);
    const weekEndKey = toDateKey(weekEnd);

    const timesheets = await readTimesheets();
    const weekly = timesheets.filter(
      (timesheet) => timesheet.date >= weekStartKey && timesheet.date <= weekEndKey
    );

    const summary = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        totalMinutes: number;
        manualMinutes: number;
        manualClockMinutes: number;
        autoGeofenceMinutes: number;
        offlineQueuedMinutes: number;
        unknownMinutes: number;
        entryCount: number;
      }
    >();

    weekly.forEach((timesheet) => {
      if (!summary.has(timesheet.employeeId)) {
        summary.set(timesheet.employeeId, {
          employeeId: timesheet.employeeId,
          employeeName: timesheet.employeeName,
          totalMinutes: 0,
          manualMinutes: 0,
          manualClockMinutes: 0,
          autoGeofenceMinutes: 0,
          offlineQueuedMinutes: 0,
          unknownMinutes: 0,
          entryCount: 0,
        });
      }

      const row = summary.get(timesheet.employeeId)!;
      row.employeeName = row.employeeName || timesheet.employeeName;

      timesheet.entries.forEach((entry) => {
        const minutes = Number(entry.duration || 0);
        row.totalMinutes += minutes;
        row.entryCount += 1;

        const source = sourceOf(entry);
        if (source === 'manual') row.manualMinutes += minutes;
        else if (source === 'manual-clock') row.manualClockMinutes += minutes;
        else if (source === 'auto-geofence') row.autoGeofenceMinutes += minutes;
        else if (source === 'offline-queued') row.offlineQueuedMinutes += minutes;
        else row.unknownMinutes += minutes;
      });
    });

    const rows = Array.from(summary.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName)
    );

    const csvLines = [
      [
        'employeeId',
        'employeeName',
        'weekStart',
        'weekEnd',
        'entryCount',
        'manualHours',
        'manualClockHours',
        'autoGeofenceHours',
        'offlineQueuedHours',
        'unknownSourceHours',
        'totalHours',
      ].join(','),
      ...rows.map((row) =>
        [
          row.employeeId,
          row.employeeName,
          weekStartKey,
          weekEndKey,
          row.entryCount,
          (row.manualMinutes / 60).toFixed(2),
          (row.manualClockMinutes / 60).toFixed(2),
          (row.autoGeofenceMinutes / 60).toFixed(2),
          (row.offlineQueuedMinutes / 60).toFixed(2),
          (row.unknownMinutes / 60).toFixed(2),
          (row.totalMinutes / 60).toFixed(2),
        ]
          .map(escapeCsvValue)
          .join(',')
      ),
    ];

    const csv = csvLines.join('\n');
    const filename = `payroll-timesheet-export-${weekStartKey}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating payroll timesheet export:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate payroll export' },
      { status: 500 }
    );
  }
}
