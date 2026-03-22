/**
 * API Route: Fetch Geofences
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_GEOFENCES, type Geofence } from '@/lib/geofence';

const DATA_PATH = path.join(process.cwd(), 'data', 'geofences.json');

function readStoredGeofences(): Geofence[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Geofence[]) : [];
  } catch {
    return [];
  }
}

function writeStoredGeofences(items: Geofence[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

function getAllGeofences(): Geofence[] {
  const stored = readStoredGeofences();
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
    const geofences = getAllGeofences();
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

    const stored = readStoredGeofences();
    const next = stored.filter((item) => item.id !== nextItem.id);
    next.unshift(nextItem);
    writeStoredGeofences(next);

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

    const existing = getAllGeofences().find((item) => item.id === body.id);
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

    const stored = readStoredGeofences().filter((item) => item.id !== nextItem.id);
    stored.unshift(nextItem);
    writeStoredGeofences(stored);

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

    const existing = [...DEFAULT_GEOFENCES, ...readStoredGeofences()].find((item) => item.id === id);
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

    const stored = readStoredGeofences().filter((item) => item.id !== id);
    stored.unshift(tombstone);
    writeStoredGeofences(stored);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting geofence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete geofence' },
      { status: 500 }
    );
  }
}
