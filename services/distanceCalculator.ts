/**
 * Distance Calculator Service
 * Calculates distances between coordinates and provides district center coordinates
 * Now supports both direct distance (Haversine) and road distance (OpenStreetMap + OSRM)
 */

import { routingServiceOSM, Coordinates as RoutingCoordinates } from './routingServiceOSM';

// Sri Lankan District Centers Coordinates
export const DISTRICT_CENTERS: Record<string, { latitude: number; longitude: number; name: string }> = {
  // Western Province
  'Colombo': { latitude: 6.9271, longitude: 79.8612, name: 'Colombo City' },
  'Gampaha': { latitude: 7.0873, longitude: 79.9990, name: 'Gampaha Town' },
  'Kalutara': { latitude: 6.5854, longitude: 79.9607, name: 'Kalutara Town' },
  
  // Central Province
  'Kandy': { latitude: 7.2906, longitude: 80.6337, name: 'Kandy City' },
  'Matale': { latitude: 7.4675, longitude: 80.6234, name: 'Matale Town' },
  'Nuwara Eliya': { latitude: 6.9497, longitude: 80.7891, name: 'Nuwara Eliya Town' },
  
  // Southern Province
  'Galle': { latitude: 6.0535, longitude: 80.2210, name: 'Galle City' },
  'Matara': { latitude: 5.9549, longitude: 80.5550, name: 'Matara Town' },
  'Hambantota': { latitude: 6.1241, longitude: 81.1185, name: 'Hambantota Town' },
  
  // Northern Province
  'Jaffna': { latitude: 9.6615, longitude: 80.0255, name: 'Jaffna City' },
  'Kilinochchi': { latitude: 9.3964, longitude: 80.4037, name: 'Kilinochchi Town' },
  'Mannar': { latitude: 8.9810, longitude: 79.9047, name: 'Mannar Town' },
  'Mullaitivu': { latitude: 9.2674, longitude: 80.8142, name: 'Mullaitivu Town' },
  'Vavuniya': { latitude: 8.7514, longitude: 80.4971, name: 'Vavuniya Town' },
  
  // Eastern Province
  'Trincomalee': { latitude: 8.5874, longitude: 81.2152, name: 'Trincomalee City' },
  'Batticaloa': { latitude: 7.7102, longitude: 81.6924, name: 'Batticaloa Town' },
  'Ampara': { latitude: 7.2976, longitude: 81.6747, name: 'Ampara Town' },
  
  // North Western Province
  'Kurunegala': { latitude: 7.4818, longitude: 80.3609, name: 'Kurunegala Town' },
  'Puttalam': { latitude: 8.0362, longitude: 79.8283, name: 'Puttalam Town' },
  
  // North Central Province
  'Anuradhapura': { latitude: 8.3114, longitude: 80.4037, name: 'Anuradhapura City' },
  'Polonnaruwa': { latitude: 7.9403, longitude: 81.0188, name: 'Polonnaruwa Town' },
  
  // Uva Province
  'Badulla': { latitude: 6.9934, longitude: 81.0550, name: 'Badulla Town' },
  'Monaragala': { latitude: 6.8728, longitude: 81.3507, name: 'Monaragala Town' },
  
  // Sabaragamuwa Province
  'Ratnapura': { latitude: 6.6828, longitude: 80.4126, name: 'Ratnapura Town' },
  'Kegalle': { latitude: 7.2513, longitude: 80.3464, name: 'Kegalle Town' },
};

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistrictCenter extends Coordinates {
  name: string;
}

