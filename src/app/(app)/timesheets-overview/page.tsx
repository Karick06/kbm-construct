/**
 * Timesheets Overview Page
 * Dashboard for timesheet management
 */

'use client';

import { useEffect, useState } from 'react';
import type { DailyTimesheet, TimesheetStats } from '@/lib/timesheet-models';

export default function TimesheetsOverviewPage() {
  const [stats, setStats] = useState<TimesheetStats>({
    totalHoursThisWeek: 45,
    totalHoursThisMonth: 180,
    averageDailyHours: 9,
    MostVisitedSite: 'London Construction Site',
    currentStatus: 'clocked-out',
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Timesheets</h1>
        <p className="mt-2 text-gray-300">GPS-based automated timesheet tracking</p>
      </div>

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
            <button className="rounded-lg bg-orange-500 px-8 py-3 font-semibold text-white hover:bg-orange-600">
              {stats.currentStatus === 'clocked-in' ? 'Clock Out' : 'Clock In'} via GPS
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
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-gray-400">No timesheet entries yet</p>
        </div>
      </div>
    </div>
  );
}
