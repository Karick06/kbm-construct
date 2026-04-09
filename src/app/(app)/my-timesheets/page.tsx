/**
 * My Timesheets Page
 * View and submit personal timesheets - Mobile optimized
 */

'use client';

import { useEffect, useState } from 'react';
import type { DailyTimesheet, TimesheetEntry } from '@/lib/timesheet-models';
import MobileCard from '@/components/MobileCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import PullToRefresh from '@/components/PullToRefresh';
import PageHeader from '@/components/PageHeader';
import MobileDrawer from '@/components/MobileDrawer';

const LOCAL_TIMESHEETS_KEY = 'kbm_user_timesheets';
const DEFAULT_EMPLOYEE_ID = 'emp-001';
const DEFAULT_EMPLOYEE_NAME = 'John Smith';

type TimesheetFormState = {
  date: string;
  geofenceName: string;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
};

export default function MyTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<DailyTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ timesheetId: string; entryId: string } | null>(null);
  const [formState, setFormState] = useState<TimesheetFormState>({
    date: new Date().toISOString().split('T')[0],
    geofenceName: '',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    notes: '',
  });

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const getLocalTimesheets = (): DailyTimesheet[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_TIMESHEETS_KEY);
      return raw ? (JSON.parse(raw) as DailyTimesheet[]) : [];
    } catch {
      return [];
    }
  };

  const saveLocalTimesheets = (next: DailyTimesheet[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_TIMESHEETS_KEY, JSON.stringify(next));
  };

  const mergeTimesheets = (serverTimesheets: DailyTimesheet[], localTimesheets: DailyTimesheet[]) => {
    const merged = new Map<string, DailyTimesheet>();
    for (const timesheet of serverTimesheets) merged.set(timesheet.id, timesheet);
    for (const timesheet of localTimesheets) merged.set(timesheet.id, timesheet);

    return Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date));
  };

  const computeDurationMinutes = (checkInTime: string, checkOutTime: string) => {
    const [inHour, inMin] = checkInTime.split(':').map((value) => Number(value));
    const [outHour, outMin] = checkOutTime.split(':').map((value) => Number(value));
    const startMinutes = inHour * 60 + inMin;
    const endMinutes = outHour * 60 + outMin;
    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) return 0;
    return Math.max(0, endMinutes - startMinutes);
  };

  const buildEntryFromForm = (entryId?: string): TimesheetEntry => {
    const duration = computeDurationMinutes(formState.checkInTime, formState.checkOutTime);
    const geofenceId = formState.geofenceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'manual-entry';

    return {
      id: entryId || `entry-${Date.now()}`,
      employeeId: DEFAULT_EMPLOYEE_ID,
      employeeName: DEFAULT_EMPLOYEE_NAME,
      date: formState.date,
      checkInTime: formState.checkInTime,
      checkOutTime: formState.checkOutTime || null,
      geofenceId,
      geofenceName: formState.geofenceName || 'Manual Entry',
      duration,
      status: 'manual',
      notes: formState.notes.trim() || undefined,
    };
  };

  const resetForm = () => {
    setFormState({
      date: new Date().toISOString().split('T')[0],
      geofenceName: '',
      checkInTime: '08:00',
      checkOutTime: '17:00',
      notes: '',
    });
    setEditingEntry(null);
  };

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/timesheets?employeeId=${encodeURIComponent(DEFAULT_EMPLOYEE_ID)}`);
      const data = await response.json();
      const serverTimesheets = data.success ? (data.data as DailyTimesheet[]) : [];
      const localTimesheets = getLocalTimesheets();
      const merged = mergeTimesheets(serverTimesheets, localTimesheets);
      setTimesheets(merged);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      setTimesheets(getLocalTimesheets());
    } finally {
      setLoading(false);
    }
  };

  const saveTimesheetToApi = async (timesheet: DailyTimesheet) => {
    const response = await fetch('/api/timesheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timesheet),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || 'Failed to save timesheet to server');
    }
  };

  const handleRefresh = async () => {
    await fetchTimesheets();
  };

  const handleCreateNew = () => {
    resetForm();
    setShowFormDrawer(true);
  };

  const handleEditExisting = (timesheetId: string, entry: TimesheetEntry) => {
    setEditingEntry({ timesheetId, entryId: entry.id });
    setFormState({
      date: entry.date,
      geofenceName: entry.geofenceName,
      checkInTime: entry.checkInTime,
      checkOutTime: entry.checkOutTime || '17:00',
      notes: entry.notes || '',
    });
    setShowFormDrawer(true);
  };

  const handleSaveTimesheet = () => {
    if (!formState.date || !formState.geofenceName || !formState.checkInTime || !formState.checkOutTime) {
      return;
    }

    const nextTimesheets = [...timesheets];
    let changedTimesheet: DailyTimesheet | null = null;

    if (editingEntry) {
      const timesheetIndex = nextTimesheets.findIndex((item) => item.id === editingEntry.timesheetId);
      if (timesheetIndex >= 0) {
        const updatedEntry = buildEntryFromForm(editingEntry.entryId);
        const updatedEntries = nextTimesheets[timesheetIndex].entries.map((entry) =>
          entry.id === editingEntry.entryId ? updatedEntry : entry
        );
        const totalMinutes = updatedEntries.reduce((sum, entry) => sum + entry.duration, 0);
        nextTimesheets[timesheetIndex] = {
          ...nextTimesheets[timesheetIndex],
          date: formState.date,
          entries: updatedEntries,
          totalHours: Number((totalMinutes / 60).toFixed(2)),
          submissionStatus: 'draft',
        };
        changedTimesheet = nextTimesheets[timesheetIndex];
      }
    } else {
      const newEntry = buildEntryFromForm();
      const existingIndex = nextTimesheets.findIndex((item) => item.date === formState.date);

      if (existingIndex >= 0) {
        const updatedEntries = [...nextTimesheets[existingIndex].entries, newEntry];
        const totalMinutes = updatedEntries.reduce((sum, entry) => sum + entry.duration, 0);
        nextTimesheets[existingIndex] = {
          ...nextTimesheets[existingIndex],
          entries: updatedEntries,
          totalHours: Number((totalMinutes / 60).toFixed(2)),
          submissionStatus: 'draft',
        };
        changedTimesheet = nextTimesheets[existingIndex];
      } else {
        const createdTimesheet: DailyTimesheet = {
          id: `ts-${Date.now()}`,
          employeeId: DEFAULT_EMPLOYEE_ID,
          employeeName: DEFAULT_EMPLOYEE_NAME,
          date: formState.date,
          entries: [newEntry],
          totalHours: Number((newEntry.duration / 60).toFixed(2)),
          submissionStatus: 'draft',
        };

        nextTimesheets.push(createdTimesheet);
        changedTimesheet = createdTimesheet;
      }
    }

    const sorted = nextTimesheets.sort((a, b) => b.date.localeCompare(a.date));
    setTimesheets(sorted);
    saveLocalTimesheets(sorted);
    setShowFormDrawer(false);
    resetForm();

    if (changedTimesheet && navigator.onLine) {
      setSaveError(null);
      void saveTimesheetToApi(changedTimesheet).catch((error) => {
        console.error('Failed to persist timesheet to API:', error);
        setSaveError('Saved locally, but failed to sync to server. Will retry on refresh.');
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Timesheets" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--accent)]"></div>
            <p className="text-sm text-[var(--body-muted)]">Loading timesheets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <PageHeader title="My Timesheets" />
      </div>
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-3 pb-24 lg:pb-8 lg:space-y-4">
          {saveError ? (
            <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
              {saveError}
            </div>
          ) : null}

          {/* Mobile Header - Only show on mobile */}
          <div className="lg:hidden mb-4">
            <h1 className="text-2xl font-bold text-[var(--sidebar-text)]">My Timesheets</h1>
            <p className="text-sm text-[var(--sidebar-muted)] mt-1">
              {timesheets.length} {timesheets.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>

          {timesheets.length === 0 ? (
            <MobileCard className="py-12 text-center">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-[var(--sidebar-muted)] mb-6">No timesheets submitted yet</p>
              <button 
                onClick={handleCreateNew}
                className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white hover:bg-[var(--accent)]/90 active:scale-95 transition-all"
              >
                + Create Timesheet
              </button>
            </MobileCard>
          ) : (
            timesheets.map((timesheet) => (
              <MobileCard 
                key={timesheet.id}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--sidebar-text)] mb-1">
                      {new Date(timesheet.date).toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-[var(--sidebar-muted)]">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timesheet.totalHours}h
                      </span>
                      <span>•</span>
                      <span>{timesheet.entries.length} {timesheet.entries.length === 1 ? 'entry' : 'entries'}</span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                      timesheet.submissionStatus === 'approved'
                        ? 'bg-green-900/30 text-green-400'
                        : timesheet.submissionStatus === 'submitted'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    {timesheet.submissionStatus}
                  </span>
                </div>

                {/* Timesheet entries */}
                <div className="space-y-2 mt-4">
                  {timesheet.entries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-t border-[var(--line)]">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--sidebar-text)]">
                          {entry.geofenceName}
                        </p>
                        <p className="text-xs text-[var(--sidebar-muted)] mt-0.5">
                          {entry.checkInTime} - {entry.checkOutTime ?? 'In Progress'}
                        </p>
                      </div>
                      <p className="text-base font-bold text-[var(--accent)] ml-3">
                        {(entry.duration / 60).toFixed(1)}h
                      </p>
                      <button
                        onClick={() => handleEditExisting(timesheet.id, entry)}
                        className="ml-3 rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--sidebar-text)] hover:bg-[var(--surface-2)]"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                  {timesheet.entries.length > 3 && (
                    <p className="text-xs text-[var(--sidebar-muted)] text-center py-2">
                      +{timesheet.entries.length - 3} more {timesheet.entries.length - 3 === 1 ? 'entry' : 'entries'}
                    </p>
                  )}
                </div>
              </MobileCard>
            ))
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button - Mobile only */}
      <FloatingActionButton 
        onClick={handleCreateNew}
        label="New Entry"
        icon="+"
      />

      <MobileDrawer
        isOpen={showFormDrawer}
        onClose={() => {
          setShowFormDrawer(false);
          resetForm();
        }}
        title={editingEntry ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowFormDrawer(false);
                resetForm();
              }}
              className="flex-1 rounded-lg border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--sidebar-text)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTimesheet}
              className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--sidebar-text)]">Date</label>
            <input
              type="date"
              value={formState.date}
              onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--sidebar-text)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--sidebar-text)]">Site / Geofence</label>
            <input
              type="text"
              value={formState.geofenceName}
              onChange={(event) => setFormState((prev) => ({ ...prev, geofenceName: event.target.value }))}
              placeholder="e.g. London Construction Site"
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--sidebar-text)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--sidebar-text)]">Check-in</label>
              <input
                type="time"
                value={formState.checkInTime}
                onChange={(event) => setFormState((prev) => ({ ...prev, checkInTime: event.target.value }))}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--sidebar-text)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--sidebar-text)]">Check-out</label>
              <input
                type="time"
                value={formState.checkOutTime}
                onChange={(event) => setFormState((prev) => ({ ...prev, checkOutTime: event.target.value }))}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--sidebar-text)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--sidebar-text)]">Notes (optional)</label>
            <textarea
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--sidebar-text)]"
            />
          </div>
        </div>
      </MobileDrawer>
    </>
  );
}
