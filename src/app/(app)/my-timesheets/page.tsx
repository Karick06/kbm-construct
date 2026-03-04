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

export default function MyTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<DailyTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState<DailyTimesheet | null>(null);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/timesheets');
      const data = await response.json();
      if (data.success) {
        setTimesheets(data.data);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchTimesheets();
  };

  const handleCreateNew = () => {
    // TODO: Navigate to timesheet creation
    console.log('Create new timesheet');
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
                onClick={() => setSelectedTimesheet(timesheet)}
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
    </>
  );
}
