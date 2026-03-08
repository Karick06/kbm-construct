/**
 * Timesheets Overview Page
 * Dashboard for timesheet management
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TimesheetEntry, TimesheetStats } from '@/lib/timesheet-models';
import { locationTracker } from '@/lib/location-tracker';
import { getCachedData, queueOfflineRequest, setCachedData, syncQueuedRequests } from '@/lib/offline-first';
import { useNotifications } from '@/lib/notifications-context';

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
      const response = await fetch('/api/timesheets');
      const payload = await response.json();
      const recentEntries = (payload?.data?.[0]?.entries || []) as TimesheetEntry[];
      if (Array.isArray(recentEntries)) {
        setEntries(recentEntries);
        setCachedData('timesheets_recent_entries', recentEntries);
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
          throw new Error('Clock request failed');
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
      } catch {
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
  );
}
