import { NextRequest, NextResponse } from "next/server";
import { findNearestAandeHospital } from "@/lib/aande-hospitals";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:postcode"],
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return tags["addr:full"] || tags["name"] || "Address not available";
}

function toCandidate(element: OverpassElement, refLat: number, refLon: number) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!lat || !lon) return null;

  const tags = element.tags ?? {};
  const emergencyTag = (tags.emergency || "").toLowerCase();
  const hasEmergencySignal =
    emergencyTag.includes("yes") || emergencyTag.includes("designated") || emergencyTag.includes("department");

  const name = tags.name || "Hospital";
  const distanceKm = haversineDistanceKm(refLat, refLon, lat, lon);

  return {
    name,
    address: formatAddress(tags),
    postcode: tags["addr:postcode"] || "",
    phone: tags.phone || tags["contact:phone"] || "NHS 111",
    distanceKm,
    emergencyScore: hasEmergencySignal ? 0 : 1,
    lat,
    lon,
  };
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lon: number } | null> {
  const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status: number;
    result?: { latitude: number; longitude: number };
  };

  if (payload.status !== 200 || !payload.result) return null;

  return {
    lat: payload.result.latitude,
    lon: payload.result.longitude,
  };
}

async function queryOverpass(lat: number, lon: number, radiusMeters: number): Promise<OverpassElement[]> {
  const query = `
[out:json][timeout:10];
(
  node(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
  way(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
  relation(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
);
out center tags;
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: query,
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];
    const payload = (await response.json()) as { elements?: OverpassElement[] };
    return payload.elements ?? [];
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Overpass query timeout for radius", radiusMeters);
    }
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const postcode = request.nextUrl.searchParams.get("postcode")?.trim();
    if (!postcode) {
      return NextResponse.json({ success: false, error: "postcode is required" }, { status: 400 });
    }

    const normalizedPostcode = titleCase(postcode.toUpperCase());
    const coords = await geocodePostcode(normalizedPostcode);
    if (!coords) {
      return NextResponse.json({ success: false, error: "postcode lookup failed" }, { status: 404 });
    }

    // Query Overpass for live hospital data
    const narrowResults = await queryOverpass(coords.lat, coords.lon, 25000);
    const broadResults = narrowResults.length > 0 ? narrowResults : await queryOverpass(coords.lat, coords.lon, 50000);

    const candidates = broadResults
      .map((element) => toCandidate(element, coords.lat, coords.lon))
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
      .sort((a, b) => {
        if (a.emergencyScore !== b.emergencyScore) return a.emergencyScore - b.emergencyScore;
        return a.distanceKm - b.distanceKm;
      });

    // Also check our local fallback list for comparison
    const localFallback = findNearestAandeHospital(coords.lat, coords.lon);

    // If we have an Overpass result, compare with local fallback
    if (candidates.length > 0 && localFallback) {
      const best = candidates[0];
      // If local fallback is significantly closer (< 70% of Overpass distance), prefer local
      if (localFallback.distanceKm < best.distanceKm * 0.7) {
        return NextResponse.json({
          success: true,
          source: "fallback",
          data: {
            name: localFallback.hospital.name,
            address: `${localFallback.hospital.address}, ${localFallback.hospital.postcode}`,
            phone: localFallback.hospital.phone,
            distanceKm: localFallback.distanceKm,
            lat: localFallback.hospital.lat,
            lon: localFallback.hospital.lng,
          },
        });
      }
      // Otherwise return Overpass result
      return NextResponse.json({
        success: true,
        source: "overpass",
        data: {
          name: best.name,
          address: best.address,
          phone: best.phone,
          distanceKm: Number(best.distanceKm.toFixed(1)),
          lat: best.lat,
          lon: best.lon,
        },
      });
    }

    // Fall back to local list if no Overpass results
    if (localFallback) {
      return NextResponse.json({
        success: true,
        source: "fallback",
        data: {
          name: localFallback.hospital.name,
          address: `${localFallback.hospital.address}, ${localFallback.hospital.postcode}`,
          phone: localFallback.hospital.phone,
          distanceKm: localFallback.distanceKm,
          lat: localFallback.hospital.lat,
          lon: localFallback.hospital.lng,
        },
      });
    }

    return NextResponse.json({ success: false, error: "No hospital found" }, { status: 404 });
  } catch (error) {
    console.error("A&E lookup error:", error);
    return NextResponse.json({ success: false, error: "A&E lookup failed" }, { status: 500 });
  }
}