export class DistanceCalculatorService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  static calculateDistance(
    coord1: Coordinates,
    coord2: Coordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    
    const lat1Rad = this.toRadians(coord1.latitude);
    const lat2Rad = this.toRadians(coord2.latitude);
    const deltaLatRad = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLonRad = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate road distance between two coordinates using Google Directions API
   * Prefers A-grade and B-grade roads in Sri Lanka
   * Returns distance in kilometers
   */
  static async calculateRoadDistance(
    coord1: Coordinates,
    coord2: Coordinates,
    preferMainRoads: boolean = true
  ): Promise<number | null> {
    try {
      if (!routingServiceOSM.isAvailable()) {
        console.warn('⚠️ Routing service not available, falling back to direct distance');
        return this.calculateDistance(coord1, coord2);
      }

      const roadDistance = await routingServiceOSM.getRoadDistance(
        { latitude: coord1.latitude, longitude: coord1.longitude },
        { latitude: coord2.latitude, longitude: coord2.longitude },
        { mode: preferMainRoads ? 'driving' : 'driving', fallbackToStraightLine: true }
      );

      if (roadDistance !== null) {
        return Math.round(roadDistance * 10) / 10; // Round to 1 decimal place
      }

      // Fallback to direct distance if routing fails
      console.warn('⚠️ Road distance calculation failed, falling back to direct distance');
      return this.calculateDistance(coord1, coord2);

    } catch (error) {
      console.error('❌ Error calculating road distance:', error);
      // Fallback to direct distance
      return this.calculateDistance(coord1, coord2);
    }
  }

  /**
   * Calculate distance from user location to heritage site with road routing
   * Returns both direct and road distances for comparison
   */
  static async calculateDistanceFromUserLocation(
    userLocation: Coordinates,
    siteCoordinates: Coordinates,
    useRoadDistance: boolean = true
  ): Promise<{
    directDistance: number;
    roadDistance: number | null;
    estimatedTime: number | null; // in minutes
    recommendedDistance: number;
  }> {
    const directDistance = this.calculateDistance(userLocation, siteCoordinates);
    let roadDistance: number | null = null;
    let estimatedTime: number | null = null;

    if (useRoadDistance) {
      try {
        const route = await routingServiceOSM.getRoute(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: siteCoordinates.latitude, longitude: siteCoordinates.longitude },
          { mode: 'driving', fallbackToStraightLine: true }
        );

        if (route) {
          roadDistance = Math.round(route.distance * 10) / 10;
          estimatedTime = Math.round(route.duration);
        }
      } catch (error) {
        console.error('❌ Error getting route information:', error);
      }
    }

    return {
      directDistance,
      roadDistance,
      estimatedTime,
      recommendedDistance: roadDistance || directDistance
    };
  }
  
  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Get district center coordinates by district name
   */
  static getDistrictCenter(districtName: string): DistrictCenter | null {
    const normalizedDistrict = districtName.trim();
    
    // Try exact match first
    if (DISTRICT_CENTERS[normalizedDistrict]) {
      return {
        ...DISTRICT_CENTERS[normalizedDistrict],
        name: DISTRICT_CENTERS[normalizedDistrict].name
      };
    }
    
    // Try case-insensitive match
    const foundKey = Object.keys(DISTRICT_CENTERS).find(
      key => key.toLowerCase() === normalizedDistrict.toLowerCase()
    );
    
    if (foundKey) {
      return {
        ...DISTRICT_CENTERS[foundKey],
        name: DISTRICT_CENTERS[foundKey].name
      };
    }
    
    return null;
  }
  
  /**
   * Calculate distance from district center to heritage site
   * Now supports both direct and road distance calculation
   */
  static async calculateDistanceFromDistrict(
    districtName: string,
    siteCoordinates: Coordinates,
    useRoadDistance: boolean = true
  ): Promise<{ distance: number; districtCenter: string; isRoadDistance: boolean } | null> {
    const districtCenter = this.getDistrictCenter(districtName);
    
    if (!districtCenter) {
      console.warn(`District center not found for: ${districtName}`);
      return null;
    }

    let distance: number;
    let isRoadDistance = false;

    if (useRoadDistance) {
      const roadDistance = await this.calculateRoadDistance(districtCenter, siteCoordinates);
      if (roadDistance !== null) {
        distance = roadDistance;
        isRoadDistance = true;
      } else {
        distance = this.calculateDistance(districtCenter, siteCoordinates);
        isRoadDistance = false;
      }
    } else {
      distance = this.calculateDistance(districtCenter, siteCoordinates);
      isRoadDistance = false;
    }
    
    return {
      distance,
      districtCenter: districtCenter.name,
      isRoadDistance
    };
  }
  
  /**
   * Format distance for display
   */
  static formatDistance(distance: number, districtCenterName: string): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m from ${districtCenterName}`;
    } else {
      return `${distance}km from ${districtCenterName}`;
    }
  }
  
  /**
   * Get all available districts
   */
  static getAvailableDistricts(): string[] {
    return Object.keys(DISTRICT_CENTERS).sort();
  }
  
  /**
   * Validate coordinates
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    // Check if coordinates are within Sri Lanka's approximate bounds
    const sriLankaBounds = {
      north: 9.9,
      south: 5.9,
      east: 82.0,
      west: 79.5
    };
    
    return (
      latitude >= sriLankaBounds.south &&
      latitude <= sriLankaBounds.north &&
      longitude >= sriLankaBounds.west &&
      longitude <= sriLankaBounds.east
    );
  }
  
  /**
   * Auto-calculate and format distance string
   * Now supports road distance calculation with fallback to direct distance
   */
  static async autoCalculateDistance(
    districtName: string,
    latitude: number,
    longitude: number,
    useRoadDistance: boolean = true
  ): Promise<string> {
    try {
      // Validate coordinates
      if (!this.validateCoordinates(latitude, longitude)) {
        console.warn('Coordinates appear to be outside Sri Lanka bounds');
      }
      
      const result = await this.calculateDistanceFromDistrict(
        districtName,
        { latitude, longitude },
        useRoadDistance
      );
      
      if (!result) {
        return `Distance from ${districtName}`;
      }
      
      const distanceText = this.formatDistance(result.distance, result.districtCenter);
      
      // Add indicator if it's road distance vs direct distance
      if (result.isRoadDistance) {
        return `${distanceText} via road`;
      } else {
        return distanceText;
      }
      
    } catch (error) {
      console.error('Error calculating distance:', error);
      return `Distance from ${districtName}`;
    }
  }

  /**
   * Legacy synchronous version for backward compatibility
   * Uses direct distance calculation only
   */
  static autoCalculateDistanceSync(
    districtName: string,
    latitude: number,
    longitude: number
  ): string {
    try {
      // Validate coordinates
      if (!this.validateCoordinates(latitude, longitude)) {
        console.warn('Coordinates appear to be outside Sri Lanka bounds');
      }
      
      const districtCenter = this.getDistrictCenter(districtName);
      
      if (!districtCenter) {
        return `Distance from ${districtName}`;
      }
      
      const distance = this.calculateDistance(districtCenter, { latitude, longitude });
      
      return this.formatDistance(distance, districtCenter.name);
      
    } catch (error) {
      console.error('Error calculating distance:', error);
      return `Distance from ${districtName}`;
    }
  }
}

// Export district centers for use in dropdowns/selectors
export const AVAILABLE_DISTRICTS = Object.keys(DISTRICT_CENTERS).sort();

// Export commonly used districts
export const MAJOR_DISTRICTS = [
  'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Trincomalee', 
  'Anuradhapura', 'Polonnaruwa', 'Nuwara Eliya', 'Badulla', 'Ratnapura'
];