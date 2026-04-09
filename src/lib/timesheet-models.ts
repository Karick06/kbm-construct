/**
 * Timesheet Data Models
 */

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  geofenceId: string;
  geofenceName: string;
  duration: number; // in minutes
  status: 'active' | 'completed' | 'manual';
  source?: 'manual' | 'manual-clock' | 'auto-geofence' | 'offline-queued';
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface DailyTimesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  entries: TimesheetEntry[];
  totalHours: number;
  submissionStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface TimesheetStats {
  totalHoursThisWeek: number;
  totalHoursThisMonth: number;
  averageDailyHours: number;
  MostVisitedSite: string;
  currentStatus: 'clocked-in' | 'clocked-out';
}
