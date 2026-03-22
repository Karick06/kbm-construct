/**
 * Geofence Management
 * Defines geofenced locations (project sites and offices)
 */

export interface Geofence {
  id: string;
  name: string;
  type: 'office' | 'project-site';
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
  active: boolean;
  deleted?: boolean;
}

type ProjectSiteAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
};

export const DEFAULT_GEOFENCES: Geofence[] = [
  {
    id: 'valescape-hq',
    name: 'Valescape HQ',
    type: 'office',
    latitude: 51.5074,
    longitude: -0.1278,
    radiusMeters: 100,
    address: 'London, UK',
    active: true,
  },
  {
    id: 'london-project',
    name: 'London Construction Site',
    type: 'project-site',
    latitude: 51.5195,
    longitude: -0.0922,
    radiusMeters: 200,
    address: 'East London',
    active: true,
  },
  {
    id: 'manchester-project',
    name: 'Manchester Construction Site',
    type: 'project-site',
    latitude: 53.4808,
    longitude: -2.2426,
    radiusMeters: 200,
    address: 'Manchester',
    active: true,
  },
  {
    id: 'birmingham-warehouse',
    name: 'Birmingham Warehouse',
    type: 'office',
    latitude: 52.5086,
    longitude: -1.8853,
    radiusMeters: 150,
    address: 'Birmingham',
    active: true,
  },
];

/**
 * Calculate distance between two coordinates in meters
 * Using Haversine formula
 */
export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius of Earth in m
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * Check if a location is within a geofence
 */
export function isWithinGeofence(
  latitude: number,
  longitude: number,
  geofence: Geofence
): boolean {
  const distance = getDistanceFromLatLonInMeters(
    latitude,
    longitude,
    geofence.latitude,
    geofence.longitude
  );
  return distance <= geofence.radiusMeters;
}

/**
 * Find which geofence(s) a location is in
 */
export function getGeofencesAtLocation(
  latitude: number,
  longitude: number,
  geofences: Geofence[] = DEFAULT_GEOFENCES
): Geofence[] {
  return geofences.filter((geofence) =>
    isWithinGeofence(latitude, longitude, geofence)
  );
}

export function buildProjectGeofence(project: {
  id: string;
  projectName: string;
  siteAddress?: ProjectSiteAddress;
}): Geofence {
  const lat = project.siteAddress?.lat ?? 51.5074;
  const lng = project.siteAddress?.lng ?? -0.1278;
  const hasCoordinates = typeof project.siteAddress?.lat === "number" && typeof project.siteAddress?.lng === "number";
  const address = [
    project.siteAddress?.line1,
    project.siteAddress?.line2,
    project.siteAddress?.city,
    project.siteAddress?.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: `project-${project.id}`,
    name: project.projectName,
    type: "project-site",
    latitude: lat,
    longitude: lng,
    radiusMeters: 200,
    address: address || "Project address to be confirmed",
    active: hasCoordinates,
  };
}

export async function createProjectGeofence(project: {
  id: string;
  projectName: string;
  siteAddress?: ProjectSiteAddress;
}): Promise<void> {
  const geofence = buildProjectGeofence(project);

  const response = await fetch("/api/geofences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geofence),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.error || "Failed to create project geofence");
  }
}
