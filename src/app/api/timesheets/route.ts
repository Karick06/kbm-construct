/**
 * API Route: Fetch Timesheets
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DailyTimesheet } from '@/lib/timesheet-models';
import { readGlobalJsonStore, writeGlobalJsonStore } from '@/lib/global-storage';

const LOCAL_RELATIVE_PATH = 'data/timesheets.json';
const REMOTE_RELATIVE_PATH = 'data/timesheets.json';

function getLocalDateString(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function readStore(): Promise<DailyTimesheet[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as DailyTimesheet[]) : [];
}

async function writeStore(items: DailyTimesheet[]): Promise<void> {
  await writeGlobalJsonStore<DailyTimesheet[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  try {
    const timesheets = await readStore();
    const filtered = timesheets
      .filter((timesheet) => !employeeId || timesheet.employeeId === employeeId)
      .filter((timesheet) => !date || timesheet.date === date)
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timesheets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<DailyTimesheet>;

    if (!body.employeeId || !body.employeeName || !body.date || !Array.isArray(body.entries)) {
      return NextResponse.json(
        { success: false, error: 'employeeId, employeeName, date and entries are required' },
        { status: 400 }
      );
    }

    const totalMinutes = body.entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const nextItem: DailyTimesheet = {
      id: body.id || `ts-${body.employeeId}-${body.date || getLocalDateString()}`,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      date: body.date,
      entries: body.entries,
      totalHours: Number((totalMinutes / 60).toFixed(2)),
      submissionStatus: body.submissionStatus || 'draft',
    };

    const existing = await readStore();
    const next = [nextItem, ...existing.filter((timesheet) => timesheet.id !== nextItem.id)].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    await writeStore(next);

    return NextResponse.json({ success: true, data: nextItem });
  } catch (error) {
    console.error('Error saving timesheet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save timesheet' },
      { status: 500 }
    );
  }
}
