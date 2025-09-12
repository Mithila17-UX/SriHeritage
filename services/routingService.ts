/**
 * Routing Service
 * Provides road-based distance and route calculations using Google Directions API
 * Specifically optimized for Sri Lankan A-grade and B-grade roads
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  coordinates: Coordinates[];
  overview_polyline?: string;
  summary?: string;
  via_waypoints?: Coordinates[];
}

export interface RoutingOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  preferMainRoads?: boolean; // Prefer A-grade and B-grade roads
  mode?: 'driving' | 'walking' | 'transit';
}

class RoutingService {
  private readonly GOOGLE_MAPS_API_KEY = 'AIzaSyAdXUZNOdmC4JGerYedKse4--i4Xw-mKlU';
  private readonly DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';
  
  /**
   * Get route information between two points using Google Directions API
   * Optimized for Sri Lankan road network with preference for main roads
   */
  async getRoute(
    origin: Coordinates,
    destination: Coordinates,
    options: RoutingOptions = {}
  ): Promise<RouteResult | null> {
    try {
      const {
        avoidTolls = false,
        avoidHighways = false,
        preferMainRoads = true,
        mode = 'driving'
      } = options;

      // Build URL parameters for Directions API
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: mode,
        key: this.GOOGLE_MAPS_API_KEY,
        region: 'LK', // Sri Lanka
        language: 'en',
        alternatives: 'true',
        avoid: [
          ...(avoidTolls ? ['tolls'] : []),
          ...(avoidHighways ? ['highways'] : [])
        ].join('|')
      });

      const apiUrl = `${this.DIRECTIONS_API_URL}?${params.toString()}`;

      console.log('🗺️ Requesting route from Google Directions API...');
      console.log('📍 From:', `${origin.latitude},${origin.longitude}`);
      console.log('🎯 To:', `${destination.latitude},${destination.longitude}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SriHeritageApp/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Directions API HTTP error:', response.status, response.statusText);
        console.error('❌ Error details:', errorText);
        return null;
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error('❌ Google Directions API status:', data.status);
        if (data.error_message) {
          console.error('❌ Error message:', data.error_message);
        }
        return null;
      }
      
      if (!data.routes || data.routes.length === 0) {
        console.error('❌ No routes found in response');
        return null;
      }

      console.log('✅ Directions API response received with', data.routes.length, 'routes');

      // Process the best route (prefer main roads for Sri Lanka)
      const bestRoute = this.selectBestRoute(data.routes, preferMainRoads);
      
      if (!bestRoute) {
        console.error('❌ No valid route found');
        return null;
      }

      return this.processRoute(bestRoute);
      
    } catch (error) {
      console.error('❌ Error getting route:', error);
      return null;
    }
  }

  /**
   * Get route distance using road network (wrapper for convenience)
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
   * Select the best route from multiple options, preferring main roads
   * In Sri Lanka context, this means preferring A-grade and B-grade roads
   */
  private selectBestRoute(routes: any[], preferMainRoads: boolean): any | null {
    if (!routes || routes.length === 0) {
      return null;
    }

    if (!preferMainRoads) {
      // Just return the first route
      return routes[0];
    }

    // For Directions API, we'll select based on duration and distance
    let bestRoute = routes[0];
    let bestScore = this.scoreRoute(bestRoute);

    for (let i = 1; i < routes.length; i++) {
      const score = this.scoreRoute(routes[i]);
      if (score > bestScore) {
        bestScore = score;
        bestRoute = routes[i];
      }
    }

    return bestRoute;
  }

  /**
   * Score a route based on Directions API data structure
   */
  private scoreRoute(route: any): number {
    let score = 0;

    // Prefer shorter duration (higher score for less time)
    const duration = route.legs?.[0]?.duration?.value || 0;
    score += Math.max(0, 3600 - duration); // Bonus for routes under 1 hour

    // Prefer shorter distance as tiebreaker
    const distance = route.legs?.[0]?.distance?.value || 0;
    score += Math.max(0, 50000 - distance); // Bonus for routes under 50km

    return score;
  }

  /**
   * Process route data from Google Directions API response
   */
  private processRoute(route: any): RouteResult {
    const leg = route.legs?.[0];
    const distanceMeters = leg?.distance?.value || 0;
    const durationSeconds = leg?.duration?.value || 0;
    
    let coordinates: Coordinates[] = [];

    console.log('📋 Processing route with legs:', route.legs?.length);
    console.log('📊 Overview polyline available:', !!route.overview_polyline?.points);

    // Decode polyline if available
    if (route.overview_polyline?.points) {
      console.log('🧵 Decoding polyline...');
      coordinates = this.decodePolyline(route.overview_polyline.points);
      console.log('✅ Decoded polyline to', coordinates.length, 'coordinates');
    }

    // If no polyline coordinates, extract from steps
    if (coordinates.length === 0 && leg?.steps) {
      console.log('📍 Extracting coordinates from', leg.steps.length, 'steps');
      leg.steps.forEach((step: any, stepIndex: number) => {
        // Add start location of the step
        if (step.start_location) {
          coordinates.push({
            latitude: step.start_location.lat,
            longitude: step.start_location.lng
          });
        }
        
        // If step has its own polyline, decode it for more detail
        if (step.polyline?.points) {
          const stepCoordinates = this.decodePolyline(step.polyline.points);
          console.log(`📍 Step ${stepIndex}: decoded ${stepCoordinates.length} points from polyline`);
          coordinates.push(...stepCoordinates);
        }
        
        // Add end location of the step
        if (step.end_location) {
          coordinates.push({
            latitude: step.end_location.lat,
            longitude: step.end_location.lng
          });
        }
      });
      console.log('📍 Extracted total', coordinates.length, 'coordinates from steps');
    }

    console.log('🗺️ Setting route coordinates:', coordinates.length, 'points');
    if (coordinates.length > 0) {
      console.log('📍 Route start:', coordinates[0]);
      console.log('🎯 Route end:', coordinates[coordinates.length - 1]);
    }

    return {
      distance: distanceMeters / 1000, // Convert to kilometers
      duration: durationSeconds / 60, // Convert to minutes
      coordinates,
      overview_polyline: route.overview_polyline?.points,
      summary: leg?.summary
    };
  }

  /**
   * Decode Google's encoded polyline algorithm
   */
  private decodePolyline(encoded: string): Coordinates[] {
    const coordinates: Coordinates[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5
      });
    }

    return coordinates;
  }

  /**
   * Check if the routing service is available (has valid API key)
   */
  isAvailable(): boolean {
    return !!this.GOOGLE_MAPS_API_KEY && this.GOOGLE_MAPS_API_KEY.length > 0;
  }

  /**
   * Get estimated travel time between two points
   */
  async getTravelTime(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<number | null> {
    const route = await this.getRoute(origin, destination, { mode });
    return route ? route.duration : null;
  }

  /**
   * Get multiple route alternatives using Directions API
   */
  async getRouteAlternatives(
    origin: Coordinates,
    destination: Coordinates,
    options: RoutingOptions = {}
  ): Promise<RouteResult[]> {
    try {
      const {
        avoidTolls = false,
        avoidHighways = false,
        mode = 'driving'
      } = options;

      // Build URL parameters for Directions API
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: mode,
        key: this.GOOGLE_MAPS_API_KEY,
        region: 'LK', // Sri Lanka
        language: 'en',
        alternatives: 'true',
        avoid: [
          ...(avoidTolls ? ['tolls'] : []),
          ...(avoidHighways ? ['highways'] : [])
        ].join('|')
      });

      const apiUrl = `${this.DIRECTIONS_API_URL}?${params.toString()}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Directions API error:', response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error('❌ Google Directions API status:', data.status);
        return [];
      }
      
      if (!data.routes || data.routes.length === 0) {
        console.error('❌ No alternative routes found');
        return [];
      }

      return data.routes.map((route: any) => this.processRoute(route));
      
    } catch (error) {
      console.error('❌ Error getting route alternatives:', error);
      return [];
    }
  }
}

// Create and export the service instance  
export const routingService = new RoutingService();

// Export the service as default for easier importing
export default routingService;

// Sri Lankan major road identifiers for route scoring
export const SRI_LANKAN_MAJOR_ROADS = {
  A_GRADE: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20', 'A21', 'A22', 'A23', 'A24', 'A25', 'A26', 'A27', 'A28', 'A29', 'A30', 'A31', 'A32', 'A33', 'A34', 'A35'],
  B_GRADE: ['B001', 'B002', 'B003', 'B004', 'B005', 'B006', 'B007', 'B008', 'B009', 'B010', 'B011', 'B012', 'B013', 'B014', 'B015', 'B016', 'B017', 'B018', 'B019', 'B020']
};