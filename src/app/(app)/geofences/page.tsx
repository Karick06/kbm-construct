'use client';

import { useEffect, useMemo, useState } from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import type { Geofence } from '@/lib/geofence';

type EditableGeofence = {
  id: string;
  name: string;
  type: Geofence['type'];
  latitude: string;
  longitude: string;
  radiusMeters: string;
  address: string;
  active: boolean;
  coordinatesKnown: boolean;
};

type GeofenceSectionProps = {
  title: string;
  items: Geofence[];
  onAdd: () => void;
  onEdit: (geofence: Geofence) => void;
  onDelete: (geofence: Geofence) => void;
  busyId: string | null;
};

function createEmptyForm(type: Geofence['type']): EditableGeofence {
  return {
    id: '',
    name: '',
    type,
    latitude: '',
    longitude: '',
    radiusMeters: '200',
    address: '',
    active: true,
    coordinatesKnown: false,
  };
}

function createFormFromGeofence(geofence: Geofence): EditableGeofence {
  return {
    id: geofence.id,
    name: geofence.name,
    type: geofence.type,
    latitude: String(geofence.latitude),
    longitude: String(geofence.longitude),
    radiusMeters: String(geofence.radiusMeters),
    address: geofence.address,
    active: geofence.active,
    coordinatesKnown: geofence.active,
  };
}

