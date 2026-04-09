'use client';
import PermissionGuard from "@/components/PermissionGuard";

/**
 * Timesheets Overview Page
 * Dashboard for timesheet management
 */


import { useEffect, useMemo, useState } from 'react';
import type { DailyTimesheet, TimesheetEntry, TimesheetStats } from '@/lib/timesheet-models';
import { locationTracker } from '@/lib/location-tracker';
import { getCachedData, queueOfflineRequest, setCachedData, syncQueuedRequests } from '@/lib/offline-first';
import { useNotifications } from '@/lib/notifications-context';

const DEFAULT_EMPLOYEE_ID = 'emp-001';

function getMonthKey(dateValue: string): string {
  return dateValue.slice(0, 7);
}

function getStartOfWeek(value = new Date()): Date {
  const start = new Date(value);
  const day = start.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function deriveStatsFromTimesheets(timesheets: DailyTimesheet[]): Pick<TimesheetStats, 'totalHoursThisWeek' | 'totalHoursThisMonth' | 'averageDailyHours' | 'MostVisitedSite' | 'currentStatus'> {
  const now = new Date();
  const thisMonthKey = getMonthKey(now.toISOString().slice(0, 10));
  const startOfWeek = getStartOfWeek(now);

  const thisMonthTimesheets = timesheets.filter((timesheet) => getMonthKey(timesheet.date) === thisMonthKey);
  const thisWeekTimesheets = timesheets.filter((timesheet) => {
    const date = new Date(`${timesheet.date}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date >= startOfWeek;
  });

  const totalHoursThisMonth = Number(
    thisMonthTimesheets.reduce((sum, timesheet) => sum + (timesheet.totalHours || 0), 0).toFixed(2)
  );
  const totalHoursThisWeek = Number(
    thisWeekTimesheets.reduce((sum, timesheet) => sum + (timesheet.totalHours || 0), 0).toFixed(2)
  );

  const averageDailyHours = thisMonthTimesheets.length > 0
    ? Number((totalHoursThisMonth / thisMonthTimesheets.length).toFixed(2))
    : 0;

  const allEntries = timesheets.flatMap((timesheet) => timesheet.entries || []);
  const siteCount = allEntries.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.geofenceName || 'Unknown Site';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const mostVisitedEntry = Object.entries(siteCount).sort((a, b) => b[1] - a[1])[0];
  const MostVisitedSite = mostVisitedEntry?.[0] || 'No recorded site yet';

  const hasActiveEntry = allEntries.some((entry) => entry.status === 'active' && !entry.checkOutTime);

  return {
    totalHoursThisWeek,
    totalHoursThisMonth,
    averageDailyHours,
    MostVisitedSite,
    currentStatus: hasActiveEntry ? 'clocked-in' : 'clocked-out',
  };
}

export default function TimesheetsOverviewPage() {
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<TimesheetStats>({
    totalHoursThisWeek: 45,
    totalHoursThisMonth: 180,
    averageDailyHours: 9,
    MostVisitedSite: 'London Construction Site',
    currentStatus: 'clocked-out',
  });
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isClocking, setIsClocking] = useState(false);
  const [clockActionLabel, setClockActionLabel] = useState('');

  const currentAction = useMemo(
    () => (stats.currentStatus === 'clocked-in' ? 'clock-out' : 'clock-in'),
    [stats.currentStatus]
  );

  useEffect(() => {
    const cachedEntries = getCachedData<TimesheetEntry[]>('timesheets_recent_entries', []);
    if (cachedEntries.length > 0) {
      setEntries(cachedEntries);
    }

    fetchTimesheets();

    const handleOnline = async () => {
      const result = await syncQueuedRequests();
      if (result.synced > 0) {
        addNotification({
          title: 'Offline sync completed',
          message: `${result.synced} queued timesheet action(s) synced.`,
          type: 'success',
          actionUrl: '/timesheets-overview',
        });
        fetchTimesheets();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  async function fetchTimesheets() {
    try {
      const response = await fetch(`/api/timesheets?employeeId=${encodeURIComponent(DEFAULT_EMPLOYEE_ID)}`);
      const payload = await response.json();
      const timesheets = (payload?.data || []) as DailyTimesheet[];

      if (Array.isArray(timesheets)) {
        const recentEntries = timesheets
          .flatMap((timesheet) => timesheet.entries || [])
          .sort((a, b) => {
            const aDate = `${a.date}T${a.checkInTime || '00:00'}:00`;
            const bDate = `${b.date}T${b.checkInTime || '00:00'}:00`;
            return bDate.localeCompare(aDate);
          });

        setEntries(recentEntries);
        setCachedData('timesheets_recent_entries', recentEntries);
        setStats((current) => ({
          ...current,
          ...deriveStatsFromTimesheets(timesheets),
        }));
      }
    } catch {
      const cachedEntries = getCachedData<TimesheetEntry[]>('timesheets_recent_entries', []);
      setEntries(cachedEntries);
    }
  }

  async function handleClockAction() {
    setIsClocking(true);
    setClockActionLabel('Getting location...');

    try {
      const currentLocation = await locationTracker.getCurrentLocation();
      setLocation(currentLocation);

      const requestPayload = {
        employeeId: 'emp-001',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        action: currentAction,
      };

      setClockActionLabel('Submitting timesheet action...');

      try {
        const response = await fetch('/api/timesheets/clock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));

          if (response.status === 403 && errorPayload?.code === 'OUTSIDE_GEOFENCE') {
            addNotification({
              title: 'Outside geofence',
              message: errorPayload?.error || 'Move closer to a configured site geofence to clock in.',
              type: 'warning',
              actionUrl: '/geofences',
            });
            return;
          }

          throw new Error(errorPayload?.error || 'Clock request failed');
        }

        const payload = await response.json();

        setStats((prev) => ({
          ...prev,
          currentStatus: currentAction === 'clock-in' ? 'clocked-in' : 'clocked-out',
          MostVisitedSite: payload?.data?.geofenceName || prev.MostVisitedSite,
        }));

        addNotification({
          title: currentAction === 'clock-in' ? 'Clocked in' : 'Clocked out',
          message: payload?.data?.message || 'Timesheet action recorded successfully.',
          type: 'success',
          actionUrl: '/my-timesheets',
        });
      } catch (error) {
        if (navigator.onLine) {
          addNotification({
            title: 'Clock action failed',
            message: error instanceof Error ? error.message : 'Unable to process clock action right now.',
            type: 'error',
            actionUrl: '/timesheets-overview',
          });
          return;
        }

        queueOfflineRequest({
          url: '/api/timesheets/clock',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        setStats((prev) => ({
          ...prev,
          currentStatus: currentAction === 'clock-in' ? 'clocked-in' : 'clocked-out',
        }));

        addNotification({
          title: 'Offline mode',
          message: `${currentAction === 'clock-in' ? 'Clock in' : 'Clock out'} queued and will sync when connection returns.`,
          type: 'warning',
          actionUrl: '/timesheets-overview',
        });
      }
    } catch (error) {
      addNotification({
        title: 'Location unavailable',
        message: 'Unable to get your GPS location. Check browser/location permissions.',
        type: 'error',
        actionUrl: '/timesheets-overview',
      });
      console.error('Clock action failed', error);
    } finally {
      setIsClocking(false);
      setClockActionLabel('');
      fetchTimesheets();
    }
  }

  return (
    <PermissionGuard permission="timesheets">
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700 border-l-4 border-l-orange-500 bg-gray-800 px-5 py-4">
          <p className="text-xs font-bold uppercase text-gray-400">This Week</p>
          <p className="text-2xl font-bold text-white">{stats.totalHoursThisWeek}h</p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700 border-l-4 border-l-orange-500 bg-gray-800 px-5 py-4">
          <p className="text-xs font-bold uppercase text-gray-400">This Month</p>
          <p className="text-2xl font-bold text-white">{stats.totalHoursThisMonth}h</p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700 border-l-4 border-l-orange-500 bg-gray-800 px-5 py-4">
          <p className="text-xs font-bold uppercase text-gray-400">Daily Average</p>
          <p className="text-2xl font-bold text-white">{stats.averageDailyHours}h</p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700 border-l-4 border-l-orange-500 bg-gray-800 px-5 py-4">
          <p className="text-xs font-bold uppercase text-gray-400">Recent Site</p>
          <p className="text-sm font-semibold text-white">{stats.MostVisitedSite}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Clock In/Out</h2>
          <div className="text-center py-8">
            <p className="text-5xl mb-4">⏱️</p>
            <p className="text-gray-300 mb-6">
              Status:{' '}
              <span className="font-semibold text-orange-500">
                {stats.currentStatus === 'clocked-in' ? 'Clocked In' : 'Clocked Out'}
              </span>
            </p>
            {location && (
              <p className="mb-3 text-xs text-gray-400">
                GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </p>
            )}
            <button
              onClick={handleClockAction}
              disabled={isClocking}
              className="rounded-lg bg-orange-500 px-8 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isClocking ? clockActionLabel || 'Processing...' : `${stats.currentStatus === 'clocked-in' ? 'Clock Out' : 'Clock In'} via GPS`}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Location Map</h2>
          <div className="text-center py-8">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-gray-300">Showing current location and nearby geofences</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Entries</h2>
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">📝</p>
            <p className="text-gray-400">No timesheet entries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-gray-700/70 bg-gray-900/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{entry.geofenceName}</p>
                  <p className="text-xs text-gray-400">{entry.date}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {entry.checkInTime} - {entry.checkOutTime ?? 'In Progress'} • {(entry.duration / 60).toFixed(1)}h
                </p>
                {(typeof entry.latitude === 'number' && typeof entry.longitude === 'number') && (
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.latitude.toFixed(5)}, {entry.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}
