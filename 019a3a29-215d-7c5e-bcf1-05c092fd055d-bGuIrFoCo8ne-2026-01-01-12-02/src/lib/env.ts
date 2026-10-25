/**
 * Centralized environment configuration. Never hardcode API keys in source or docs.
 */

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

/** Browser-exposed Google Maps API key (Maps JavaScript / Places / Geocoding). */
export function getGoogleMapsApiKey(): string | undefined {
  const key = readEnv('NEXT_PUBLIC_GOOGLE_MAPS_KEY');
  if (!key) {
    return undefined;
  }
  const lower = key.toLowerCase();
  if (
    lower.includes('your_google_maps') ||
    lower.includes('replace_me') ||
    lower.includes('changeme')
  ) {
    return undefined;
  }
  return key;
}

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey() !== undefined;
}