function createGeofenceId(type: Geofence['type']) {
  const prefix = type === 'office' ? 'office' : 'site';

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function GeofenceSection({ title, items, onAdd, onEdit, onDelete, busyId }: GeofenceSectionProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          + Add
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 bg-gray-800/60 p-4 text-sm text-gray-400">
            No geofences added yet.
          </div>
        ) : null}

        {items.map((geofence) => (
          <div
            key={geofence.id}
            className="rounded-lg border border-gray-700 bg-gray-800 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{geofence.name}</h3>
                <p className="mt-1 text-xs text-gray-400">{geofence.address}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Radius: {geofence.radiusMeters}m · {geofence.latitude.toFixed(5)},{' '}
                  {geofence.longitude.toFixed(5)}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  geofence.active
                    ? 'bg-emerald-900/60 text-emerald-300'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {geofence.active ? 'Active' : 'Needs pin'}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(geofence)}
                className="rounded bg-blue-900 px-2 py-1 text-xs text-blue-300 transition hover:bg-blue-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(geofence)}
                disabled={busyId === geofence.id}
                className="rounded bg-red-900 px-2 py-1 text-xs text-red-300 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === geofence.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditableGeofence>(createEmptyForm('office'));
  const [error, setError] = useState<string | null>(null);

  const officeGeofences = useMemo(
    () => geofences.filter((geofence) => geofence.type === 'office'),
    [geofences]
  );
  const projectGeofences = useMemo(
    () => geofences.filter((geofence) => geofence.type === 'project-site'),
    [geofences]
  );

  useEffect(() => {
    void fetchGeofences();
  }, []);

  async function fetchGeofences() {
    try {
      setLoading(true);
      const response = await fetch('/api/geofences');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch geofences');
      }

      setGeofences(data.data);
    } catch (fetchError) {
      console.error('Error fetching geofences:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch geofences');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal(type: Geofence['type']) {
    setError(null);
    setIsEditing(false);
    setForm(createEmptyForm(type));
    setIsModalOpen(true);
  }

  function openEditModal(geofence: Geofence) {
    setError(null);
    setIsEditing(true);
    setForm(createFormFromGeofence(geofence));
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setError(null);
  }

  function updateForm<K extends keyof EditableGeofence>(key: K, value: EditableGeofence[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    const radiusMeters = Number(form.radiusMeters);

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      setError('Radius must be greater than 0.');
      return;
    }

    const latitude = form.coordinatesKnown ? Number(form.latitude) : undefined;
    const longitude = form.coordinatesKnown ? Number(form.longitude) : undefined;

    if (
      form.coordinatesKnown &&
      (!Number.isFinite(latitude) || !Number.isFinite(longitude))
    ) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Partial<Geofence> & { id: string; name: string; type: Geofence['type'] } = {
        id: form.id || createGeofenceId(form.type),
        name: form.name.trim(),
        type: form.type,
        radiusMeters,
        address: form.address.trim() || 'Project address to be confirmed',
        active: form.coordinatesKnown ? form.active : false,
      };

      if (form.coordinatesKnown) {
        payload.latitude = latitude;
        payload.longitude = longitude;
      }

      const response = await fetch('/api/geofences', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save geofence');
      }

      await fetchGeofences();
      setIsModalOpen(false);
    } catch (saveError) {
      console.error('Error saving geofence:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to save geofence');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(geofence: Geofence) {
    const confirmed = window.confirm(`Delete geofence "${geofence.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setBusyId(geofence.id);
      setError(null);

      const response = await fetch(`/api/geofences?id=${encodeURIComponent(geofence.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete geofence');
      }

      await fetchGeofences();
    } catch (deleteError) {
      console.error('Error deleting geofence:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete geofence');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PermissionGuard permission="timesheets">
      <div className="space-y-8">
        {error ? (
          <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-white">Loading geofences...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <GeofenceSection
              title="🏢 Office Locations"
              items={officeGeofences}
              onAdd={() => openCreateModal('office')}
              onEdit={openEditModal}
              onDelete={handleDelete}
              busyId={busyId}
            />
            <GeofenceSection
              title="🏗️ Project Sites"
              items={projectGeofences}
              onAdd={() => openCreateModal('project-site')}
              onEdit={openEditModal}
              onDelete={handleDelete}
              busyId={busyId}
            />
          </div>
        )}

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">How It Works</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✓ When employees enter a geofenced area, they're automatically clocked in</li>
            <li>✓ When they leave, they're automatically clocked out</li>
            <li>✓ Time is tracked down to the minute</li>
            <li>✓ Manual adjustments and notes can be added</li>
            <li>✓ Timesheets can be reviewed and approved</li>
          </ul>
        </div>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEditing ? 'Edit Geofence' : 'Add Geofence'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Set the location, radius, and status used for automatic time tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-300">
                  <span>Name</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none ring-0 placeholder:text-gray-500 focus:border-orange-500"
                    placeholder="e.g. KBM Head Office"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-300">
                  <span>Type</span>
                  <select
                    value={form.type}
                    onChange={(event) => updateForm('type', event.target.value as Geofence['type'])}
                    disabled={isEditing}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="office">Office</option>
                    <option value="project-site">Project site</option>
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.coordinatesKnown}
                    onChange={(event) => updateForm('coordinatesKnown', event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-orange-500 focus:ring-orange-500"
                  />
                  I have exact coordinates for this geofence
                </label>

                <label className="space-y-2 text-sm text-gray-300">
                  <span>Latitude</span>
                  <input
                    value={form.latitude}
                    onChange={(event) => updateForm('latitude', event.target.value)}
                    disabled={!form.coordinatesKnown}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="51.5074"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-300">
                  <span>Longitude</span>
                  <input
                    value={form.longitude}
                    onChange={(event) => updateForm('longitude', event.target.value)}
                    disabled={!form.coordinatesKnown}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="-0.1278"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-300">
                  <span>Radius (metres)</span>
                  <input
                    value={form.radiusMeters}
                    onChange={(event) => updateForm('radiusMeters', event.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-orange-500"
                    placeholder="200"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 md:self-end">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => updateForm('active', event.target.checked)}
                    disabled={!form.coordinatesKnown}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-orange-500 focus:ring-orange-500"
                  />
                  Active geofence
                </label>

                <label className="space-y-2 text-sm text-gray-300 md:col-span-2">
                  <span>Address</span>
                  <textarea
                    value={form.address}
                    onChange={(event) => updateForm('address', event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-orange-500"
                    placeholder="Site or office address"
                  />
                </label>
              </div>

              {!form.coordinatesKnown ? (
                <div className="mt-4 rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
                  Save this as an address-only draft for now. It will appear as <strong>Needs pin</strong>
                  {' '}and will not auto-clock staff until coordinates are added later.
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  New project geofences are also created automatically when a project is set up.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Geofence'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
