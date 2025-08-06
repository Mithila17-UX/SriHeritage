import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Share, Modal } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout, Polyline } from 'react-native-maps';
// Note: Replace lucide-react icons with React Native compatible icons
// Note: Tabs, Avatar, Textarea components would need React Native conversion
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { Avatar, AvatarFallback } from './ui/avatar';
// import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getSitesFromFirestore, FirestoreSite } from '../services/firebase';

interface SiteInformationPageProps {
  site: {
    id: number;
    name: string;
    location: string;
    distance: string;
    rating: number;
    image: string;
    category: string;
    description: string;
    openingHours?: string;
    entranceFee?: string;
    visiting_hours?: string; // Old field name
    entry_fee?: string; // Old field name
    gallery: string[] | string; // Allow both array and string formats
    latitude?: number;
    longitude?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  isFavorite: boolean;
  isVisited: boolean;
  offlineMode: boolean;
  onToggleFavorite: () => void;
  isPlanned: boolean;
  onVisitStatusChange: (status: 'visited' | 'not-visited' | 'planned') => void;
  onBack: () => void;
}

interface AspectRating {
  aspect: string;
  rating: number;
  icon: string;
}

interface Review {
  id: number;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  aspectRatings: AspectRating[];
}

interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

const aspectCategories = [
  { aspect: 'Cleanliness', icon: '🧹', description: 'How clean and well-maintained is the site?' },
  { aspect: 'Accessibility', icon: '♿', description: 'How accessible is the site for visitors with disabilities?' },
  { aspect: 'Historical Value', icon: '🏛️', description: 'How significant is the historical importance?' },
  { aspect: 'Photography', icon: '📸', description: 'How good are the photo opportunities?' },
  { aspect: 'Facilities', icon: '🚻', description: 'Quality of visitor facilities (restrooms, parking, etc.)' },
  { aspect: 'Crowd Level', icon: '👥', description: 'How crowded does the site typically get?' }
];

const reviews: Review[] = [
  {
    id: 1,
    author: 'Sarah Johnson',
    avatar: 'SJ',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Absolutely breathtaking! The architecture and spiritual atmosphere are incredible. A must-visit when in Sri Lanka.',
    helpful: 12,
    aspectRatings: [
      { aspect: 'Cleanliness', rating: 5, icon: '🧹' },
      { aspect: 'Accessibility', rating: 4, icon: '♿' },
      { aspect: 'Historical Value', rating: 5, icon: '🏛️' },
      { aspect: 'Photography', rating: 5, icon: '📸' },
      { aspect: 'Facilities', rating: 4, icon: '🚻' },
      { aspect: 'Crowd Level', rating: 3, icon: '👥' }
    ]
  },
  {
    id: 2,
    author: 'Ravi Patel',
    avatar: 'RP',
    rating: 4,
    date: '1 month ago',
    comment: 'Beautiful temple with rich history. Can get crowded during peak hours, so visit early morning for the best experience.',
    helpful: 8,
    aspectRatings: [
      { aspect: 'Cleanliness', rating: 4, icon: '🧹' },
      { aspect: 'Accessibility', rating: 3, icon: '♿' },
      { aspect: 'Historical Value', rating: 5, icon: '🏛️' },
      { aspect: 'Photography', rating: 4, icon: '📸' },
      { aspect: 'Facilities', rating: 3, icon: '🚻' },
      { aspect: 'Crowd Level', rating: 2, icon: '👥' }
    ]
  },
  {
    id: 3,
    author: 'Emily Chen',
    avatar: 'EC',
    rating: 5,
    date: '3 weeks ago',
    comment: 'Incredible historical significance and beautiful architecture. The guided tour was very informative.',
    helpful: 15,
    aspectRatings: [
      { aspect: 'Cleanliness', rating: 5, icon: '🧹' },
      { aspect: 'Accessibility', rating: 4, icon: '♿' },
      { aspect: 'Historical Value', rating: 5, icon: '🏛️' },
      { aspect: 'Photography', rating: 5, icon: '📸' },
      { aspect: 'Facilities', rating: 4, icon: '🚻' },
      { aspect: 'Crowd Level', rating: 4, icon: '👥' }
    ]
  }
];

export function SiteInformationPage({ 
  site, 
  isFavorite, 
  isVisited,
  isPlanned,
  offlineMode,
  onToggleFavorite,
  onVisitStatusChange,
  onBack 
}: SiteInformationPageProps) {
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [userAspectRatings, setUserAspectRatings] = useState<Record<string, number>>({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [calculatedDistance, setCalculatedDistance] = useState<string>('');
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [nearbySites, setNearbySites] = useState<FirestoreSite[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinates[]>([]);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 7.8731, // Sri Lanka center
    longitude: 80.7718,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [isGettingDirections, setIsGettingDirections] = useState(false);

  // Debug logging for site data
  useEffect(() => {
    console.log('🔍 SiteInformationPage - Site data received:', {
      id: site.id,
      name: site.name,
      gallery: site.gallery,
      galleryLength: site.gallery?.length,
      galleryType: typeof site.gallery,
      isGalleryArray: Array.isArray(site.gallery),
      galleryFirstItem: site.gallery?.[0],
      latitude: site.latitude,
      longitude: site.longitude,
      coordinates: site.coordinates,
      openingHours: site.openingHours,
      visiting_hours: site.visiting_hours,
      entranceFee: site.entranceFee,
      entry_fee: site.entry_fee
    });
  }, [site]);

  // Use the actual site rating from admin panel instead of calculating from reviews
  const averageRating = site.rating || 4.5;
  const totalReviews = reviews.length; // Keep this for display purposes

  // Request location permission and get user location
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);
        calculateDistanceFromUser(location);
        console.log('Location permission granted and location obtained');
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show directions. Please enable location permissions in your device settings.',
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

  // Calculate distance between two points
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

  // Calculate distance from user location to site
  const calculateDistanceFromUser = (location: Location.LocationObject) => {
    const siteLat = site.latitude || site.coordinates?.latitude;
    const siteLon = site.longitude || site.coordinates?.longitude;
    
    if (siteLat && siteLon) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        siteLat,
        siteLon
      );
      setCalculatedDistance(`${distance.toFixed(1)} km away`);
    } else {
      setCalculatedDistance(site.distance || 'Distance unavailable');
    }
  };

  // Generate route coordinates (simplified - in real app you'd use Google Directions API)
  const generateRouteCoordinates = (startLat: number, startLon: number, endLat: number, endLon: number): RouteCoordinates[] => {
    // Create a simple straight line route (in production, use Google Directions API)
    const steps = 10;
    const coordinates: RouteCoordinates[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      coordinates.push({
        latitude: startLat + (endLat - startLat) * ratio,
        longitude: startLon + (endLon - startLon) * ratio,
      });
    }
    
    return coordinates;
  };

  // Load nearby sites from Firestore
  const loadNearbySites = async () => {
    try {
      const sites = await getSitesFromFirestore();
      // Filter out the current site and limit to nearby sites
      const filteredSites = sites.filter(s => s.id !== site.id).slice(0, 10);
      setNearbySites(filteredSites);
    } catch (error) {
      console.error('Error loading nearby sites:', error);
    }
  };

  // Initialize location on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const handleBookRide = () => {
    Alert.alert('Ride Booking', 'Redirecting to PickMe for ride booking...');
  };

