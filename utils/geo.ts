/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param a First point with lat and lng coordinates
 * @param b Second point with lat and lng coordinates
 * @returns Distance in kilometers
 */
export function kmBetween(a: {lat: number; lng: number}, b: {lat: number; lng: number}): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aHarv = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
  return R * c;
}

/**
 * Convert Site coordinates to the format expected by kmBetween
 * @param site Site object with latitude/longitude coordinates
 * @returns Coordinates object or null if invalid
 */
export function siteToCoords(site: {latitude?: number; longitude?: number; coordinates?: {latitude: number; longitude: number}}): {lat: number; lng: number} | null {
  // Try direct latitude/longitude fields first
  if (site.latitude != null && site.longitude != null) {
    return { lat: site.latitude, lng: site.longitude };
  }
  
  // Try coordinates object
  if (site.coordinates?.latitude != null && site.coordinates?.longitude != null) {
    return { lat: site.coordinates.latitude, lng: site.coordinates.longitude };
  }
  
  return null;
}
