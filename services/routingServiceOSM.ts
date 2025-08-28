/**
 * OSM Routing Service
 * Provides routing using OSRM (Open Source Routing Machine) with OpenStreetMap data
 * Free alternative to Google Directions API with no API keys required
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  coordinates: Coordinates[];
  summary?: string;
  isFallback?: boolean; // true if using straight line fallback
}

export interface RoutingOptions {
  mode?: 'driving' | 'walking' | 'cycling';
  fallbackToStraightLine?: boolean;
}

class RoutingServiceOSM {
  private readonly OSRM_API_URL = 'https://router.project-osrm.org/route/v1';
  
  /**
   * Get route information between two points using OSRM API
   * Falls back to straight line route if OSRM fails
   */
  async getRoute(
    origin: Coordinates,
    destination: Coordinates,
    options: RoutingOptions = {}
  ): Promise<RouteResult | null> {
    const {
      mode = 'driving',
      fallbackToStraightLine = true
    } = options;

    try {
      console.log('🗺️ OSM: Requesting route from OSRM API...');
      console.log('📍 OSM: From:', `${origin.latitude},${origin.longitude}`);
      console.log('🎯 OSM: To:', `${destination.latitude},${destination.longitude}`);

      // Try OSRM routing first
      const osrmResult = await this.getOSRMRoute(origin, destination, mode);
      
      if (osrmResult) {
        console.log('✅ OSM: Route obtained from OSRM with', osrmResult.coordinates.length, 'points');
        return osrmResult;
      }

      console.warn('⚠️ OSM: OSRM routing failed, checking fallback option...');

      // Fallback to straight line if enabled
      if (fallbackToStraightLine) {
        console.log('📏 OSM: Using straight line fallback');
        return this.getStraightLineRoute(origin, destination);
      }

      console.error('❌ OSM: No fallback enabled, returning null');
      return null;

    } catch (error) {
      console.error('❌ OSM: Error getting route:', error);
      
      // Fallback to straight line on error
      if (fallbackToStraightLine) {
        console.log('📏 OSM: Using straight line fallback due to error');
        return this.getStraightLineRoute(origin, destination);
      }
      
      return null;
    }
  }

  /**
   * Get route from OSRM API
   */
  private async getOSRMRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: string
  ): Promise<RouteResult | null> {
    try {
      // OSRM uses lon,lat format (opposite of typical lat,lon)
      const originStr = `${origin.longitude},${origin.latitude}`;
      const destinationStr = `${destination.longitude},${destination.latitude}`;
      
      // Map mode to OSRM profile
      const profile = this.mapModeToProfile(mode);
      
      const apiUrl = `${this.OSRM_API_URL}/${profile}/${originStr};${destinationStr}?overview=full&geometries=geojson`;
      
      console.log('🌐 OSM: OSRM API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SriHeritageApp/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OSM: OSRM API HTTP error:', response.status, response.statusText);
        console.error('❌ OSM: Error details:', errorText);
        return null;
      }
      
      const data = await response.json();
      
      if (data.code !== 'Ok') {
        console.error('❌ OSM: OSRM API error code:', data.code);
        if (data.message) {
          console.error('❌ OSM: Error message:', data.message);
        }
        return null;
      }
      
      if (!data.routes || data.routes.length === 0) {
        console.error('❌ OSM: No routes found in OSRM response');
        return null;
      }

      const route = data.routes[0];
      console.log('✅ OSM: OSRM response received');
      console.log('📊 OSM: Distance:', route.distance, 'meters');
      console.log('⏱️ OSM: Duration:', route.duration, 'seconds');

      return this.processOSRMRoute(route);
      
    } catch (error) {
      console.error('❌ OSM: Error fetching from OSRM:', error);
      return null;
    }
  }

  /**
   * Process OSRM route response
   */
  private processOSRMRoute(route: any): RouteResult {
    const distanceKm = route.distance / 1000; // Convert meters to kilometers
    const durationMin = route.duration / 60; // Convert seconds to minutes
    
    let coordinates: Coordinates[] = [];

    // Extract coordinates from GeoJSON geometry
    if (route.geometry && route.geometry.coordinates) {
      coordinates = route.geometry.coordinates.map((coord: number[]) => ({
        latitude: coord[1],  // GeoJSON uses [lon, lat] format
        longitude: coord[0]
      }));
      
      console.log('🧵 OSM: Extracted', coordinates.length, 'coordinates from GeoJSON');
    }

    // If no geometry coordinates, create simple route from legs
    if (coordinates.length === 0 && route.legs && route.legs.length > 0) {
      console.log('📍 OSM: Extracting coordinates from legs');
      
      route.legs.forEach((leg: any, legIndex: number) => {
        if (leg.steps && leg.steps.length > 0) {
          leg.steps.forEach((step: any) => {
            if (step.geometry && step.geometry.coordinates) {
              const stepCoords = step.geometry.coordinates.map((coord: number[]) => ({
                latitude: coord[1],
                longitude: coord[0]
              }));
              coordinates.push(...stepCoords);
            }
          });
        }
      });
      
      console.log('📍 OSM: Extracted', coordinates.length, 'coordinates from legs');
    }

    console.log('🗺️ OSM: Final route processing complete');
    if (coordinates.length > 0) {
      console.log('📍 OSM: Route start:', coordinates[0]);
      console.log('🎯 OSM: Route end:', coordinates[coordinates.length - 1]);
    }

    return {
      distance: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
      duration: Math.round(durationMin), // Round to nearest minute
      coordinates,
      summary: route.legs?.[0]?.summary || `${distanceKm.toFixed(1)}km route`,
      isFallback: false
    };
  }

  /**
   * Get straight line route as fallback
   */
  private getStraightLineRoute(
    origin: Coordinates,
    destination: Coordinates
  ): RouteResult {
    console.log('📏 OSM: Generating straight line route');
    
    // Calculate direct distance using Haversine formula
    const distance = this.calculateHaversineDistance(origin, destination);
    
    // Estimate travel time (assuming average speed of 50 km/h)
    const estimatedDuration = (distance / 50) * 60; // Convert to minutes
    
    // Generate intermediate points for smoother line
    const steps = Math.max(5, Math.min(20, Math.floor(distance * 2))); // 5-20 steps based on distance
    const coordinates: Coordinates[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      coordinates.push({
        latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio,
      });
    }
    
    console.log('📏 OSM: Generated straight line with', coordinates.length, 'points');
    console.log('📊 OSM: Distance:', distance, 'km');
    console.log('⏱️ OSM: Estimated time:', estimatedDuration, 'minutes');

    return {
      distance: Math.round(distance * 10) / 10,
      duration: Math.round(estimatedDuration),
      coordinates,
      summary: `${distance.toFixed(1)}km direct route`,
      isFallback: true
    };
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateHaversineDistance(
    point1: Coordinates,
    point2: Coordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Map user-friendly mode to OSRM profile
   */
  private mapModeToProfile(mode: string): string {
    switch (mode.toLowerCase()) {
      case 'walking':
        return 'foot';
      case 'cycling':
        return 'cycling';
      case 'driving':
      default:
        return 'driving';
    }
  }

  /**
   * Get route distance only (convenience method)
   */
  async getRoadDistance(
    origin: Coordinates,
    destination: Coordinates,
    options: RoutingOptions = {}
  ): Promise<number | null> {
    const route = await this.getRoute(origin, destination, options);
    return route ? route.distance : null;
  }

  /**
   * Get estimated travel time only (convenience method)
   */
  async getTravelTime(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<number | null> {
    const route = await this.getRoute(origin, destination, { mode });
    return route ? route.duration : null;
  }

  /**
   * Check if the routing service is available
   * (Always true for OSM since it doesn't require API keys)
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Test connectivity to OSRM service
   */
  async testConnectivity(): Promise<boolean> {
    try {
      // Test with a simple route in Colombo area
      const testOrigin = { latitude: 6.9271, longitude: 79.8612 };
      const testDestination = { latitude: 6.9319, longitude: 79.8478 };
      
      const route = await this.getRoute(testOrigin, testDestination, { fallbackToStraightLine: false });
      return route !== null && !route.isFallback;
    } catch (error) {
      console.error('❌ OSM: Connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Get multiple route alternatives (OSRM doesn't provide alternatives like Google)
   * This returns the main route and a fallback straight line
   */
  async getRouteAlternatives(
    origin: Coordinates,
    destination: Coordinates,
    options: RoutingOptions = {}
  ): Promise<RouteResult[]> {
    const routes: RouteResult[] = [];
    
    try {
      // Get main OSRM route
      const mainRoute = await this.getRoute(origin, destination, { ...options, fallbackToStraightLine: false });
      if (mainRoute) {
        routes.push(mainRoute);
      }
      
      // Always provide straight line as alternative
      const straightLineRoute = this.getStraightLineRoute(origin, destination);
      routes.push(straightLineRoute);
      
      return routes;
    } catch (error) {
      console.error('❌ OSM: Error getting route alternatives:', error);
      
      // Return at least straight line route
      return [this.getStraightLineRoute(origin, destination)];
    }
  }
}

// Create and export the service instance  
export const routingServiceOSM = new RoutingServiceOSM();

// Export the service as default for easier importing
export default routingServiceOSM;
