'use client';
import PermissionGuard from "@/components/PermissionGuard";

/**
 * Timesheets Overview Page
 * Dashboard for timesheet management
 */


import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyTimesheet, TimesheetEntry, TimesheetStats } from '@/lib/timesheet-models';
import { locationTracker } from '@/lib/location-tracker';
import { getCachedData, queueOfflineRequest, setCachedData, syncQueuedRequests } from '@/lib/offline-first';
import { useNotifications } from '@/lib/notifications-context';
import { getDistanceFromLatLonInMeters, getGeofencesAtLocation, type Geofence } from '@/lib/geofence';
import { DEFAULT_TIMESHEET_AUTOMATION_SETTINGS, type TimesheetAutomationSettings } from '@/lib/timesheet-settings';

const DEFAULT_EMPLOYEE_ID = 'emp-001';
const DEFAULT_EMPLOYEE_NAME = 'John Smith';
const AUTO_CLOCK_STORAGE_KEY = 'kbm_auto_geofence_clock_enabled';

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
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isClocking, setIsClocking] = useState(false);
  const [clockActionLabel, setClockActionLabel] = useState('');
  const [autoClockEnabled, setAutoClockEnabled] = useState(false);
  const [autoClockStatusLabel, setAutoClockStatusLabel] = useState('Auto clocking disabled');
  const [automationSettings, setAutomationSettings] = useState<TimesheetAutomationSettings>(
    DEFAULT_TIMESHEET_AUTOMATION_SETTINGS,
  );

  const statusRef = useRef<TimesheetStats['currentStatus']>('clocked-out');
  const autoClockInFlightRef = useRef(false);
  const previousInsideGeofenceRef = useRef<boolean | null>(null);
  const currentClockedGeofenceIdRef = useRef<string | null>(null);

  const currentAction = useMemo(
    () => (stats.currentStatus === 'clocked-in' ? 'clock-out' : 'clock-in'),
    [stats.currentStatus]
  );
  const effectiveAutoClockEnabled = autoClockEnabled || automationSettings.forceAutoClock;

  useEffect(() => {
    statusRef.current = stats.currentStatus;
  }, [stats.currentStatus]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(AUTO_CLOCK_STORAGE_KEY) : null;
    setAutoClockEnabled(stored === 'true');
  }, []);

  useEffect(() => {
    const cachedEntries = getCachedData<TimesheetEntry[]>('timesheets_recent_entries', []);
    if (cachedEntries.length > 0) {
      setEntries(cachedEntries);
    }

    fetchTimesheets();
  void fetchGeofences();
    void fetchAutomationSettings();

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_CLOCK_STORAGE_KEY, autoClockEnabled ? 'true' : 'false');
    }

    if (!effectiveAutoClockEnabled) {
      locationTracker.stopTracking();
      previousInsideGeofenceRef.current = null;
      currentClockedGeofenceIdRef.current = null;
      setAutoClockStatusLabel('Auto clocking disabled');
      return;
    }

    if (!navigator.geolocation) {
      setAutoClockStatusLabel('Geolocation not available on this device');
      return;
    }

    if (!('Notification' in window)) {
      setAutoClockStatusLabel('Notifications unavailable in this browser');
    } else if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    setAutoClockStatusLabel('Monitoring location for site entry/exit...');

    locationTracker.startTracking(
      (latitude, longitude) => {
        void handleAutoLocationUpdate(latitude, longitude);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      locationTracker.stopTracking();
    };
  }, [effectiveAutoClockEnabled, geofences, automationSettings.geofenceGraceMeters]);

  async function fetchGeofences() {
    try {
      const response = await fetch('/api/geofences', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload?.success || !Array.isArray(payload?.data)) {
        throw new Error(payload?.error || 'Failed to fetch geofences');
      }
      setGeofences(payload.data as Geofence[]);
    } catch {
      setGeofences([]);
    }
  }

  async function fetchAutomationSettings() {
    try {
      const response = await fetch('/api/timesheets/settings', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload?.success || !payload?.data) {
        throw new Error(payload?.error || 'Failed to load automation settings');
      }

      setAutomationSettings({
        forceAutoClock: Boolean(payload.data.forceAutoClock),
        geofenceGraceMeters: Number(payload.data.geofenceGraceMeters) || DEFAULT_TIMESHEET_AUTOMATION_SETTINGS.geofenceGraceMeters,
      });
    } catch {
      setAutomationSettings(DEFAULT_TIMESHEET_AUTOMATION_SETTINGS);
    }
  }

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

  async function submitClockAction(action: 'clock-in' | 'clock-out', currentLocation: { latitude: number; longitude: number }, source: 'manual' | 'auto') {
    const requestPayload = {
      employeeId: DEFAULT_EMPLOYEE_ID,
      employeeName: DEFAULT_EMPLOYEE_NAME,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      action,
      source: source === 'auto' ? 'auto-geofence' : 'manual-clock',
    };

    try {
      const response = await fetch('/api/timesheets/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));

        if (response.status === 403 && errorPayload?.code === 'OUTSIDE_GEOFENCE') {
          if (source === 'manual') {
            addNotification({
              title: 'Outside geofence',
              message: errorPayload?.error || 'Move closer to a configured site geofence to clock in.',
              type: 'warning',
              actionUrl: '/geofences',
            });
          }
          return;
        }

        throw new Error(errorPayload?.error || 'Clock request failed');
      }

      const payload = await response.json();
      currentClockedGeofenceIdRef.current =
        action === 'clock-in' ? payload?.data?.geofenceId || null : null;

      setStats((prev) => ({
        ...prev,
        currentStatus: action === 'clock-in' ? 'clocked-in' : 'clocked-out',
        MostVisitedSite: payload?.data?.geofenceName || prev.MostVisitedSite,
      }));

      addNotification({
        title:
          source === 'auto'
            ? action === 'clock-in'
              ? 'Auto clocked in'
              : 'Auto clocked out'
            : action === 'clock-in'
            ? 'Clocked in'
            : 'Clocked out',
        message: payload?.data?.message || 'Timesheet action recorded successfully.',
        type: 'success',
        actionUrl: '/my-timesheets',
      });

      if (source === 'auto') {
        setAutoClockStatusLabel(
          action === 'clock-in'
            ? `On site: ${payload?.data?.geofenceName || 'site'} (auto clock-in confirmed)`
            : 'Off site: auto clock-out confirmed'
        );
      }
    } catch (error) {
      if (navigator.onLine) {
        addNotification({
          title: source === 'auto' ? 'Auto clock failed' : 'Clock action failed',
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
        body: JSON.stringify({ ...requestPayload, source: 'offline-queued' }),
      });

      setStats((prev) => ({
        ...prev,
        currentStatus: action === 'clock-in' ? 'clocked-in' : 'clocked-out',
      }));

      addNotification({
        title: 'Offline mode',
        message: `${action === 'clock-in' ? 'Clock in' : 'Clock out'} queued and will sync when connection returns.`,
        type: 'warning',
        actionUrl: '/timesheets-overview',
      });
    }
  }

  async function handleAutoLocationUpdate(latitude: number, longitude: number) {
    setLocation({ latitude, longitude });

    const activeGeofences = geofences.filter((geofence) => geofence.active);
    if (activeGeofences.length === 0) {
      setAutoClockStatusLabel('No active geofences available for auto clocking');
      return;
    }

    const matchedGeofences = getGeofencesAtLocation(latitude, longitude, activeGeofences);
    const nearestActiveGeofence = activeGeofences
      .map((geofence) => ({
        geofence,
        distanceMeters: getDistanceFromLatLonInMeters(latitude, longitude, geofence.latitude, geofence.longitude),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

    const grace = Math.max(0, Number(automationSettings.geofenceGraceMeters) || 0);
    const radius = nearestActiveGeofence?.geofence.radiusMeters || 0;
    const nearestDistance = nearestActiveGeofence?.distanceMeters ?? Number.POSITIVE_INFINITY;
    const enteringThreshold = Math.max(0, radius - grace);
    const exitThreshold = radius + grace;

    let insideGeofence = matchedGeofences.length > 0;
    const previousInside = previousInsideGeofenceRef.current;

    if (nearestActiveGeofence) {
      if (previousInside === true) {
        insideGeofence = nearestDistance <= exitThreshold;
      } else {
        insideGeofence = nearestDistance <= enteringThreshold;
      }
    }

    const siteName = nearestActiveGeofence?.geofence.name || matchedGeofences[0]?.name;

    if (previousInsideGeofenceRef.current === null) {
      previousInsideGeofenceRef.current = insideGeofence;
      setAutoClockStatusLabel(insideGeofence ? `On site: ${siteName || 'site'}` : 'Off site: waiting for site entry');
      return;
    }

    if (previousInsideGeofenceRef.current === insideGeofence) {
      setAutoClockStatusLabel(
        insideGeofence
          ? `On site: ${siteName || 'site'} (buffer ${grace}m)`
          : 'Off site: waiting for site entry'
      );
      return;
    }

    if (autoClockInFlightRef.current) return;

    const shouldClockIn = insideGeofence && statusRef.current === 'clocked-out';
    const shouldClockOut = !insideGeofence && statusRef.current === 'clocked-in';

    previousInsideGeofenceRef.current = insideGeofence;

    if (!shouldClockIn && !shouldClockOut) {
      return;
    }

    autoClockInFlightRef.current = true;
    try {
      await submitClockAction(shouldClockIn ? 'clock-in' : 'clock-out', { latitude, longitude }, 'auto');
      await fetchTimesheets();
    } finally {
      autoClockInFlightRef.current = false;
    }
  }

  async function handleClockAction() {
    setIsClocking(true);
    setClockActionLabel('Getting location...');

    try {
      const currentLocation = await locationTracker.getCurrentLocation();
      setLocation(currentLocation);

      setClockActionLabel('Submitting timesheet action...');
      await submitClockAction(currentAction, currentLocation, 'manual');
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
            <div className="mb-3 rounded-lg border border-gray-700/70 bg-gray-900/50 p-3 text-left">
              <label className="flex items-center justify-between gap-3 text-sm text-gray-200">
                <span>Auto clock using geofence entry/exit</span>
                <input
                  type="checkbox"
                  checked={effectiveAutoClockEnabled}
                  onChange={(event) => setAutoClockEnabled(event.target.checked)}
                  disabled={automationSettings.forceAutoClock}
                  className="h-4 w-4 rounded border-gray-500 bg-gray-800"
                />
              </label>
              {automationSettings.forceAutoClock ? (
                <p className="mt-2 text-xs text-amber-300">Auto clocking is enforced by admin settings.</p>
              ) : null}
              <p className="mt-2 text-xs text-gray-400">{autoClockStatusLabel}</p>
            </div>
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
                {entry.source ? (
                  <p className="mt-1 text-xs text-amber-300">
                    Source: {entry.source === 'auto-geofence' ? 'Auto Geofence' : entry.source === 'manual-clock' ? 'Manual Clock' : entry.source === 'offline-queued' ? 'Offline Queue' : 'Manual'}
                  </p>
                ) : null}
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
