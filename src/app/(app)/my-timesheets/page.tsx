/**
 * My Timesheets Page
 * View and submit personal timesheets
 */

'use client';

import { useEffect, useState } from 'react';
import type { DailyTimesheet, TimesheetEntry } from '@/lib/timesheet-models';

export default function MyTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<DailyTimesheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">My Timesheets</h1>
        <p className="text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Timesheets</h1>
        <p className="mt-2 text-gray-300">View and manage your timesheets</p>
      </div>

      {timesheets.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-12 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-400 mb-6">No timesheets submitted yet</p>
          <button className="rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600">
            + Create Timesheet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {timesheets.map((timesheet) => (
            <div
              key={timesheet.id}
              className="rounded-lg border border-gray-700 bg-gray-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{timesheet.date}</h3>
                  <p className="text-sm text-gray-400">
                    {timesheet.totalHours} hours • {timesheet.entries.length} entries
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      timesheet.submissionStatus === 'approved'
                        ? 'bg-green-900 text-green-200'
                        : timesheet.submissionStatus === 'submitted'
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {timesheet.submissionStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {timesheet.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-t border-gray-700">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {entry.geofenceName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {entry.checkInTime} - {entry.checkOutTime ?? 'In Progress'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-orange-400">
                      {(entry.duration / 60).toFixed(1)}h
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
