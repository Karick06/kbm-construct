/**
 * API Route: Fetch Geofences
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_GEOFENCES, type Geofence } from '@/lib/geofence';
import { readGlobalJsonStore, writeGlobalJsonStore } from '@/lib/global-storage';

const LOCAL_RELATIVE_PATH = 'data/geofences.json';
const REMOTE_RELATIVE_PATH = 'data/geofences.json';

async function readStoredGeofences(): Promise<Geofence[]> {
  const parsed = await readGlobalJsonStore<unknown>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    fallback: [],
  });
  return Array.isArray(parsed) ? (parsed as Geofence[]) : [];
}

async function writeStoredGeofences(items: Geofence[]): Promise<void> {
  await writeGlobalJsonStore<Geofence[]>({
    localRelativePath: LOCAL_RELATIVE_PATH,
    remoteRelativePath: REMOTE_RELATIVE_PATH,
    value: items,
  });
}

async function getAllGeofences(): Promise<Geofence[]> {
  const stored = await readStoredGeofences();
  const merged = [...DEFAULT_GEOFENCES];

  stored.forEach((item) => {
    const existingIndex = merged.findIndex((entry) => entry.id === item.id);
    if (existingIndex >= 0) {
      merged[existingIndex] = item;
      return;
    }
    merged.push(item);
  });

  return merged.filter((item) => !item.deleted);
}

export async function GET(request: NextRequest) {
  try {
    const geofences = await getAllGeofences();
    return NextResponse.json({
      success: true,
      count: geofences.length,
      data: geofences,
    });
  } catch (error) {
    console.error('Error fetching geofences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch geofences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Geofence>;
    const hasCoordinates = typeof body.latitude === 'number' && typeof body.longitude === 'number';

    if (!body.id || !body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: 'id, name and type are required' },
        { status: 400 }
      );
    }

    const nextItem: Geofence = {
      id: body.id,
      name: body.name,
      type: body.type,
      latitude: hasCoordinates ? body.latitude! : 51.5074,
      longitude: hasCoordinates ? body.longitude! : -0.1278,
      radiusMeters: body.radiusMeters ?? 200,
      address: body.address || 'Project address to be confirmed',
      active: hasCoordinates ? (body.active ?? true) : false,
    };

    const stored = await readStoredGeofences();
    const next = stored.filter((item) => item.id !== nextItem.id);
    next.unshift(nextItem);
    await writeStoredGeofences(next);

    return NextResponse.json({ success: true, data: nextItem });
  } catch (error) {
    console.error('Error creating geofence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create geofence' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Geofence>;

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = (await getAllGeofences()).find((item) => item.id === body.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Geofence not found' },
        { status: 404 }
      );
    }

    const hasCoordinates = typeof body.latitude === 'number' && typeof body.longitude === 'number';

    const nextItem: Geofence = {
      ...existing,
      ...body,
      id: existing.id,
      name: body.name ?? existing.name,
      type: body.type ?? existing.type,
      latitude: hasCoordinates ? body.latitude! : existing.latitude,
      longitude: hasCoordinates ? body.longitude! : existing.longitude,
      radiusMeters: typeof body.radiusMeters === 'number' ? body.radiusMeters : existing.radiusMeters,
      address: body.address ?? existing.address,
      active: hasCoordinates
        ? (typeof body.active === 'boolean' ? body.active : existing.active)
        : false,
      deleted: false,
    };

    const stored = (await readStoredGeofences()).filter((item) => item.id !== nextItem.id);
    stored.unshift(nextItem);
    await writeStoredGeofences(stored);

    return NextResponse.json({ success: true, data: nextItem });
  } catch (error) {
    console.error('Error updating geofence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update geofence' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = [...DEFAULT_GEOFENCES, ...(await readStoredGeofences())].find((item) => item.id === id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Geofence not found' },
        { status: 404 }
      );
    }

    const tombstone: Geofence = {
      ...existing,
      deleted: true,
      active: false,
    };

    const stored = (await readStoredGeofences()).filter((item) => item.id !== id);
    stored.unshift(tombstone);
    await writeStoredGeofences(stored);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting geofence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete geofence' },
      { status: 500 }
    );
  }
}
