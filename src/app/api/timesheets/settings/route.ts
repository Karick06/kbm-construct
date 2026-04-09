import { NextRequest, NextResponse } from 'next/server';
import { readGlobalJsonStore, writeGlobalJsonStore } from '@/lib/global-storage';
import {
  DEFAULT_TIMESHEET_AUTOMATION_SETTINGS,
  type TimesheetAutomationSettings,
} from '@/lib/timesheet-settings';

const LOCAL_RELATIVE_PATH = 'data/timesheet-settings.json';
const REMOTE_RELATIVE_PATH = 'data/timesheet-settings.json';

async function readSettings(): Promise<TimesheetAutomationSettings> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: DEFAULT_TIMESHEET_AUTOMATION_SETTINGS,
  });

  if (!parsed || typeof parsed !== 'object') {
    return DEFAULT_TIMESHEET_AUTOMATION_SETTINGS;
  }

  const settings = parsed as Partial<TimesheetAutomationSettings>;
  const geofenceGraceMeters = Number(settings.geofenceGraceMeters);

  return {
    forceAutoClock: Boolean(settings.forceAutoClock),
    geofenceGraceMeters:
      Number.isFinite(geofenceGraceMeters) && geofenceGraceMeters >= 0
        ? geofenceGraceMeters
        : DEFAULT_TIMESHEET_AUTOMATION_SETTINGS.geofenceGraceMeters,
  };
}

async function writeSettings(value: TimesheetAutomationSettings): Promise<void> {
  await writeGlobalJsonStore<TimesheetAutomationSettings>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value,
  });
}

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error loading timesheet automation settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TimesheetAutomationSettings>;

    const geofenceGraceMeters = Number(body.geofenceGraceMeters);
    const next: TimesheetAutomationSettings = {
      forceAutoClock: Boolean(body.forceAutoClock),
      geofenceGraceMeters:
        Number.isFinite(geofenceGraceMeters) && geofenceGraceMeters >= 0
          ? geofenceGraceMeters
          : DEFAULT_TIMESHEET_AUTOMATION_SETTINGS.geofenceGraceMeters,
    };

    await writeSettings(next);
    return NextResponse.json({ success: true, data: next });
  } catch (error) {
    console.error('Error saving timesheet automation settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
