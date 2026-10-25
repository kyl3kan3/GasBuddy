import { isGoogleMapsConfigured } from '@/lib/env';

export const OPEN_STREET_MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors';

export const OPEN_STREET_MAP_TILE_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Leaflet tile layer settings. Uses OpenStreetMap by default; when
 * NEXT_PUBLIC_GOOGLE_MAPS_KEY is set, Google-backed tiles can be wired in here.
 */
export function getDefaultMapTileLayer() {
  return {
    url: OPEN_STREET_MAP_TILE_URL,
    attribution: OPEN_STREET_MAP_ATTRIBUTION,
    googleMapsEnabled: isGoogleMapsConfigured(),
  };
}
