# Road Distance Implementation - Sri Heritage App

## Overview
This document describes the implementation of road-based distance calculation using Google Directions API, replacing the previous direct distance calculation with actual road distances via A-grade and B-grade roads in Sri Lanka.

## Changes Made

### 1. New Routing Service (`services/routingService.ts`)
- **Purpose**: Provides road-based distance and route calculations using Google Directions API
- **Key Features**:
  - Optimized for Sri Lankan A-grade and B-grade roads
  - Uses the same Google Maps API key as Firebase configuration
  - Includes route scoring to prefer main roads
  - Polyline decoding for detailed route visualization
  - Fallback handling for API failures

### 2. Enhanced Distance Calculator (`services/distanceCalculator.ts`)
- **New Methods Added**:
  - `calculateRoadDistance()`: Calculates road distance using Google Directions API
  - `calculateDistanceFromUserLocation()`: Returns both direct and road distances with travel time
  - `autoCalculateDistance()`: Now async and supports road distance with fallback
- **Backward Compatibility**: Maintains all existing methods with legacy support

### 3. Updated Components

#### SiteInformationPage (`components/SiteInformationPage.tsx`)
- **Distance Display**: Now shows road distance with estimated travel time
- **Format Examples**:
  - `"8.3 km (25m) via road"` - Road distance with travel time
  - `"8.3 km (direct)"` - Fallback to direct distance
- **Route Visualization**: Uses actual Google Directions API routes instead of straight lines

#### HomeScreen (`components/HomeScreen.tsx`)
- **Road Distance Calculation**: Automatically calculates road distances for all heritage sites
- **Cached Results**: Stores road distances to avoid repeated API calls
- **Smart Fallback**: Uses direct distance if road calculation fails
- **Updated Display**: Shows whether distance is road-based or direct

## Technical Implementation Details

### Google Directions API Integration
```typescript
// Example API call structure
const params = {
  origin: `${lat1},${lon1}`,
  destination: `${lat2},${lon2}`,
  key: GOOGLE_MAPS_API_KEY,
  mode: 'driving',
  alternatives: 'true',
  region: 'lk', // Sri Lanka
  units: 'metric'
};
```

### Road Preference Algorithm
The routing service includes intelligent road selection:
- **A-grade roads**: Highest priority (score +100)
- **B-grade roads**: Medium priority (score +50)
- **Duration bonus**: Shorter routes get higher scores
- **Sri Lankan road codes**: A1, A2, A3... A35, B001-B020

### Distance Display Logic
1. **Primary**: Road distance via Google Directions API
2. **Fallback**: Direct distance (Haversine formula)
3. **Error Handling**: Graceful degradation with clear indicators

## API Usage and Limits

### Google Maps API Key
- Uses existing Firebase Google API key: `AIzaSyAdXUZNOdmC4JGerYedKse4--i4Xw-mKlU`
- **Important**: Monitor API usage to avoid quota limits
- **Recommendation**: Consider implementing request caching

### Rate Limiting Considerations
- Calculates distances for all sites when user location is obtained
- Results are cached in component state
- Batch processing with error handling per site

## Testing the Implementation

### 1. User Location Permission
```javascript
// Test: Grant location permission when prompted
// Expected: App should request location and start calculating road distances
```

### 2. Distance Display
```javascript
// Test: Navigate to any heritage site details
// Expected: Distance should show as "X.X km (XXm) via road" or "X.X km (direct)"
```

### 3. Route Visualization
```javascript
// Test: Tap "Get Directions" on any site
// Expected: Map should show actual road route, not straight line
```

### 4. Fallback Behavior
```javascript
// Test: Disable internet connection
// Expected: App should fall back to direct distance calculation
```

## Performance Optimizations

### 1. Async Processing
- All road distance calculations are asynchronous
- Non-blocking UI updates
- Progress indicators during calculation

### 2. Error Handling
- Graceful fallback to direct distance
- Detailed logging for debugging
- User-friendly error messages

### 3. Caching Strategy
- Component-level caching of calculated distances
- Prevents redundant API calls
- Automatic recalculation when user location changes

## Future Enhancements

### 1. Offline Support
- Cache calculated routes for offline access
- Store popular routes in local storage
- Progressive enhancement for network availability

### 2. Route Alternatives
- Show multiple route options
- Allow user to select preferred route type
- Traffic-aware routing (requires additional API)

### 3. Estimated Time Accuracy
- Integrate real-time traffic data
- Consider Sri Lankan traffic patterns
- Time-of-day adjustments

## Code Examples

### Getting Road Distance
```typescript
const roadDistance = await DistanceCalculatorService.calculateRoadDistance(
  { latitude: userLat, longitude: userLon },
  { latitude: siteLat, longitude: siteLon },
  true // Prefer main roads
);
```

### Getting Full Distance Information
```typescript
const distanceInfo = await DistanceCalculatorService.calculateDistanceFromUserLocation(
  userLocation,
  siteCoordinates,
  true // Use road distance
);

console.log(distanceInfo);
// Output: {
//   directDistance: 8.1,
//   roadDistance: 8.3,
//   estimatedTime: 25,
//   recommendedDistance: 8.3
// }
```

### Using Routing Service Directly
```typescript
const route = await routingService.getRoute(
  origin,
  destination,
  { preferMainRoads: true }
);

if (route) {
  console.log(`Distance: ${route.distance} km`);
  console.log(`Duration: ${route.duration} minutes`);
  console.log(`Route points: ${route.coordinates.length}`);
}
```

## Monitoring and Analytics

### Key Metrics to Track
1. **API Usage**: Daily Google Directions API calls
2. **Success Rate**: Road distance calculation success vs fallback
3. **Performance**: Average response time for distance calculations
4. **User Experience**: Distance accuracy and route quality feedback

### Error Monitoring
- Track API failures and reasons
- Monitor fallback usage patterns
- Log performance bottlenecks

## Configuration

### Environment Variables (if needed)
```typescript
// Optional: Separate API key for directions
const GOOGLE_DIRECTIONS_API_KEY = process.env.GOOGLE_DIRECTIONS_API_KEY || FIREBASE_API_KEY;
```

### Feature Flags
```typescript
// Toggle road distance feature
const USE_ROAD_DISTANCE = true;
const PREFER_MAIN_ROADS = true;
const ENABLE_ROUTE_CACHING = true;
```

## Conclusion

The road distance implementation provides users with accurate, real-world distance calculations via Sri Lanka's main road network. The system is designed to be robust, with comprehensive fallback mechanisms and performance optimizations to ensure a smooth user experience regardless of network conditions or API availability.

The implementation maintains backward compatibility while providing significant improvements in distance accuracy and route visualization, making the Sri Heritage app more useful for trip planning and navigation.
