export interface TimesheetAutomationSettings {
  forceAutoClock: boolean;
  geofenceGraceMeters: number;
}

export const DEFAULT_TIMESHEET_AUTOMATION_SETTINGS: TimesheetAutomationSettings = {
  forceAutoClock: false,
  geofenceGraceMeters: 20,
};
