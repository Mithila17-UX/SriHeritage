# OpenStreetMap + Leaflet Migration Guide

This document explains the migration from Google Maps + Google Directions API to OpenStreetMap + Leaflet for the SriHeritageApp.

## 🎯 Overview

The app has been successfully refactored to use:
- **OpenStreetMap** tiles instead of Google Maps
- **OSRM (Open Source Routing Machine)** instead of Google Directions API
- **Leaflet** rendered in WebView instead of react-native-maps
- **No API keys required** - completely free solution

## 📦 Dependencies Installed

```bash
# Install required dependencies
expo install react-native-webview

# Remove old dependencies (already done)
npm uninstall react-native-maps
```

## 🗂️ New Files Created

### 1. `services/leafletPage.ts`
- Generates HTML with Leaflet map for WebView
- Handles markers, routes, and styling
- Secure implementation with disabled unsafe features
- Proper OpenStreetMap attribution

### 2. `services/routingServiceOSM.ts` 
- OSRM API integration for routing
- Haversine fallback for straight-line routes
- No API keys required
- Error handling and connectivity testing

### 3. `components/OSMRoutingTest.tsx` (Optional)
- Test component to verify integration
- Useful for development and debugging

## 🔄 Files Modified

### 1. `components/SiteInformationPage.tsx`
**Key Changes:**
- Replaced `react-native-maps` imports with `react-native-webview`
- Updated routing service from Google to OSM
- Replaced MapView with WebView + Leaflet HTML
- Added fallback message handling

### 2. `components/AllPlacesScreen.tsx`
**Key Changes:**
- Same WebView + Leaflet migration
- Updated routing logic to be async
- Improved error handling

## 🚀 How to Run

### 1. Install Dependencies
```bash
cd "/path/to/SriHeritageApp"
expo install react-native-webview
```

### 2. Start the App
```bash
expo start
```

### 3. Test in Expo Go
1. Scan QR code with Expo Go app
2. Navigate to any heritage site
3. Tap "Get Directions"
4. Verify OpenStreetMap loads with route

## 🧪 Testing Guide

### Smoke Tests
1. **Basic Map Display**
   - Open any site information page
   - Tap "Get Directions"
   - ✅ Should show OpenStreetMap with markers

2. **Routing Test**
   - Ensure location permissions are granted
   - Tap "Get Directions" from any site
   - ✅ Should show route line between user and destination
   - ✅ Should show fallback message if OSRM fails

3. **Offline Behavior**
   - Disable internet connection
   - Try to load directions
   - ✅ Should show error and fallback to basic markers

### Using Test Component (Optional)
If you want to run dedicated tests:

1. Import the test component in your main navigation
2. Add OSMRoutingTest to your screen navigation
3. Run specific connectivity and routing tests

## 🔍 Technical Details

### OSRM API Usage
- **Endpoint**: `https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson`
- **Format**: GeoJSON response with coordinates
- **Fallback**: Haversine formula for straight-line distance
- **No Rate Limits**: Free demo server (production may want own OSRM instance)

### Security Features
- WebView configured with strict security
- No file access allowed
- No geolocation API exposed to WebView
- Mixed content disabled
- Only HTTPS sources

### Performance Considerations
- Leaflet HTML is generated dynamically
- Coordinates are passed as JSON in HTML
- Map tiles cached by WebView
- Minimal JavaScript for security

## 🌍 OpenStreetMap Attribution

The app properly displays the required attribution:
```
© OpenStreetMap contributors
```

This appears at the bottom right of every map as required by OSM license.

## 🔧 Troubleshooting

### Map Not Loading
1. Check internet connection
2. Verify WebView permissions
3. Check console for JavaScript errors

### Routing Not Working
1. OSRM server may be temporarily down
2. App automatically falls back to straight line
3. Distance and time estimates still calculated

### Location Permission Issues
1. Ensure location permissions granted in device settings
2. Test on physical device (not simulator for best results)
3. Check iOS/Android location service settings

## 📱 Production Deployment

### For Production Apps:
1. **Consider Self-Hosted OSRM**: The demo server is free but may have availability issues
2. **Tile Server**: Consider using your own tile server for better reliability
3. **Error Monitoring**: Add proper error tracking for map failures
4. **Offline Maps**: Consider caching tiles for offline usage

### Self-Hosted OSRM Setup:
```bash
# Example Docker setup for self-hosted OSRM
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/sri-lanka-latest.osm.pbf
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-partition /data/sri-lanka-latest.osrm
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-customize /data/sri-lanka-latest.osrm
docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/sri-lanka-latest.osrm
```

## ✅ Benefits Achieved

1. **Zero Cost**: No API keys or billing required
2. **No Rate Limits**: Free usage of OSM services
3. **Open Source**: Full control over mapping solution
4. **Privacy**: No data sent to Google
5. **Reliability**: Fallback mechanisms ensure app always works
6. **Compliance**: Proper open source attribution

## 📋 Migration Checklist

- [x] Install react-native-webview
- [x] Remove react-native-maps dependency
- [x] Create leafletPage.ts service
- [x] Create routingServiceOSM.ts service
- [x] Update SiteInformationPage.tsx
- [x] Update AllPlacesScreen.tsx
- [x] Add proper error handling
- [x] Add fallback mechanisms
- [x] Test basic functionality
- [x] Verify OpenStreetMap attribution
- [x] Document implementation

## 🎉 Success Criteria Met

✅ **App launches in Expo Go without Google keys**  
✅ **"Get Directions" shows OSM map in WebView**  
✅ **Route displayed with polyline when OSRM works**  
✅ **Fallback to straight line when OSRM fails**  
✅ **Distance and ETA display correctly**  
✅ **No billing, no API keys, fully free**  

The migration is complete and the app now uses a fully open-source, free mapping solution!
