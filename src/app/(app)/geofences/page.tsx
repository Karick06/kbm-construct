'use client';
import PermissionGuard from "@/components/PermissionGuard";

/**
 * Geofences Management Page
 * Configure project sites and office locations
 */


import { useEffect, useState } from 'react';
import type { Geofence } from '@/lib/geofence';

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGeofences();
  }, []);

  const fetchGeofences = async () => {
    try {
      const response = await fetch('/api/geofences');
      const data = await response.json();
      if (data.success) {
        setGeofences(data.data);
      }
    } catch (error) {
      console.error('Error fetching geofences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading geofences...</div>;
  }

  const officeGeofences = geofences.filter((g) => g.type === 'office');
  const projectGeofences = geofences.filter((g) => g.type === 'project-site');

  return (
    <PermissionGuard permission="timesheets">
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🏢 Office Locations</h2>
            <button className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              + Add
            </button>
          </div>
          <div className="space-y-3">
            {officeGeofences.map((geofence) => (
              <div
                key={geofence.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <h3 className="font-semibold text-white">{geofence.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{geofence.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Radius: {geofence.radiusMeters}m
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300 hover:bg-blue-800">
                    Edit
                  </button>
                  <button className="text-xs px-2 py-1 rounded bg-red-900 text-red-300 hover:bg-red-800">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🏗️ Project Sites</h2>
            <button className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              + Add
            </button>
          </div>
          <div className="space-y-3">
            {projectGeofences.map((geofence) => (
              <div
                key={geofence.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <h3 className="font-semibold text-white">{geofence.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{geofence.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Radius: {geofence.radiusMeters}m
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300 hover:bg-blue-800">
                    Edit
                  </button>
                  <button className="text-xs px-2 py-1 rounded bg-red-900 text-red-300 hover:bg-red-800">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">How It Works</h2>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>✓ When employees enter a geofenced area, they're automatically clocked in</li>
          <li>✓ When they leave, they're automatically clocked out</li>
          <li>✓ Time is tracked down to the minute</li>
          <li>✓ Manual adjustments and notes can be added</li>
          <li>✓ Timesheets can be reviewed and approved</li>
        </ul>
      </div>
    </div>
    </PermissionGuard>
  );
}
