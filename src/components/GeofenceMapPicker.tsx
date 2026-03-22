'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type GeofenceMapPickerProps = {
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  onPick: (latitude: number, longitude: number) => void;
};

const DEFAULT_CENTER: [number, number] = [54.5, -2.5];
const DEFAULT_ZOOM = 6;

export default function GeofenceMapPicker({
  latitude,
  longitude,
  radiusMeters,
  onPick,
}: GeofenceMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radiusRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const initialCenter: [number, number] =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? [latitude, longitude]
        : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom:
        typeof latitude === 'number' && typeof longitude === 'number'
          ? 15
          : DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => {
      onPick(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      radiusRef.current = null;
    };
  }, [latitude, longitude, onPick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (radiusRef.current) {
        map.removeLayer(radiusRef.current);
        radiusRef.current = null;
      }
      return;
    }

    const position: [number, number] = [latitude, longitude];

    if (!markerRef.current) {
      markerRef.current = L.marker(position).addTo(map);
    } else {
      markerRef.current.setLatLng(position);
    }

    if (!radiusRef.current) {
      radiusRef.current = L.circle(position, {
        radius: Math.max(radiusMeters, 1),
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    } else {
      radiusRef.current.setLatLng(position);
      radiusRef.current.setRadius(Math.max(radiusMeters, 1));
    }

    map.setView(position, Math.max(map.getZoom(), 15));
  }, [latitude, longitude, radiusMeters]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-64 w-full rounded-lg border border-gray-700"
      />
      <p className="text-xs text-gray-400">Click the map to drop the geofence pin.</p>
    </div>
  );
}