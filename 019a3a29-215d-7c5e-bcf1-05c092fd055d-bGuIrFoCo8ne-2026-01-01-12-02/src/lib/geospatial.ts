/**
 * Geospatial Utilities
 *
 * Common functions for GPS calculations, distance measurement,
 * and location-based operations.
 */

/**
 * Converts degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 *
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calculate estimated time of arrival based on distance and speed
 *
 * @param distanceKm - Distance in kilometers
 * @param averageSpeedKmh - Average speed in km/h (default: 40 km/h for city driving)
 * @returns Object with minutes and estimated timestamp
 */
export function calculateETA(
  distanceKm: number,
  averageSpeedKmh: number = 40
): {
  minutes: number;
  timestamp: Date;
} {
  const estimatedTimeHours = distanceKm / averageSpeedKmh;
  const estimatedTimeMinutes = Math.ceil(estimatedTimeHours * 60);
  const timestamp = new Date(Date.now() + estimatedTimeMinutes * 60 * 1000);

  return {
    minutes: estimatedTimeMinutes,
    timestamp,
  };
}

/**
 * Geofence thresholds (in kilometers)
 */
export const GEOFENCE = {
  NEARBY_THRESHOLD: 0.1, // 100 meters
  ARRIVAL_THRESHOLD: 0.05, // 50 meters
} as const;

/**
 * Check if location is within geofence
 *
 * @param distance - Distance in kilometers
 * @param threshold - Threshold distance (default: arrival threshold)
 * @returns Boolean indicating if within geofence
 */
export function isWithinGeofence(
  distance: number,
  threshold: number = GEOFENCE.ARRIVAL_THRESHOLD
): boolean {
  return distance <= threshold;
}

/**
 * Check proximity status to a location
 *
 * @param distance - Distance in kilometers
 * @returns Proximity status: 'arrived', 'nearby', or 'far'
 */
export function getProximityStatus(
  distance: number
): 'arrived' | 'nearby' | 'far' {
  if (distance <= GEOFENCE.ARRIVAL_THRESHOLD) {
    return 'arrived';
  } else if (distance <= GEOFENCE.NEARBY_THRESHOLD) {
    return 'nearby';
  }
  return 'far';
}

/**
 * Calculate total distance for a route (array of coordinates)
 *
 * @param coordinates - Array of {latitude, longitude} objects
 * @returns Total distance in kilometers
 */
export function calculateRouteDistance(
  coordinates: Array<{ latitude: number; longitude: number }>
): number {
  if (coordinates.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const dist = calculateDistance(
      coordinates[i - 1].latitude,
      coordinates[i - 1].longitude,
      coordinates[i].latitude,
      coordinates[i].longitude
    );
    totalDistance += dist;
  }

  return totalDistance;
}

/**
 * Format distance for display
 *
 * @param distanceKm - Distance in kilometers
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted distance string with unit
 */
export function formatDistance(distanceKm: number, decimals: number = 2): string {
  if (distanceKm < 1) {
    // Show in meters if less than 1 km
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(decimals)}km`;
}

/**
 * Format ETA for display
 *
 * @param minutes - Time in minutes
 * @returns Formatted time string
 */
export function formatETA(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 min';
  } else if (minutes === 1) {
    return '1 min';
  } else if (minutes < 60) {
    return `${minutes} mins`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
