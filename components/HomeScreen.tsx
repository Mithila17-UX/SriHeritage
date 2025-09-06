import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, PermissionsAndroid, Platform, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getSitesFromFirestore, FirestoreSite } from '../services/firebase';
import { authService } from '../services/auth';
import { DistanceCalculatorService } from '../services/distanceCalculator';
import { routingServiceOSM } from '../services/routingServiceOSM';
import { LeafletPageService } from '../services/leafletPage';

interface HomeScreenProps {
  user: { name: string; email: string } | null;
  onNavigateToSite: (site: any) => void;
  favoriteSites: number[];
  visitedSites: number[];
}

interface Site {
  id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  image_url?: string;
  historical_period?: string;
  significance?: string;
  visiting_hours?: string;
  entry_fee?: string;
  created_at?: string;
  updated_at?: string;
  district?: string;
  distance?: string;
  rating?: number;
  image?: string;
  openingHours?: string;
  entranceFee?: string;
  gallery?: string | string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

interface MapConfig {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
    name: string;
    description?: string;
  };
  routeCoordinates: RouteCoordinates[];
  showFallbackMessage: boolean;
  fallbackMessage?: string;
}

const defaultHeritageSites = [
  {
    id: 1,
    name: 'Temple of the Sacred Tooth Relic',
    location: 'Kandy',
    distance: '2.3 km',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
    category: 'Temple',
    description: 'A Buddhist temple that houses the relic of the tooth of the Buddha.',
    openingHours: 'Daily: 5:30 AM - 8:00 PM',
    entranceFee: 'Local: LKR 50, Foreign: LKR 1,000',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571715268652-3c2247e38d3e?w=800&h=600&fit=crop'
    ],
    latitude: 7.2905,
    longitude: 80.6337
  },
  {
    id: 2,
    name: 'Sigiriya Rock Fortress',
    location: 'Matale',
    distance: '45.2 km',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1571715268652-3c2247e38d3e?w=400&h=300&fit=crop',
    category: 'Ancient City',
    description: 'An ancient rock fortress and palace with magnificent frescoes.',
    openingHours: 'Daily: 7:00 AM - 5:30 PM',
    entranceFee: 'Local: LKR 60, Foreign: USD 30',
    gallery: [
      'https://images.unsplash.com/photo-1571715268652-3c2247e38d3e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop'
    ],
    latitude: 7.9570,
    longitude: 80.7603
  },
  {
    id: 3,
    name: 'Galle Fort',
    location: 'Galle',
    distance: '78.5 km',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop',
    category: 'Colonial Fort',
    description: 'A 17th-century fort built by the Portuguese and later fortified by the Dutch.',
    openingHours: 'Daily: 6:00 AM - 6:00 PM',
    entranceFee: 'Free entry to fort area',
    gallery: [
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1575484470027-8d85bbf23b62?w=800&h=600&fit=crop'
    ],
    latitude: 6.0535,
    longitude: 80.2210
  },
  {
    id: 4,
    name: 'Dambulla Cave Temple',
    location: 'Dambulla',
    distance: '52.1 km',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1575484470027-8d85bbf23b62?w=400&h=300&fit=crop',
    category: 'Cave Temple',
    description: 'The largest and best-preserved cave temple complex in Sri Lanka.',
    openingHours: 'Daily: 7:00 AM - 7:00 PM',
    entranceFee: 'Local: LKR 500, Foreign: USD 10',
    gallery: [
      'https://images.unsplash.com/photo-1575484470027-8d85bbf23b62?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop'
    ],
    latitude: 7.8567,
    longitude: 80.6492
  }
];

