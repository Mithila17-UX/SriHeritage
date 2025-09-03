import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Share, Modal, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import * as Location from 'expo-location';
// Note: Replace lucide-react icons with React Native compatible icons
// Note: Tabs, Avatar, Textarea components would need React Native conversion
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { Avatar, AvatarFallback } from './ui/avatar';
// import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getSitesFromFirestore, FirestoreSite } from '../services/firebase';
import { DistanceCalculatorService } from '../services/distanceCalculator';
import { routingServiceOSM } from '../services/routingServiceOSM';
import { LeafletPageService } from '../services/leafletPage';
import { reviewService, Review as FirestoreReview, SiteRatingStats } from '../services/reviewService';
import { authService } from '../services/auth';

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
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [isGettingDirections, setIsGettingDirections] = useState(false);

  // New state for reviews and ratings
  const [firestoreReviews, setFirestoreReviews] = useState<FirestoreReview[]>([]);
  const [siteRatingStats, setSiteRatingStats] = useState<SiteRatingStats | null>(null);
  const [userExistingReview, setUserExistingReview] = useState<FirestoreReview | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);

  // Ref to prevent unnecessary re-renders during form interactions
  const isFormInteractionRef = useRef(false);

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

  // Use the actual site rating from Firestore or fall back to admin panel rating
  const averageRating = siteRatingStats?.averageRating || site.rating || 4.5;
  const totalReviews = siteRatingStats?.totalReviews || firestoreReviews.length || 0;

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
        await calculateDistanceFromUser(location); // Make this async
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

  // Calculate distance from user location to site using road distance
  const calculateDistanceFromUser = async (location: Location.LocationObject) => {
    const siteLat = site.latitude || site.coordinates?.latitude;
    const siteLon = site.longitude || site.coordinates?.longitude;
    
    if (siteLat && siteLon) {
      try {
        // Calculate both direct and road distance
        const distanceInfo = await DistanceCalculatorService.calculateDistanceFromUserLocation(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          {
            latitude: siteLat,
            longitude: siteLon
          },
          true // Use road distance
        );

        // Display road distance if available, otherwise direct distance
        if (distanceInfo.roadDistance !== null) {
          let distanceText = `${distanceInfo.roadDistance.toFixed(1)} km away`;
          
          // Add estimated time if available
          if (distanceInfo.estimatedTime) {
            const hours = Math.floor(distanceInfo.estimatedTime / 60);
            const minutes = distanceInfo.estimatedTime % 60;
            
            if (hours > 0) {
              distanceText += ` (${hours}h ${minutes}m)`;
            } else {
              distanceText += ` (${minutes}m)`;
            }
          }
          
          distanceText += ' via road';
          setCalculatedDistance(distanceText);
        } else {
          // Fallback to direct distance
          setCalculatedDistance(`${distanceInfo.directDistance.toFixed(1)} km away (direct)`);
        }
        
        console.log('📍 Distance calculated:', {
          direct: distanceInfo.directDistance,
          road: distanceInfo.roadDistance,
          time: distanceInfo.estimatedTime
        });
        
      } catch (error) {
        console.error('❌ Error calculating road distance:', error);
        // Fallback to simple direct distance calculation
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          siteLat,
          siteLon
        );
        setCalculatedDistance(`${distance.toFixed(1)} km away (direct)`);
      }
    } else {
      setCalculatedDistance(site.distance || 'Distance unavailable');
    }
  };

  // Generate route coordinates using OSRM (OpenStreetMap routing)
  const generateRouteCoordinates = async (startLat: number, startLon: number, endLat: number, endLon: number): Promise<{ coordinates: RouteCoordinates[]; isFallback: boolean; }> => {
    try {
      console.log('🗺️ Getting route from OSRM (OpenStreetMap)...');
      const route = await routingServiceOSM.getRoute(
        { latitude: startLat, longitude: startLon },
        { latitude: endLat, longitude: endLon },
        { mode: 'driving', fallbackToStraightLine: true }
      );

      if (route && route.coordinates.length > 0) {
        console.log('✅ Route obtained from OSM with', route.coordinates.length, 'points');
        console.log('🛣️ Route info:', {
          distance: route.distance + 'km',
          duration: route.duration + 'min',
          isFallback: route.isFallback
        });
        
        return {
          coordinates: route.coordinates.map((coord: any) => ({
            latitude: coord.latitude,
            longitude: coord.longitude
          })),
          isFallback: route.isFallback || false
        };
      } else {
        console.warn('⚠️ No route found from OSRM, using fallback');
      }
    } catch (error) {
      console.error('❌ Error getting route from OSRM:', error);
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
    
    console.log('📍 Using fallback straight-line route with', coordinates.length, 'points');
    return { coordinates, isFallback: true };
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

  // Load reviews and rating statistics - memoized to prevent unnecessary re-renders
  const loadReviewsAndRating = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      console.log('⚠️ User not authenticated, skipping review loading');
      return;
    }

    setIsLoadingReviews(true);
    try {
      // Load reviews for the site
      const reviews = await reviewService.getReviewsForSite(site.id);
      setFirestoreReviews(reviews);

      // Load rating statistics
      const stats = await reviewService.getSiteRatingStats(site.id);
      setSiteRatingStats(stats);

      // Check if current user has already reviewed this site
      const userReview = await reviewService.getUserReviewForSite(site.id);
      setUserExistingReview(userReview);

      // If user has existing review, populate the form ONLY if form is not currently being edited
      if (userReview && !showReviewForm) {
        setUserRating(userReview.rating);
        setUserComment(userReview.comment);
        setUserAspectRatings(userReview.aspectRatings || {});
      }

      console.log(`📖 Loaded ${reviews.length} reviews for site ${site.id}`);
    } catch (error) {
      console.error('❌ Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setIsLoadingReviews(false);
    }
  }, [site.id]); // Remove showReviewForm dependency to prevent re-loading during form editing

  // Load initial data when component mounts or site changes
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadReviewsAndRating();
    }
  }, [loadReviewsAndRating]);

  // Handle auth state changes separately to avoid interference with form state
  useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChanged((user) => {
      if (user) {
        // Only reload if we don't have review data yet
        if (firestoreReviews.length === 0 && !isLoadingReviews) {
          loadReviewsAndRating();
        }
      } else {
        // Clear review data when user logs out
        setFirestoreReviews([]);
        setSiteRatingStats(null);
        setUserExistingReview(null);
        // Only reset form if it's not currently being used
        if (!showReviewForm) {
          setUserRating(0);
          setUserComment('');
          setUserAspectRatings({});
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [loadReviewsAndRating]); // Only depend on loadReviewsAndRating

  // Handle submitting a new review or updating existing review - memoized to prevent re-renders
  const handleSubmitReview = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      Alert.alert('Authentication Required', 'Please log in to submit a review.');
      return;
    }

    if (userRating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating for this site.');
      return;
    }

    if (userComment.trim().length < 10) {
      Alert.alert('Comment Required', 'Please provide a comment with at least 10 characters.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      if (userExistingReview) {
        // Update existing review
        await reviewService.updateReview(
          userExistingReview.id,
          userRating,
          userComment,
          userAspectRatings
        );
        Alert.alert('Success', 'Your review has been updated successfully!');
        setIsEditingReview(false);
      } else {
        // Add new review
        await reviewService.addReview(
          site.id,
          userRating,
          userComment,
          userAspectRatings
        );
        Alert.alert('Success', 'Thank you for your review!');
      }

      // Reset form and reload reviews
      setShowReviewForm(false);
      await loadReviewsAndRating();
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [userRating, userComment, userAspectRatings, userExistingReview, site.id, loadReviewsAndRating]);

  // Handle deleting user's review - memoized to prevent re-renders
  const handleDeleteReview = useCallback(async () => {
    if (!userExistingReview) return;

    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewService.deleteReview(userExistingReview.id);
              Alert.alert('Success', 'Your review has been deleted.');
              
              // Reset form and reload reviews
              setUserRating(0);
              setUserComment('');
              setUserAspectRatings({});
              setIsEditingReview(false);
              setShowReviewForm(false);
              await loadReviewsAndRating();
            } catch (error) {
              console.error('❌ Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review. Please try again.');
            }
          }
        }
      ]
    );
  }, [userExistingReview, loadReviewsAndRating]);

  // Handle marking a review as helpful - memoized to prevent re-renders
  const handleMarkHelpful = useCallback(async (reviewId: string) => {
    try {
      await reviewService.markReviewHelpful(reviewId);
      // Reload reviews to show updated helpful count
      await loadReviewsAndRating();
    } catch (error) {
      console.error('❌ Error marking review as helpful:', error);
      Alert.alert('Error', 'Failed to mark review as helpful.');
    }
  }, [loadReviewsAndRating]);

  // Reset review form - memoized to prevent re-renders
  const resetReviewForm = useCallback(() => {
    if (!userExistingReview) {
      setUserRating(0);
      setUserComment('');
      setUserAspectRatings({});
    } else {
      // Reset to existing review values
      setUserRating(userExistingReview.rating);
      setUserComment(userExistingReview.comment);
      setUserAspectRatings(userExistingReview.aspectRatings || {});
    }
    setIsEditingReview(false);
    setShowReviewForm(false);
  }, [userExistingReview]);

  // Set aspect rating - memoized to prevent re-renders
  const setAspectRating = useCallback((aspect: string, rating: number) => {
    isFormInteractionRef.current = true;
    setUserAspectRatings(prev => ({ ...prev, [aspect]: rating }));
  }, []);

  // Memoized handlers for form inputs to prevent re-renders
  const handleRatingChange = useCallback((rating: number) => {
    isFormInteractionRef.current = true;
    setUserRating(rating);
  }, []);

  const handleCommentChange = useCallback((text: string) => {
    isFormInteractionRef.current = true;
    setUserComment(text);
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
          await calculateDistanceFromUser(location); // Make this async
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

      // Generate route coordinates using OSRM (OpenStreetMap routing)
      const routeResult = await generateRouteCoordinates(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        siteLat,
        siteLon
      );
      
      console.log('🗺️ Setting route coordinates:', routeResult.coordinates.length, 'points');
      if (routeResult.coordinates.length > 0) {
        console.log('📍 Route start:', routeResult.coordinates[0]);
        console.log('🎯 Route end:', routeResult.coordinates[routeResult.coordinates.length - 1]);
      }
      setRouteCoordinates(routeResult.coordinates);

      // Prepare map configuration for WebView
      const config: MapConfig = {
        userLocation: {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        destination: {
          latitude: siteLat,
          longitude: siteLon,
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
      setShowMapModal(true);
      console.log('✅ Map modal opened with OpenStreetMap directions');
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

  // Star Rating Component - memoized to prevent unnecessary re-renders
  const StarRating = React.memo(({ rating, onRatingChange, editable = false, size = 20 }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    editable?: boolean;
    size?: number;
  }) => {
    const handleStarPress = useCallback((starRating: number) => {
      if (editable && onRatingChange) {
        onRatingChange(starRating);
      }
    }, [editable, onRatingChange]);

    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          disabled={!editable}
          style={styles.starButton}
        >
          <Text style={[styles.star, { fontSize: size, color: i <= rating ? '#FFD700' : '#E5E7EB' }]}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  });

  // Review Form Modal - Memoized component to prevent unnecessary re-renders
  const ReviewFormModal = React.memo(() => (
    <Modal
      visible={showReviewForm}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.reviewFormContainer}>
        <View style={styles.reviewFormHeader}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetReviewForm}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.reviewFormTitle}>
            {userExistingReview ? 'Edit Review' : 'Write a Review'}
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, isSubmittingReview && styles.disabledSubmitButton]}
            onPress={handleSubmitReview}
            disabled={isSubmittingReview}
          >
            <Text style={styles.submitButtonText}>
              {isSubmittingReview ? 'Saving...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.reviewFormContent}>
          {/* Overall Rating */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Overall Rating *</Text>
            <View style={styles.ratingSection}>
              <StarRating 
                rating={userRating} 
                onRatingChange={handleRatingChange} 
                editable={true} 
                size={32}
              />
              <Text style={styles.ratingText}>
                {userRating > 0 ? `${userRating} out of 5 stars` : 'Tap to rate'}
              </Text>
            </View>
          </View>

          {/* Comment */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Your Review *</Text>
            <TextInput
              style={styles.commentInput}
              value={userComment}
              onChangeText={handleCommentChange}
              placeholder="Share your experience at this heritage site..."
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {userComment.length}/500 characters
            </Text>
          </View>

          {/* Aspect Ratings */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Rate Specific Aspects</Text>
            {aspectCategories.map((category) => (
              <View key={category.aspect} style={styles.aspectRatingRow}>
                <View style={styles.aspectInfo}>
                  <Text style={styles.aspectIcon}>{category.icon}</Text>
                  <View style={styles.aspectText}>
                    <Text style={styles.aspectName}>{category.aspect}</Text>
                    <Text style={styles.aspectDescription}>{category.description}</Text>
                  </View>
                </View>
                <StarRating
                  rating={userAspectRatings[category.aspect] || 0}
                  onRatingChange={(rating) => setAspectRating(category.aspect, rating)}
                  editable={true}
                  size={16}
                />
              </View>
            ))}
          </View>

          {/* Delete button for existing reviews */}
          {userExistingReview && (
            <View style={styles.formSection}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteReview}
              >
                <Text style={styles.deleteButtonText}>Delete Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  ));

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

          {/* WebView with Leaflet Map */}
          {mapConfig && (
            <WebView
              style={styles.fullScreenMap}
              source={{ 
                html: LeafletPageService.generateMapHTML(mapConfig)
              }}
              javaScriptEnabled={true}
              allowFileAccess={false}
              allowFileAccessFromFileURLs={false}
              allowUniversalAccessFromFileURLs={false}
              mixedContentMode="never"
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert('Map Error', 'Failed to load map. Please try again.');
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView HTTP error:', nativeEvent);
              }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  console.log('Message from WebView:', data);
                } catch (error) {
                  console.log('WebView message:', event.nativeEvent.data);
                }
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.mapLoadingContainer}>
                  <Text style={styles.mapLoadingText}>Loading map...</Text>
                </View>
              )}
            />
          )}
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

        {/* Reviews & Ratings */}
        <Card style={styles.reviewsCard}>
          <CardContent style={{
            ...styles.reviewsCardContent,
            paddingTop: 16,
            paddingBottom: 0
          }}>
            <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            
            {/* Rating Summary */}
            <View style={styles.reviewsSummary}>
              <View style={styles.overallRating}>
                <Text style={styles.overallRatingNumber}>{averageRating.toFixed(1)}</Text>
                <StarRating rating={averageRating} size={20} />
                <Text style={styles.totalReviewsText}>
                  {totalReviews === 1 ? '1 review' : `${totalReviews} reviews`}
                </Text>
              </View>
            </View>

            {/* User's Existing Review */}
            {userExistingReview && (
              <View style={styles.existingReviewSection}>
                <View style={styles.existingReviewHeader}>
                  <Text style={styles.existingReviewTitle}>Your Review</Text>
                  <TouchableOpacity
                    style={styles.editReviewButton}
                    onPress={() => {
                      setIsEditingReview(true);
                      setShowReviewForm(true);
                    }}
                  >
                    <Text style={styles.editReviewButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.existingReviewRating}>
                  <StarRating rating={userExistingReview.rating} size={16} />
                  <Text style={styles.reviewRating}>({userExistingReview.rating}/5)</Text>
                </View>
                <Text style={styles.existingReviewComment}>
                  {userExistingReview.comment}
                </Text>
              </View>
            )}

            {/* Add Review Section */}
            {authService.isAuthenticated() && !userExistingReview && (
              <View style={styles.addReviewSection}>
                <TouchableOpacity
                  style={[styles.addReviewButton, isSubmittingReview && styles.addReviewButtonDisabled]}
                  onPress={() => setShowReviewForm(true)}
                  disabled={isSubmittingReview}
                >
                  <Text style={styles.addReviewButtonIcon}>✍️</Text>
                  <Text style={styles.addReviewButtonText}>Write a Review</Text>
                </TouchableOpacity>
              </View>
            )}

            {!authService.isAuthenticated() && (
              <View style={styles.addReviewSection}>
                <Text style={styles.loadingText}>Sign in to write a review</Text>
              </View>
            )}

            {/* Loading State */}
            {isLoadingReviews && (
              <Text style={styles.loadingText}>Loading reviews...</Text>
            )}

            {/* Recent Reviews from Firestore */}
            {firestoreReviews.length > 0 && (
              <View style={styles.recentReviews}>
                <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8, marginTop: 16 }]}>
                  Recent Reviews
                </Text>
                {firestoreReviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerAvatarText}>
                          {review.userDisplayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>{review.userDisplayName}</Text>
                        <Text style={styles.reviewDate}>
                          {review.createdAt.toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <StarRating rating={review.rating} size={14} />
                        <Text style={styles.reviewRating}>({review.rating}/5)</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    
                    {/* Helpful Button - only for other users' reviews */}
                    {authService.getCurrentUser()?.uid !== review.userId && (
                      <TouchableOpacity
                        style={styles.helpfulButton}
                        onPress={() => handleMarkHelpful(review.id)}
                      >
                        <Text style={styles.helpfulButtonText}>👍 Helpful ({review.helpful})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                {firestoreReviews.length > 3 && (
                  <Text style={styles.loadingText}>
                    {firestoreReviews.length - 3} more reviews available
                  </Text>
                )}
              </View>
            )}

            {/* Fallback to hardcoded reviews if no Firestore reviews */}
            {!isLoadingReviews && firestoreReviews.length === 0 && (
              <View style={styles.recentReviews}>
                <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8, marginTop: 16 }]}>
                  Sample Reviews
                </Text>
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
            )}
          </CardContent>
        </Card>

        {/* Review Form Modal */}
        <ReviewFormModal />
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
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  mapLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#D1D5DB', // gray-300
  },
  // Star Rating Styles
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  star: {
    fontSize: 20,
  },
  // Review Form Styles
  reviewFormContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  reviewFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280', // gray-500
  },
  reviewFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  submitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EA580C', // orange-600
    borderRadius: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledSubmitButton: {
    opacity: 0.6,
    backgroundColor: '#D1D5DB', // gray-300
  },
  reviewFormContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 12,
  },
  ratingSection: {
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280', // gray-500
    textAlign: 'right',
    marginTop: 4,
  },
  aspectRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // gray-100
  },
  aspectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  aspectIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  aspectText: {
    flex: 1,
  },
  aspectName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  aspectDescription: {
    fontSize: 12,
    color: '#6B7280', // gray-500
    marginTop: 2,
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EF4444', // red-500
    borderRadius: 8,
    alignSelf: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // New Review Section Styles
  addReviewSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    backgroundColor: '#F9FAFB', // gray-50
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EA580C', // orange-600
    borderRadius: 8,
  },
  addReviewButtonDisabled: {
    backgroundColor: '#D1D5DB', // gray-300
  },
  addReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addReviewButtonIcon: {
    fontSize: 16,
  },
  existingReviewSection: {
    padding: 16,
    backgroundColor: '#F0FDF4', // green-50
    borderWidth: 1,
    borderColor: '#BBF7D0', // green-200
    borderRadius: 8,
    marginBottom: 16,
  },
  existingReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  existingReviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534', // green-800
  },
  editReviewButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EA580C', // orange-600
    borderRadius: 4,
  },
  editReviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  existingReviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  existingReviewComment: {
    fontSize: 14,
    color: '#166534', // green-800
    lineHeight: 20,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6', // gray-100
    borderRadius: 4,
    marginTop: 8,
  },
  helpfulButtonText: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280', // gray-500
    textAlign: 'center',
    padding: 16,
  },
});