  const handleGetDirections = async () => {
    console.log('🧭 SiteInformationPage: Get Directions pressed');
    console.log('📍 Current state:', { userLocation, locationPermission });
    
    setIsGettingDirections(true);
    
    try {
      // Check if we have location permission
      if (!locationPermission) {
        console.log('📍 No location permission, requesting...');
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            setLocationPermission(true);
            console.log('✅ Location permission granted');
          } else {
            Alert.alert(
              'Location Permission Required',
              'Please enable location permissions in your device settings to get directions.',
              [{ text: 'OK' }]
            );
            return;
          }
        } catch (error) {
          console.error('❌ Error requesting location permission:', error);
          Alert.alert(
            'Location Error',
            'Unable to get location permission. Please check your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // If we don't have user location yet, try to get it
      if (!userLocation) {
        console.log('📍 No user location, getting current position...');
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setUserLocation(location);
          calculateDistanceFromUser(location);
          console.log('✅ User location obtained:', location.coords);
        } catch (error) {
          console.error('❌ Error getting current location:', error);
          Alert.alert(
            'Location Error',
            'Unable to get your current location. Please check your device settings and try again.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Now check if we have user location
      if (!userLocation) {
        Alert.alert(
          'Location Required',
          'Unable to get your location. Please check your device settings and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      const siteLat = site.latitude || site.coordinates?.latitude;
      const siteLon = site.longitude || site.coordinates?.longitude;
      
      if (!siteLat || !siteLon) {
        Alert.alert('Site Location', 'Location information for this site is not available.');
        return;
      }

      console.log('🗺️ Generating directions from', userLocation.coords, 'to', { siteLat, siteLon });

      // Load nearby sites
      await loadNearbySites();

      // Generate route coordinates
      const route = generateRouteCoordinates(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        siteLat,
        siteLon
      );
      setRouteCoordinates(route);

      // Calculate the bounds to include both user location and destination
      const userLat = userLocation.coords.latitude;
      const userLon = userLocation.coords.longitude;

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

      // Update map region to show the entire route
      const newRegion: Region = {
        latitude: centerLat,
        longitude: centerLon,
        latitudeDelta: finalLatDelta,
        longitudeDelta: finalLonDelta,
      };

      setMapRegion(newRegion);
      setShowMapModal(true);
      console.log('✅ Map modal opened with directions');
    } finally {
      setIsGettingDirections(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${site.name}: ${site.description}`,
        title: site.name,
      });
    } catch (error) {
      Alert.alert('Error', 'Sharing functionality not available');
    }
  };

  const handleSubmitReview = () => {
    if (userRating === 0) {
      Alert.alert('Review Required', 'Please provide an overall rating');
      return;
    }
    
    Alert.alert('Success', 'Review submitted successfully!');
    setShowReviewForm(false);
    setUserRating(0);
    setUserAspectRatings({});
    setUserComment('');
  };

  const setAspectRating = (aspect: string, rating: number) => {
    setUserAspectRatings(prev => ({ ...prev, [aspect]: rating }));
  };

  const lastSyncTime = new Date().toLocaleString();

  return (
    <View style={styles.container}>
      {/* Full Screen Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.mapModalContainer}>
          {/* Map Header */}
          <View style={styles.mapHeader}>
            <TouchableOpacity
              style={styles.mapBackButton}
              onPress={() => setShowMapModal(false)}
            >
              <Text style={styles.mapBackIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.mapHeaderInfo}>
              <Text style={styles.mapHeaderTitle}>Route to {site.name}</Text>
              <Text style={styles.mapHeaderDistance}>
                {calculatedDistance}
              </Text>
            </View>
          </View>

          {/* Map View */}
          <MapView
            style={styles.fullScreenMap}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            onRegionChangeComplete={setMapRegion}
          >
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                }}
                title="Your Location"
                description="You are here"
                pinColor="#10B981"
              />
            )}

            {/* Destination Marker */}
            {site.latitude && site.longitude && (
              <Marker
                coordinate={{
                  latitude: site.latitude,
                  longitude: site.longitude,
                }}
                title={site.name}
                description={site.location}
                pinColor="#EF4444"
              />
            )}

            {/* Nearby Sites Markers */}
            {nearbySites.map((nearbySite) => {
              const latitude = nearbySite.latitude || nearbySite.coordinates?.latitude;
              const longitude = nearbySite.longitude || nearbySite.coordinates?.longitude;
              
              if (!latitude || !longitude) return null;

              return (
                <Marker
                  key={nearbySite.id}
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                  title={nearbySite.name}
                  description={nearbySite.location}
                  pinColor="#3B82F6"
                />
              );
            })}

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#2563EB"
                strokeWidth={3}
                lineDashPattern={[1]}
              />
            )}
          </MapView>
        </View>
      </Modal>

      {/* Header Image */}
      <View style={styles.headerImageContainer}>
        <Image
          source={{ uri: site.image }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
        
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isFavorite && styles.favoriteButton]}
              onPress={onToggleFavorite}
            >
              <Text style={[styles.actionIcon, isFavorite && styles.favoriteIcon]}>
                {isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Indicator */}
        {offlineMode && (
          <View style={styles.offlineIndicator}>
            <View style={styles.offlineContent}>
              <Text style={styles.offlineIcon}>📶</Text>
              <View style={styles.offlineText}>
                <Text style={styles.offlineTitle}>Viewing offline content</Text>
                <Text style={styles.offlineSubtitle}>Last synced: {lastSyncTime}</Text>
              </View>
              <TouchableOpacity style={styles.syncButton}>
                <Text style={styles.syncIcon}>🔄</Text>
                <Text style={styles.syncText}>Sync</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Site Info Overlay */}
        <View style={styles.siteInfoOverlay}>
          <Text style={styles.siteName}>{site.name}</Text>
          <View style={styles.siteMetaRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{site.location}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.distanceText}>{calculatedDistance || site.distance}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({totalReviews} reviews)</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Basic Info */}
        <Card style={styles.infoCard}>
          <CardContent style={{
            ...styles.infoCardContent,
            paddingTop: 16,
            paddingBottom: 16
          }}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{site.description}</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🕐</Text>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Opening Hours</Text>
                  <Text style={styles.infoValue}>{site.openingHours || site.visiting_hours}</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💰</Text>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Entrance Fee</Text>
                  <Text style={styles.infoValue}>{site.entranceFee || site.entry_fee}</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📱</Text>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Badge style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{site.category}</Text>
                  </Badge>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.primaryActionButton, isGettingDirections && styles.disabledButton]} 
            onPress={handleGetDirections}
            disabled={isGettingDirections}
          >
            <Text style={styles.actionButtonIcon}>{isGettingDirections ? '⏳' : '🧭'}</Text>
            <Text style={styles.actionButtonText}>
              {isGettingDirections ? 'Getting Directions...' : 'Get Directions'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryActionButton} onPress={handleBookRide}>
            <Text style={styles.actionButtonIcon}>🚗</Text>
            <Text style={styles.secondaryActionButtonText}>Book Ride</Text>
          </TouchableOpacity>
        </View>

        {/* Visit Status */}
        <Card style={styles.statusCard}>
          <CardContent style={{
            ...styles.statusCardContent,
            paddingTop: 16,
            paddingBottom: 16
          }}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Visit Status:</Text>
              <Select
                value={isVisited ? 'visited' : isPlanned ? 'planned' : 'not-visited'}
                onValueChange={(value) => onVisitStatusChange(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visited">Visited</SelectItem>
                  <SelectItem value="not-visited">Not Visited</SelectItem>
                  <SelectItem value="planned">Plan to Visit</SelectItem>
                </SelectContent>
              </Select>
            </View>
          </CardContent>
        </Card>

        {/* Gallery Preview */}
        {(() => {
          // Handle different gallery data formats
          let galleryImages: string[] = [];
          
          if (Array.isArray(site.gallery)) {
            galleryImages = site.gallery;
          } else if (typeof site.gallery === 'string') {
            // If gallery is a string, try to parse it as JSON or split by comma
            try {
              const parsed = JSON.parse(site.gallery);
              galleryImages = Array.isArray(parsed) ? parsed : [site.gallery];
            } catch {
              // If parsing fails, treat as comma-separated string
              galleryImages = site.gallery.split(',').map(url => url.trim()).filter(url => url.length > 0);
            }
          }
          
          console.log('🖼️ Gallery processing:', {
            originalGallery: site.gallery,
            processedImages: galleryImages,
            imageCount: galleryImages.length
          });
          
          return galleryImages.length > 0 ? (
            <Card style={styles.galleryCard}>
              <CardContent style={{
                ...styles.galleryCardContent,
                paddingTop: 16,
                paddingBottom: 16
              }}>
                <Text style={styles.sectionTitle}>Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                  {galleryImages.map((imageUrl, index) => {
                    console.log(`🖼️ Gallery image ${index}:`, imageUrl);
                    return (
                      <Image
                        key={index}
                        source={{ uri: imageUrl }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                        onError={(error) => console.log(`❌ Gallery image ${index} error:`, error)}
                      />
                    );
                  })}
                </ScrollView>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {/* Reviews Summary */}
        <Card style={styles.reviewsCard}>
          <CardContent style={{
            ...styles.reviewsCardContent,
            paddingTop: 16,
            paddingBottom: 16
          }}>
            <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            <View style={styles.reviewsSummary}>
              <View style={styles.overallRating}>
                <Text style={styles.overallRatingNumber}>{averageRating.toFixed(1)}</Text>
                <Text style={styles.overallRatingStars}>
                  {'⭐'.repeat(Math.floor(averageRating))}
                  {averageRating % 1 >= 0.5 ? '⭐' : ''}
                </Text>
                <Text style={styles.totalReviewsText}>{totalReviews} reviews</Text>
              </View>
            </View>
            
            {/* Recent Reviews */}
            <View style={styles.recentReviews}>
              {reviews.slice(0, 2).map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerAvatarText}>{review.avatar}</Text>
                    </View>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.author}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerImageContainer: {
    height: 256,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    position: 'absolute',
    top: 40, // Safe area
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionIcon: {
    fontSize: 20,
  },
  favoriteIcon: {
    color: '#EF4444',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FEF3C7', // amber-100
    borderWidth: 1,
    borderColor: '#FCD34D', // amber-300
    borderRadius: 8,
    padding: 12,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineIcon: {
    fontSize: 16,
  },
  offlineText: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E', // amber-800
  },
  offlineSubtitle: {
    fontSize: 12,
    color: '#B45309', // amber-700
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FCD34D', // amber-300
    borderRadius: 4,
  },
  syncIcon: {
    fontSize: 12,
  },
  syncText: {
    fontSize: 12,
    color: '#B45309', // amber-700
  },
  siteInfoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 16,
  },
  siteName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  siteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  separator: {
    fontSize: 14,
    color: '#9CA3AF', // gray-400
  },
  distanceText: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
  },
  infoCardContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151', // gray-700
    lineHeight: 20,
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EA580C', // orange-600
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151', // gray-700
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
  },
  statusCardContent: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  visitedBadge: {
    backgroundColor: '#DCFCE7', // green-100
  },
  visitedBadgeText: {
    color: '#166534', // green-800
    fontSize: 14,
  },
  markVisitedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EA580C', // orange-600
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markVisitedText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  galleryCard: {
    backgroundColor: '#FFFFFF',
  },
  galleryCardContent: {
    padding: 16,
  },
  galleryScroll: {
    marginTop: 8,
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  reviewsCard: {
    backgroundColor: '#FFFFFF',
  },
  reviewsCardContent: {
    padding: 16,
  },
  reviewsSummary: {
    marginBottom: 16,
  },
  overallRating: {
    alignItems: 'center',
  },
  overallRatingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  overallRatingStars: {
    fontSize: 16,
    marginVertical: 4,
  },
  totalReviewsText: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  recentReviews: {
    gap: 12,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // gray-100
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FED7AA', // orange-100
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reviewerAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C2410C', // orange-700
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151', // gray-700
    lineHeight: 20,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  mapBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mapBackIcon: {
    fontSize: 20,
    color: '#4B5563', // gray-600
  },
  mapHeaderInfo: {
    flex: 1,
  },
  mapHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  mapHeaderDistance: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  fullScreenMap: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#D1D5DB', // gray-300
  },
});