export function HomeScreen({ user, onNavigateToSite, favoriteSites, visitedSites }: HomeScreenProps) {
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [heritageSites, setHeritageSites] = useState<Site[]>([]); // Start with empty array
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [firestoreLoading, setFirestoreLoading] = useState<boolean>(false);
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [selectedSiteForDirections, setSelectedSiteForDirections] = useState<Site | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinates[]>([]);
  const [roadDistances, setRoadDistances] = useState<Record<number, { distance: number; isRoad: boolean }>>({});
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Request location permission and get user location
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
        console.log('Location permission granted and location obtained');
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby heritage sites. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(location);
      
      console.log('Current location updated:', location.coords);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Load sites directly from Firestore
  const loadSitesFromFirestore = async () => {
    try {
      setFirestoreLoading(true);
      console.log('🔄 Loading sites directly from Firestore...');
      
      const firestoreSites = await getSitesFromFirestore();
      
      if (firestoreSites && firestoreSites.length > 0) {
        console.log('✅ Sites loaded from Firestore:', firestoreSites.length);
        setHeritageSites(firestoreSites);
        
        // Store the Firestore data in AsyncStorage for offline access
        await AsyncStorage.setItem('firestore-sites', JSON.stringify(firestoreSites));
        await AsyncStorage.setItem('sites-last-updated', new Date().toISOString());
        
        // Sync to SQLite for better offline support
        try {
          const { databaseService } = await import('../services');
          
          // Insert Firebase data into SQLite
          for (const site of firestoreSites) {
            await databaseService.insertOrUpdateSite({
              id: site.id,
              name: site.name,
              description: site.description,
              location: site.location,
              latitude: site.latitude || site.coordinates?.latitude || 0,
              longitude: site.longitude || site.coordinates?.longitude || 0,
              category: site.category,
              image_url: site.image || site.image_url || '',
              historical_period: site.historical_period || '',
              significance: site.significance || '',
              visiting_hours: site.openingHours || site.visiting_hours || '',
              entry_fee: site.entranceFee || site.entry_fee || '',
              district: site.district || '',
              distance: site.distance || '',
              rating: site.rating || 4.5,
              image: site.image || site.image_url || '',
              openingHours: site.openingHours || site.visiting_hours || '',
              entranceFee: site.entranceFee || site.entry_fee || '',
              gallery: Array.isArray(site.gallery) ? site.gallery.join(',') : '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          console.log('✅ Sites synced to SQLite for offline support');
        } catch (sqliteError) {
          console.error('❌ Error syncing to SQLite:', sqliteError);
        }
      } else {
        console.log('⚠️ No sites found in Firestore, showing empty state');
        setHeritageSites([]);
      }
    } catch (error) {
      console.error('❌ Error loading sites from Firestore:', error);
      
      // Try to load from AsyncStorage as fallback
      try {
        const storedSites = await AsyncStorage.getItem('firestore-sites');
        if (storedSites) {
          const parsedSites = JSON.parse(storedSites);
          console.log('📱 Loading sites from cached data:', parsedSites.length);
          setHeritageSites(parsedSites);
        } else {
          console.log('📱 No cached data, showing empty state');
          setHeritageSites([]);
        }
      } catch (cacheError) {
        console.error('❌ Error loading cached sites:', cacheError);
        setHeritageSites([]);
      }
    } finally {
      setFirestoreLoading(false);
      setLoading(false); // Set main loading state to false
    }
  };

  // Calculate road distances for all heritage sites
  const calculateRoadDistancesForAllSites = async () => {
    if (!userLocation || !heritageSites.length) {
      return;
    }

    console.log('🗺️ Calculating road distances for', heritageSites.length, 'sites...');
    const distances: Record<number, { distance: number; isRoad: boolean }> = {};

    for (const site of heritageSites) {
      const siteLat = site.latitude || site.coordinates?.latitude;
      const siteLon = site.longitude || site.coordinates?.longitude;

      if (siteLat && siteLon) {
        try {
          // Try to get road distance first
          const roadDistance = await calculateRoadDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            siteLat,
            siteLon
          );

          if (roadDistance !== null) {
            distances[site.id] = { distance: roadDistance, isRoad: true };
            console.log(`✅ Road distance for ${site.name}: ${roadDistance.toFixed(1)} km`);
          } else {
            // Fallback to direct distance
            const directDistance = calculateDistance(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              siteLat,
              siteLon
            );
            distances[site.id] = { distance: directDistance, isRoad: false };
            console.log(`📍 Direct distance for ${site.name}: ${directDistance.toFixed(1)} km`);
          }
        } catch (error) {
          console.error(`❌ Error calculating distance for ${site.name}:`, error);
          // Fallback to direct distance
          const directDistance = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            siteLat,
            siteLon
          );
          distances[site.id] = { distance: directDistance, isRoad: false };
        }
      }
    }

    setRoadDistances(distances);
    console.log('✅ Road distance calculation completed');
  };

  // Get formatted distance text for a site
  const getDistanceText = (site: Site): string => {
    const distanceInfo = roadDistances[site.id];
    
    if (distanceInfo) {
      const suffix = distanceInfo.isRoad ? ' via road' : ' (direct)';
      return `${distanceInfo.distance.toFixed(1)} km${suffix}`;
    }
    
    // Fallback to calculating direct distance on the fly
    if (userLocation) {
      const siteLat = site.latitude || site.coordinates?.latitude;
      const siteLon = site.longitude || site.coordinates?.longitude;
      
      if (siteLat && siteLon) {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          siteLat,
          siteLon
        );
        return `${distance.toFixed(1)} km (direct)`;
      }
    }
    
    return site.distance || 'Distance unavailable';
  };

  // Calculate road distance between two points
  const calculateRoadDistance = async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<number | null> => {
    try {
      const roadDistance = await DistanceCalculatorService.calculateRoadDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 },
        true // Prefer main roads
      );
      return roadDistance;
    } catch (error) {
      console.error('❌ Error calculating road distance:', error);
      return null;
    }
  };

  // Calculate direct distance between two points (fallback)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Generate route coordinates using OSRM (OpenStreetMap routing)
  const generateRouteCoordinates = async (startLat: number, startLon: number, endLat: number, endLon: number): Promise<{ coordinates: RouteCoordinates[]; isFallback: boolean; }> => {
    try {
      console.log('🗺️ HomeScreen: Getting route from OSRM (OpenStreetMap)...');
      const route = await routingServiceOSM.getRoute(
        { latitude: startLat, longitude: startLon },
        { latitude: endLat, longitude: endLon },
        { mode: 'driving', fallbackToStraightLine: true }
      );

      if (route && route.coordinates.length > 0) {
        console.log('✅ HomeScreen: Route obtained from OSM with', route.coordinates.length, 'points');
        return {
          coordinates: route.coordinates.map((coord: any) => ({
            latitude: coord.latitude,
            longitude: coord.longitude
          })),
          isFallback: route.isFallback || false
        };
      } else {
        console.warn('⚠️ HomeScreen: No route found from OSRM, using fallback');
      }
    } catch (error) {
      console.error('❌ HomeScreen: Error getting route from OSRM:', error);
    }

    // Fallback: Create a simple straight line route
    const steps = 10;
    const coordinates: RouteCoordinates[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      coordinates.push({
        latitude: startLat + (endLat - startLat) * ratio,
        longitude: startLon + (endLon - startLon) * ratio,
      });
    }
    
    console.log('📍 HomeScreen: Using fallback straight-line route with', coordinates.length, 'points');
    return { coordinates, isFallback: true };
  };

  // Show directions to selected site
  const showDirectionsToSite = async (site: Site) => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to get directions.');
      return;
    }

    setSelectedSiteForDirections(site);
    setShowDirections(true);

    // Generate route coordinates using OSRM (OpenStreetMap routing)
    const routeResult = await generateRouteCoordinates(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      site.latitude || site.coordinates?.latitude || 0,
      site.longitude || site.coordinates?.longitude || 0
    );
    setRouteCoordinates(routeResult.coordinates);

    // Prepare map configuration for WebView
    const config: MapConfig = {
      userLocation: {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      destination: {
        latitude: site.latitude || site.coordinates?.latitude || 0,
        longitude: site.longitude || site.coordinates?.longitude || 0,
        name: site.name,
        description: site.location,
      },
      routeCoordinates: routeResult.coordinates,
      showFallbackMessage: routeResult.isFallback,
      fallbackMessage: routeResult.isFallback 
        ? "OSRM routing unavailable. Showing direct route." 
        : undefined,
    };

    setMapConfig(config);

    // Calculate road distance first, fallback to direct distance
    let distance: number;
    const roadDistance = await calculateRoadDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      site.latitude || site.coordinates?.latitude || 0,
      site.longitude || site.coordinates?.longitude || 0
    );

    if (roadDistance !== null) {
      distance = roadDistance;
      console.log('📍 Using road distance:', distance, 'km');
    } else {
      distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        site.latitude || site.coordinates?.latitude || 0,
        site.longitude || site.coordinates?.longitude || 0
      );
      console.log('📍 Using direct distance:', distance, 'km');
    }

    // Calculate the bounds to include both user location and destination
    const userLat = userLocation.coords.latitude;
    const userLon = userLocation.coords.longitude;
    const siteLat = site.latitude || site.coordinates?.latitude || 0;
    const siteLon = site.longitude || site.coordinates?.longitude || 0;

    // Find the minimum and maximum coordinates
    const minLat = Math.min(userLat, siteLat);
    const maxLat = Math.max(userLat, siteLat);
    const minLon = Math.min(userLon, siteLon);
    const maxLon = Math.max(userLon, siteLon);

    // Calculate the center point
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    // Calculate the span with padding
    const latDelta = (maxLat - minLat) * 1.5; // 50% padding
    const lonDelta = (maxLon - minLon) * 1.5; // 50% padding

    // Ensure minimum zoom level for better visibility
    const minDelta = 0.01; // Minimum zoom level
    const finalLatDelta = Math.max(latDelta, minDelta);
    const finalLonDelta = Math.max(lonDelta, minDelta);

    Alert.alert(
      'Directions',
      `Route to ${site.name}\nDistance: ${distance.toFixed(1)} km\nEstimated time: ${Math.ceil(distance * 2)} minutes`,
      [{ text: 'OK' }]
    );
  };

  // Clear directions
  const clearDirections = () => {
    setShowDirections(false);
    setSelectedSiteForDirections(null);
    setRouteCoordinates([]);
    fitMapToSites();
  };

  // Fit map to show all sites and user location
  const fitMapToSites = () => {
    if (heritageSites.length === 0) return;

    // Filter out sites with invalid coordinates
    const validSites = heritageSites.filter(site => {
      const lat = site.latitude || site.coordinates?.latitude;
      const lon = site.longitude || site.coordinates?.longitude;
      return lat && lon && lat !== 0 && lon !== 0;
    });

    if (validSites.length === 0) {
      // If no valid sites, just log that we couldn't fit the map
      console.log('No valid sites to fit on map');
      return;
    }

    const coordinates = validSites.map(site => ({
      latitude: site.latitude || site.coordinates?.latitude || 0,
      longitude: site.longitude || site.coordinates?.longitude || 0,
    }));

    if (userLocation) {
      coordinates.push({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });
    }

    const minLat = Math.min(...coordinates.map(c => c.latitude));
    const maxLat = Math.max(...coordinates.map(c => c.latitude));
    const minLon = Math.min(...coordinates.map(c => c.longitude));
    const maxLon = Math.max(...coordinates.map(c => c.longitude));

    // Ensure minimum delta values to prevent zoom issues
    const latDelta = Math.max((maxLat - minLat) * 1.2, 0.01);
    const lonDelta = Math.max((maxLon - minLon) * 1.2, 0.01);

    console.log('Map fitted to show all sites and user location');
  };

  useEffect(() => {
    const initializeMap = async () => {
      await requestLocationPermission();
      await loadSitesFromFirestore();
    };

    initializeMap();
  }, []);

  useEffect(() => {
    if (heritageSites.length > 0 && !loading) {
      fitMapToSites();
    }
  }, [heritageSites, userLocation, loading]);

  // Calculate road distances when user location and sites are available
  useEffect(() => {
    if (userLocation && heritageSites.length > 0 && !loading && !firestoreLoading) {
      calculateRoadDistancesForAllSites();
    }
  }, [userLocation, heritageSites, loading, firestoreLoading]);

  // Update location periodically
  useEffect(() => {
    if (locationPermission) {
      const locationInterval = setInterval(() => {
        getCurrentLocation();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(locationInterval);
    }
  }, [locationPermission]);

  // Generate map config for WebView when we have sites and location
  useEffect(() => {
    if (userLocation && heritageSites.length > 0 && !loading && !firestoreLoading) {
      // For home screen, if we're showing directions to a specific site, show that route
      if (showDirections && selectedSiteForDirections) {
        const config: MapConfig = {
          userLocation: {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude
          },
          destination: {
            latitude: selectedSiteForDirections.latitude || selectedSiteForDirections.coordinates?.latitude || 0,
            longitude: selectedSiteForDirections.longitude || selectedSiteForDirections.coordinates?.longitude || 0,
            name: selectedSiteForDirections.name,
            description: selectedSiteForDirections.location
          },
          routeCoordinates,
          showFallbackMessage: routeCoordinates.length === 0,
          fallbackMessage: "Routing failed. Showing straight line route."
        };
        setMapConfig(config);
        console.log('🗺️ Route map config generated for', selectedSiteForDirections.name);
      } else {
        // For overview, show the first heritage site as destination (this creates a general area map)
        const firstSite = heritageSites[0];
        const config: MapConfig = {
          userLocation: {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude
          },
          destination: {
            latitude: firstSite.latitude || firstSite.coordinates?.latitude || 0,
            longitude: firstSite.longitude || firstSite.coordinates?.longitude || 0,
            name: "Heritage Sites Overview",
            description: `${heritageSites.length} sites available`
          },
          routeCoordinates: [], // No route for overview
          showFallbackMessage: false
        };
        setMapConfig(config);
        console.log('🗺️ Overview map config generated with', heritageSites.length, 'sites');
      }
    }
  }, [userLocation, heritageSites, routeCoordinates, showDirections, selectedSiteForDirections, loading, firestoreLoading]);

  const handleMarkerPress = (site: Site) => {
    console.log('🗺️ HomeScreen: Navigating to site:', {
      id: site.id,
      name: site.name,
      gallery: site.gallery,
      galleryType: typeof site.gallery,
      isGalleryArray: Array.isArray(site.gallery),
      galleryLength: Array.isArray(site.gallery) ? site.gallery.length : 'N/A'
    });
    onNavigateToSite(site);
  };

  const getMarkerColor = (site: Site) => {
    const isFavorite = favoriteSites.includes(site.id);
    const isVisited = visitedSites.includes(site.id);
    
    if (isFavorite) return '#EF4444'; // Red for favorites
    if (isVisited) return '#10B981'; // Green for visited
    return '#3B82F6'; // Blue for regular sites
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>🗺️</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Heritage Sites Map</Text>
            <Text style={styles.headerSubtitle}>
              {firestoreLoading ? 'Loading from Firestore...' : 'Discover and navigate to cultural sites'}
            </Text>
          </View>
        </View>
      </View>

      {/* Interactive Map */}
      <View style={styles.mapContainer}>
        {loading || firestoreLoading ? (
          <View style={styles.mapLoadingContainer}>
            <Text style={styles.mapLoadingText}>🗺️</Text>
            <Text style={styles.mapLoadingTitle}>Loading Heritage Sites...</Text>
            <Text style={styles.mapLoadingSubtitle}>Fetching data from Firebase</Text>
          </View>
        ) : locationPermission ? (
          (() => {
            try {
              return (
                <WebView
                  ref={webViewRef}
                  style={styles.map}
                  source={{ html: mapConfig ? LeafletPageService.generateMapHTML(mapConfig) : '<html><body><p>Loading map...</p></body></html>' }}
                  originWhitelist={['*']}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  domStorageEnabled={true}
                  javaScriptEnabled={true}
                  allowsFullscreenVideo={false}
                  allowsBackForwardNavigationGestures={false}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.mapLoadingContainer}>
                      <Text style={styles.mapLoadingText}>🗺️ Loading map...</Text>
                    </View>
                  )}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('🗺️ WebView error:', nativeEvent);
                  }}
                  onLoad={() => {
                    console.log('🗺️ Map WebView loaded successfully');
                  }}
                />
              );
            } catch (error) {
              console.error('Map rendering error:', error);
              return (
                <View style={styles.mapErrorContainer}>
                  <Text style={styles.mapErrorText}>🗺️</Text>
                  <Text style={styles.mapErrorTitle}>Map Loading Error</Text>
                  <Text style={styles.mapErrorSubtitle}>Please try refreshing the app</Text>
                </View>
              );
            }
          })()
        ) : (
          <View style={styles.mapPermissionContainer}>
            <Text style={styles.mapPermissionText}>📍</Text>
            <Text style={styles.mapPermissionTitle}>Location Permission Required</Text>
            <Text style={styles.mapPermissionSubtitle}>Please enable location access to view the map</Text>
            <TouchableOpacity
              style={styles.mapPermissionButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.mapPermissionButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Directions Control */}
        {showDirections && selectedSiteForDirections && (
          <View style={styles.directionsControl}>
            <View style={styles.directionsInfo}>
              <Text style={styles.directionsTitle}>Route to {selectedSiteForDirections.name}</Text>
              {userLocation && (
                <Text style={styles.directionsDistance}>
                  Distance: {calculateDistance(
                    userLocation.coords.latitude,
                    userLocation.coords.longitude,
                    selectedSiteForDirections.latitude || selectedSiteForDirections.coordinates?.latitude || 0,
                    selectedSiteForDirections.longitude || selectedSiteForDirections.coordinates?.longitude || 0
                  ).toFixed(1)} km
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.clearDirectionsButton}
              onPress={clearDirections}
            >
              <Text style={styles.clearDirectionsButtonText}>Clear Route</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sites List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Nearby Heritage Sites</Text>
          <Text style={styles.listSubtitle}>
            {firestoreLoading ? 'Loading from Firestore...' : 'Discover the cultural treasures around you'}
          </Text>
        </View>
        
        <View style={styles.sitesList}>
          {heritageSites.map((site) => {
            const isFavorite = favoriteSites.includes(site.id);
            const isVisited = visitedSites.includes(site.id);
            
            // Calculate distance if user location is available
            const distanceText = getDistanceText(site);
            
            return (
              <TouchableOpacity 
                key={site.id}
                onPress={() => setSelectedSite(selectedSite === site.id ? null : site.id)}
              >
                <Card style={{
                  ...styles.siteCard,
                  ...(selectedSite === site.id ? styles.selectedSiteCard : {})
                }}>
                  <CardContent style={styles.siteCardContent}>
                    <View style={styles.cardTopSection}>
                      <View style={styles.siteImageContainer}>
                        {site.image || site.image_url ? (
                           <Image source={{ uri: site.image || site.image_url }} style={styles.siteImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.noImagePlaceholder}><Text style={styles.noImageText}>📷</Text></View>
                        )}
                        {isVisited && <View style={[styles.badge, styles.visitedBadge]}><Text style={styles.badgeIcon}>👁️</Text></View>}
                        {isFavorite && <View style={[styles.badge, styles.favoriteBadge]}><Text style={styles.badgeIcon}>❤️</Text></View>}
                      </View>
                      
                      <View style={styles.siteInfo}>
                        <Text style={styles.siteName} numberOfLines={1}>{site.name}</Text>
                        <Text style={styles.siteDetailText}>{site.location}</Text>
                        <Text style={styles.siteDetailText}>{distanceText}</Text>
                        <View style={styles.siteMetadata}>
                          <Badge style={styles.categoryBadge}>{site.category}</Badge>
                          <Text style={styles.rating}>⭐ {site.rating || 4.5}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.siteActions}>
                      <TouchableOpacity 
                        style={styles.detailsButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          onNavigateToSite(site);
                        }}
                      >
                        <Text style={styles.detailsButtonText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {selectedSite === site.id && (
                      <View style={styles.expandedContent}>
                        <Text style={styles.siteDescription}>{site.description}</Text>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={() => showDirectionsToSite(site)}
                          >
                            <Text style={styles.primaryButtonText}>Get Directions</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Book a Ride</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </CardContent>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#2563EB', paddingTop: 32, paddingHorizontal: 16, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconContainer: { backgroundColor: 'rgba(255, 255, 255, 0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  headerIcon: { fontSize: 24, color: '#FFFFFF' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#D1FAE5' },
  mapContainer: { height: 256, backgroundColor: '#DCFCE7', position: 'relative' },
  map: { flex: 1 },
  mapLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DCFCE7' },
  mapLoadingText: { fontSize: 48, color: '#2563EB', marginBottom: 12 },
  mapLoadingTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  mapLoadingSubtitle: { fontSize: 14, color: '#4B5563', marginBottom: 16 },
  mapPermissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DCFCE7' },
  mapPermissionText: { fontSize: 48, color: '#2563EB', marginBottom: 12 },
  mapPermissionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  mapPermissionSubtitle: { fontSize: 14, color: '#4B5563', marginBottom: 16 },
  mapPermissionButton: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  mapPermissionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  // Callout styles for map markers
  calloutContainer: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    minWidth: 200, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 8, 
    elevation: 8 
  },
  calloutHeader: { marginBottom: 8 },
  calloutTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  calloutLocation: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  calloutDistance: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  calloutContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calloutCategory: { fontSize: 12, color: '#3B82F6', backgroundColor: '#E0E7FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  calloutRating: { fontSize: 12, color: '#F59E42', fontWeight: 'bold' },
  calloutActions: { flexDirection: 'row', gap: 8 },
  calloutButton: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  calloutButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  directionsButton: { flex: 1, backgroundColor: '#10B981', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  directionsButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  // Directions control
  directionsControl: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    right: 16, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 8, 
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  directionsInfo: { flex: 1 },
  directionsTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  directionsDistance: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  clearDirectionsButton: { backgroundColor: '#EF4444', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  clearDirectionsButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  listContainer: { flex: 1 },
  listContent: { padding: 16 },
  listHeader: { marginBottom: 16 },
  listTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 4 },
  listSubtitle: { fontSize: 14, color: '#4B5563' },
  sitesList: { gap: 16 },
  siteCard: { marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, paddingTop: 16, paddingBottom: 16, borderWidth: 2, borderColor: 'transparent' },
  selectedSiteCard: { borderColor: '#FB923C' },
  siteCardContent: { paddingHorizontal: 16, gap: 16 },
  cardTopSection: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  siteImageContainer: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6', position: 'relative' },
  siteImage: { width: '100%', height: '100%' },
  noImagePlaceholder: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  noImageText: { fontSize: 30, color: '#9CA3AF' },
  badge: { position: 'absolute', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  visitedBadge: { top: 4, right: 4, backgroundColor: '#10B981' },
  favoriteBadge: { bottom: 4, right: 4, backgroundColor: '#EF4444' },
  badgeIcon: { fontSize: 12 },
  siteInfo: { flex: 1 },
  siteName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  siteDetailText: { fontSize: 14, color: '#4B5563', marginBottom: 2 },
  siteMetadata: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  categoryBadge: { backgroundColor: '#E0E7FF', color: '#3730A3', fontWeight: '600' },
  rating: { fontSize: 15, color: '#F59E42', fontWeight: 'bold' },
  siteActions: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  detailsButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#FEF3C7' },
  detailsButtonText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  siteDescription: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  primaryButton: { flex: 1, backgroundColor: '#EA580C', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center' },
  primaryButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  secondaryButton: { flex: 1, backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  mapErrorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEE2E2' },
  mapErrorText: { fontSize: 48, color: '#991B1B', marginBottom: 12 },
  mapErrorTitle: { fontSize: 18, fontWeight: 'bold', color: '#991B1B', marginBottom: 4 },
  mapErrorSubtitle: { fontSize: 14, color: '#991B1B', marginBottom: 16 },
});
