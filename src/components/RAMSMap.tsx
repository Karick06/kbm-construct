"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ICON_URL_BASE = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4";

export interface RAMSMapProps {
  sitePostcode: string;
  siteLat?: number;
  siteLon?: number;
  hospitalName?: string;
  hospitalLat?: number;
  hospitalLon?: number;
  hospitalDistanceKm?: number;
  height?: string;
}

export default function RAMSMap({
  sitePostcode,
  siteLat,
  siteLon,
  hospitalName,
  hospitalLat,
  hospitalLon,
  hospitalDistanceKm,
  height = "400px",
}: RAMSMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [53.5, -2],
        zoom: 9,
      });

      L.tileLayer(`${ICON_URL_BASE}/images/tiles/{z}/{x}/{y}.png`, {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    map.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Add markers and fit bounds
    const bounds = L.latLngBounds([]);

    if (siteLat && siteLon) {
      const siteMarker = L.marker([siteLat, siteLon], {
        icon: L.icon({
          iconUrl: `${ICON_URL_BASE}/images/marker-icon.png`,
          shadowUrl: `${ICON_URL_BASE}/images/marker-shadow.png`,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
        title: "Site Location",
      })
        .bindPopup(`<strong>Site</strong><br/>${sitePostcode}`)
        .addTo(map);
      bounds.extend([siteLat, siteLon]);
    }

    if (hospitalLat && hospitalLon) {
      const hospitalMarker = L.marker([hospitalLat, hospitalLon], {
        icon: L.icon({
          iconUrl: `${ICON_URL_BASE}/images/marker-icon-red.png`,
          shadowUrl: `${ICON_URL_BASE}/images/marker-shadow.png`,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
        title: "Nearest A&E",
      })
        .bindPopup(
          `<strong>${hospitalName || "Nearest A&E"}</strong><br/>${hospitalDistanceKm ?? 0} km from site`,
        )
        .addTo(map);
      bounds.extend([hospitalLat, hospitalLon]);

      // Draw line between site and hospital
      if (siteLat && siteLon) {
        L.polyline([[siteLat, siteLon], [hospitalLat, hospitalLon]], {
          color: "#ef4444",
          weight: 2,
          opacity: 0.7,
          dashArray: "5, 5",
        }).addTo(map);
      }
    }

    // Fit map to markers
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [sitePostcode, siteLat, siteLon, hospitalName, hospitalLat, hospitalLon, hospitalDistanceKm]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%" }}
      className="rounded border border-gray-700 bg-gray-900"
    />
  );
}
