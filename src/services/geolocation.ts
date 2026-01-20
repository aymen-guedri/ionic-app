import { Geolocation, Position } from '@capacitor/geolocation';
import { Coordinates } from '../types';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface NavigationRoute {
  distance: number; // in meters
  duration: number; // in seconds
  steps: NavigationStep[];
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: Coordinates[];
}

export class GeolocationService {
  private static watchId: string | null = null;
  private static currentLocation: LocationData | null = null;

  /**
   * Get current position
   */
  static async getCurrentPosition(): Promise<LocationData> {
    try {
      // Check permissions
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: position.timestamp
      };

      this.currentLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Error getting current position:', error);
      throw new Error('Failed to get current location');
    }
  }

  /**
   * Start watching position changes
   */
  static async startWatchingPosition(
    callback: (location: LocationData) => void,
    errorCallback?: (error: any) => void
  ): Promise<void> {
    try {
      // Check permissions
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      // Start watching position
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000
        },
        (position: Position | null, err?: any) => {
          if (err) {
            console.error('Position watch error:', err);
            if (errorCallback) errorCallback(err);
            return;
          }

          if (position) {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined,
              timestamp: position.timestamp
            };

            this.currentLocation = locationData;
            callback(locationData);
          }
        }
      );
    } catch (error) {
      console.error('Error starting position watch:', error);
      throw error;
    }
  }

  /**
   * Stop watching position changes
   */
  static async stopWatchingPosition(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    coord1: Coordinates,
    coord2: Coordinates
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Find nearest parking spots
   */
  static findNearestSpots(
    userLocation: Coordinates,
    parkingSpots: Array<{ id: string; coordinates: Coordinates; [key: string]: any }>,
    maxDistance: number = 1000 // meters
  ): Array<{ spot: any; distance: number }> {
    return parkingSpots
      .map(spot => ({
        spot,
        distance: this.calculateDistance(userLocation, spot.coordinates)
      }))
      .filter(item => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get directions to parking spot
   */
  static async getDirections(
    from: Coordinates,
    to: Coordinates
  ): Promise<NavigationRoute> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use Google Maps Directions API or similar
      const distance = this.calculateDistance(from, to);
      const estimatedDuration = Math.ceil(distance / 1.4); // Assuming 1.4 m/s walking speed

      return {
        distance,
        duration: estimatedDuration,
        steps: [
          {
            instruction: `Walk ${Math.round(distance)}m to your parking spot`,
            distance,
            duration: estimatedDuration,
            coordinates: [from, to]
          }
        ]
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      throw new Error('Failed to get directions');
    }
  }

  /**
   * Open navigation app with directions
   */
  static openNavigationApp(destination: Coordinates, label?: string): void {
    const { latitude, longitude } = destination;
    const labelParam = label ? `&q=${encodeURIComponent(label)}` : '';
    
    // Try to open Google Maps app, fallback to web
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${labelParam}`;
    
    // For mobile apps, you might want to use the native app URLs
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      // Try Apple Maps first, fallback to Google Maps
      const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}`;
      window.open(appleMapsUrl, '_system');
    } else if (isAndroid) {
      // Try Google Maps app
      const androidMapsUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label || 'Parking Spot'})`;
      window.open(androidMapsUrl, '_system');
    } else {
      // Web fallback
      window.open(googleMapsUrl, '_blank');
    }
  }

  /**
   * Check if user is within geofence of parking spot
   */
  static isWithinGeofence(
    userLocation: Coordinates,
    spotLocation: Coordinates,
    radius: number = 50 // meters
  ): boolean {
    const distance = this.calculateDistance(userLocation, spotLocation);
    return distance <= radius;
  }

  /**
   * Get current location (cached)
   */
  static getCurrentLocationCached(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * Format distance for display
   */
  static formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}min`;
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  static async getAddressFromCoordinates(coordinates: Coordinates): Promise<string> {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${coordinates.latitude}+${coordinates.longitude}&key=${process.env.REACT_APP_OPENCAGE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    }
  }

  /**
   * Get coordinates from address (geocoding)
   */
  static async getCoordinatesFromAddress(address: string): Promise<Coordinates> {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${process.env.REACT_APP_OPENCAGE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.lat,
          longitude: result.geometry.lng
        };
      }
      
      throw new Error('Address not found');
    } catch (error) {
      console.error('Error getting coordinates:', error);
      throw error;
    }
  }

  /**
   * Check location permissions
   */
  static async checkLocationPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Request location permissions
   */
  static async requestLocationPermissions(): Promise<boolean> {
    try {
      const result = await Geolocation.requestPermissions();
      return result.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Calculate estimated arrival time
   */
  static calculateETA(
    distance: number,
    transportMode: 'walking' | 'driving' | 'cycling' = 'walking'
  ): Date {
    const speeds = {
      walking: 1.4, // m/s
      cycling: 4.2, // m/s
      driving: 8.3  // m/s (city driving)
    };
    
    const speed = speeds[transportMode];
    const durationSeconds = distance / speed;
    
    return new Date(Date.now() + durationSeconds * 1000);
  }

  /**
   * Track user movement for analytics
   */
  static async startMovementTracking(
    callback: (movement: { distance: number; speed: number; location: LocationData }) => void
  ): Promise<void> {
    let lastLocation: LocationData | null = null;
    let totalDistance = 0;
    
    await this.startWatchingPosition((location) => {
      if (lastLocation) {
        const distance = this.calculateDistance(
          { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
          { latitude: location.latitude, longitude: location.longitude }
        );
        
        totalDistance += distance;
        const timeDiff = (location.timestamp - lastLocation.timestamp) / 1000; // seconds
        const speed = distance / timeDiff; // m/s
        
        callback({
          distance: totalDistance,
          speed,
          location
        });
      }
      
      lastLocation = location;
    });
  }
}