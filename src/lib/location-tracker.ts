/**
 * Location Tracking Utility
 * Handles GPS position watching and geofence detection
 */

import { isWithinGeofence, type Geofence } from './geofence';

export type LocationCallback = (
  latitude: number,
  longitude: number,
  geofenceName?: string
) => void;

class LocationTracker {
  private watchId: number | null = null;
  private lastPosition: { latitude: number; longitude: number } | null = null;
  private geofences: Geofence[];
  private callbacks: LocationCallback[] = [];

  constructor(geofences: Geofence[] = []) {
    this.geofences = geofences;
  }

  /**
   * Start watching for location changes
   */
  startTracking(
    onLocationChange: LocationCallback,
    options?: PositionOptions
  ): void {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    this.callbacks.push(onLocationChange);

    // Set default options
    const watchOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000, // 5 second cache
      timeout: 10000, // 10 second timeout
      ...options,
    };

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position, onLocationChange),
      (error) => this.handlePositionError(error),
      watchOptions
    );

    console.log('Location tracking started');
  }

  /**
   * Stop watching for location changes
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('Location tracking stopped');
    }
  }

  private handlePositionUpdate(
    position: GeolocationPosition,
    callback: LocationCallback
  ): void {
    const { latitude, longitude } = position.coords;

    // Check if position has changed significantly (avoid too many updates)
    if (this.lastPosition) {
      const distance = Math.sqrt(
        Math.pow(latitude - this.lastPosition.latitude, 2) +
          Math.pow(longitude - this.lastPosition.longitude, 2)
      );
      if (distance < 0.0001) return; // Less than ~10m
    }

    this.lastPosition = { latitude, longitude };

    // Check which geofences we're in
    const activeGeofences = this.geofences.filter((geofence) =>
      isWithinGeofence(latitude, longitude, geofence)
    );

    const geofenceName =
      activeGeofences.length > 0 ? activeGeofences[0].name : undefined;

    callback(latitude, longitude, geofenceName);
  }

  private handlePositionError(error: GeolocationPositionError): void {
    console.error('Geolocation error:', {
      code: error.code,
      message: error.message,
    });

    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('User denied permission to access location');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Location information is unavailable');
        break;
      case error.TIMEOUT:
        console.error('Location request timed out');
        break;
    }
  }

  /**
   * Request a single location update
   */
  getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    });
  }

  /**
   * Check if currently in a specific geofence
   */
  isInGeofence(geofence: Geofence): boolean {
    if (!this.lastPosition) return false;
    return isWithinGeofence(
      this.lastPosition.latitude,
      this.lastPosition.longitude,
      geofence
    );
  }

  /**
   * Get last known position
   */
  getLastPosition(): { latitude: number; longitude: number } | null {
    return this.lastPosition;
  }

  /**
   * Update geofences list
   */
  setGeofences(geofences: Geofence[]): void {
    this.geofences = geofences;
  }
}

export const locationTracker = new LocationTracker();
