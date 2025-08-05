import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, FlatList } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService, syncService, authService, Site } from '../services';
// Note: Replace lucide-react icons with React Native compatible icons
// import { MapPin, Navigation, Star, Search, Filter, Heart, Eye, SortAsc } from 'lucide-react';
// import { ImageWithFallback } from './figma/ImageWithFallback';

interface AllPlacesScreenProps {
  user: { name: string; email: string } | null;
  onNavigateToSite: (site: any) => void;
}

const defaultPlaces: any[] = [];

const districts = [
  'All Districts',
  'Kandy',
  'Matale',
  'Galle',
  'Polonnaruwa',
  'Anuradhapura',
  'Badulla',
  'Hambantota'
];

export function AllPlacesScreen({ user, onNavigateToSite }: AllPlacesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [sortBy, setSortBy] = useState('proximity');
  const [allPlaces, setAllPlaces] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteSites, setFavoriteSites] = useState<number[]>([]);
  const [visitedSites, setVisitedSites] = useState<number[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize and load data - bypassing SQLite due to corruption
  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        setLoading(true);
        console.log('🏛️ AllPlacesScreen: Starting initialization...');
        console.log('🔍 Current allPlaces length:', allPlaces.length);
        
        // Get current user ID
        const userId = await AsyncStorage.getItem('userId') || authService.getCurrentUserId();
        setCurrentUserId(userId);
        console.log('👤 Current user ID:', userId);
        
        // Try to load from Firestore directly (bypassing SQLite)
        console.log('🔄 Attempting direct Firestore fetch...');
        let sitesToDisplay = [];
        
        try {
          const { firestore } = await import('../services/firebase');
          const { collection, getDocs } = await import('firebase/firestore');
          
          const sitesCollection = collection(firestore, 'sites');
          const sitesSnapshot = await getDocs(sitesCollection);
          
          console.log('📊 Firestore direct query result:', sitesSnapshot.size, 'documents');
          
          if (sitesSnapshot.size > 0) {
            const firestoreSites: any[] = [];
            sitesSnapshot.forEach((doc) => {
              const data = doc.data();
              console.log('📄 Processing Firestore document:', doc.id, data);
              
              // Handle ID more robustly
              let siteId: number;
              if (!isNaN(parseInt(doc.id))) {
                siteId = parseInt(doc.id);
              } else {
                // If doc.id is not a number, generate a hash-based ID
                siteId = Math.abs(doc.id.split('').reduce((a, b) => {
                  a = ((a << 5) - a) + b.charCodeAt(0);
                  return a & a;
                }, 0));
              }
              
              const siteData = {
                id: siteId,
                name: data.name || '',
                description: data.description || '',
                location: data.location || '',
                latitude: data.coordinates?.latitude || data.latitude || 0,
                longitude: data.coordinates?.longitude || data.longitude || 0,
                category: data.category || '',
                image_url: data.image || data.image_url || '',
                historical_period: data.historical_period || '',
                significance: data.significance || '',
                visiting_hours: data.openingHours || data.visiting_hours || '',
                entry_fee: data.entranceFee || data.entry_fee || '',
                // Admin panel compatibility fields
                district: data.district || '',
                distance: data.distance || `${(Math.random() * 100).toFixed(1)} km`,
                rating: data.rating || 4.5,
                image: data.image || data.image_url || '',
                openingHours: data.openingHours || data.visiting_hours || '',
                entranceFee: data.entranceFee || data.entry_fee || '',
                gallery: data.gallery ? (Array.isArray(data.gallery) ? data.gallery : []) : [],
                updated_at: new Date().toISOString() // Mark as from Firestore
              };
              
              firestoreSites.push(siteData);
            });
            
            // Combine with default places (but prioritize Firestore data)
            const defaultSitesNotInFirestore = defaultPlaces.filter(
              defaultSite => !firestoreSites.some(fSite => 
                fSite.name.toLowerCase() === defaultSite.name.toLowerCase()
              )
            );
            
            sitesToDisplay = [...firestoreSites, ...defaultSitesNotInFirestore];
            console.log('✅ Combined sites from Firestore + defaults:', sitesToDisplay.length);
            
            // Cache the sites in AsyncStorage for offline use
            try {
              await AsyncStorage.setItem('cached_sites', JSON.stringify(sitesToDisplay));
              console.log('✅ Sites cached in AsyncStorage');
            } catch (cacheError) {
              console.warn('⚠️ Failed to cache sites:', cacheError);
            }
          } else {
            console.log('⚠️ No sites in Firestore, using defaults');
            sitesToDisplay = defaultPlaces.map((site: any) => ({
              ...site,
              latitude: (site as any).latitude || 0,
              longitude: (site as any).longitude || 0,
              created_at: (site as any).created_at || new Date().toISOString(),
              updated_at: (site as any).updated_at || new Date().toISOString(),
              gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
            }));
          }
        } catch (firestoreError) {
          console.error('❌ Firestore direct fetch failed:', firestoreError);
          console.log('🔄 Trying cached data from AsyncStorage...');
          
          // Try to load cached data
          try {
            const cachedSites = await AsyncStorage.getItem('cached_sites');
            if (cachedSites) {
              sitesToDisplay = JSON.parse(cachedSites);
              console.log('✅ Loaded cached sites:', sitesToDisplay.length);
            } else {
              console.log('⚠️ No cached data, using defaults');
              sitesToDisplay = defaultPlaces.map((site: any) => ({
                ...site,
                latitude: (site as any).latitude || 0,
                longitude: (site as any).longitude || 0,
                created_at: (site as any).created_at || new Date().toISOString(),
                updated_at: (site as any).updated_at || new Date().toISOString(),
                gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
              }));
            }
          } catch (cacheError) {
            console.error('❌ Failed to load cached data:', cacheError);
            sitesToDisplay = defaultPlaces.map((site: any) => ({
              ...site,
              latitude: (site as any).latitude || 0,
              longitude: (site as any).longitude || 0,
              created_at: (site as any).created_at || new Date().toISOString(),
              updated_at: (site as any).updated_at || new Date().toISOString(),
              gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
            }));
          }
        }
        
        // Format sites for display
        const formattedSites = sitesToDisplay.map((site: any) => ({
          ...site,
          distance: site.distance || `${(Math.random() * 100).toFixed(1)} km`,
          rating: site.rating || 4.5,
          image: site.image || site.image_url || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
          openingHours: site.openingHours || site.visiting_hours || 'Daily: 6:00 AM - 6:00 PM',
          entranceFee: site.entranceFee || site.entry_fee || 'Free entry',
          gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : []),
          latitude: site.latitude || 0,
          longitude: site.longitude || 0,
          created_at: site.created_at || new Date().toISOString(),
          updated_at: site.updated_at || new Date().toISOString()
        }));
        
        setAllPlaces(formattedSites);
        console.log('✅ Sites set for display:', formattedSites.length);
        console.log('🔍 Formatted sites data:', formattedSites.map(site => ({ id: site.id, name: site.name })));
        
        // Load user preferences from AsyncStorage (bypassing SQLite)
        if (userId) {
          try {
            const favoritesKey = `favorites_${userId}`;
            const visitedKey = `visited_${userId}`;
            
            const [cachedFavorites, cachedVisited] = await Promise.all([
              AsyncStorage.getItem(favoritesKey),
              AsyncStorage.getItem(visitedKey)
            ]);
            
            const favoriteIds = cachedFavorites ? JSON.parse(cachedFavorites) : [];
            const visitedIds = cachedVisited ? JSON.parse(cachedVisited) : [];
            
            setFavoriteSites(favoriteIds);
            setVisitedSites(visitedIds);
            console.log('✅ User preferences loaded from AsyncStorage - Favorites:', favoriteIds.length, 'Visited:', visitedIds.length);
          } catch (prefsError) {
            console.error('❌ Failed to load user preferences:', prefsError);
            setFavoriteSites([]);
            setVisitedSites([]);
          }
        }
        
      } catch (error) {
        console.error('❌ Error initializing AllPlacesScreen:', error);
        console.log('🔄 Using default places as final fallback');
        setAllPlaces(defaultPlaces.map((site: any) => ({
          ...site,
          latitude: (site as any).latitude || 0,
          longitude: (site as any).longitude || 0,
          created_at: (site as any).created_at || new Date().toISOString(),
          updated_at: (site as any).updated_at || new Date().toISOString(),
          gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
        })));
      } finally {
        setLoading(false);
        console.log('✅ AllPlacesScreen initialization complete');
      }
    };

    initializeAndLoadData();
  }, []);

  // Handle favorite toggle - using AsyncStorage instead of SQLite
  const handleToggleFavorite = async (siteId: number) => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please log in to add favorites');
      return;
    }

    try {
      const isFavorite = favoriteSites.includes(siteId);
      const favoritesKey = `favorites_${currentUserId}`;
      
      let updatedFavorites;
      if (isFavorite) {
        updatedFavorites = favoriteSites.filter(id => id !== siteId);
        setFavoriteSites(updatedFavorites);
      } else {
        updatedFavorites = [...favoriteSites, siteId];
        setFavoriteSites(updatedFavorites);
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));
      console.log('✅ Favorites updated in AsyncStorage:', updatedFavorites.length);
      
      // Try to sync to Firebase if online
      try {
        const { firestore } = await import('../services/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        
        const userRef = doc(firestore, 'users', currentUserId);
        await setDoc(userRef, {
          favoriteSites: updatedFavorites,
          favoritesLastSynced: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Favorites synced to Firebase');
      } catch (syncError) {
        console.warn('⚠️ Failed to sync favorites to Firebase:', syncError);
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Handle visited toggle - using AsyncStorage instead of SQLite
  const handleToggleVisited = async (siteId: number) => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please log in to mark as visited');
      return;
    }

    try {
      const isVisited = visitedSites.includes(siteId);
      const visitedKey = `visited_${currentUserId}`;
      
      let updatedVisited;
      if (isVisited) {
        updatedVisited = visitedSites.filter(id => id !== siteId);
        setVisitedSites(updatedVisited);
      } else {
        updatedVisited = [...visitedSites, siteId];
        setVisitedSites(updatedVisited);
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(visitedKey, JSON.stringify(updatedVisited));
      console.log('✅ Visited sites updated in AsyncStorage:', updatedVisited.length);
      
      // Try to sync to Firebase if online
      try {
        const { firestore } = await import('../services/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        
        const visitedData = updatedVisited.map(id => ({
          site_id: id,
          visited_at: new Date().toISOString(),
          notes: ''
        }));
        
        const userRef = doc(firestore, 'users', currentUserId);
        await setDoc(userRef, {
          visitedSites: visitedData,
          visitedLastSynced: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Visited sites synced to Firebase');
      } catch (syncError) {
        console.warn('⚠️ Failed to sync visited sites to Firebase:', syncError);
      }
    } catch (error) {
      console.error('❌ Error toggling visited:', error);
      Alert.alert('Error', 'Failed to update visited status');
    }
  };

  const filteredAndSortedPlaces = useMemo(() => {
    console.log('🔍 Filtering and sorting - allPlaces length:', allPlaces.length);
    console.log('🔍 Search query:', searchQuery);
    console.log('🔍 Selected district:', selectedDistrict);
    
    let filtered = allPlaces;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    // Filter by district
    if (selectedDistrict !== 'All Districts') {
      filtered = filtered.filter(place => place.district === selectedDistrict);
      console.log('🔍 After district filter:', filtered.length);
    }

    // Sort places
    let sorted;
    switch (sortBy) {
      case 'proximity':
        sorted = filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
      case 'rating':
        sorted = filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted = filtered;
    }
    
    console.log('🔍 Final filtered and sorted result:', sorted.length);
    return sorted;
  }, [allPlaces, searchQuery, selectedDistrict, sortBy]);

  const handleGetDirections = (place: any) => {
    Alert.alert('Directions', `Getting directions to ${place.name}...`);
  };

  // Check if we need to reload data (in case of navigation issues)
  if (!loading && allPlaces.length === 0) {
    console.log('🔄 No places loaded and not loading, this might indicate a navigation issue');
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>🏛️</Text>
          <Text style={styles.loadingTitle}>Loading Heritage Sites...</Text>
          <Text style={styles.loadingSubtitle}>Syncing with latest data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>All Places in Sri Lanka</Text>
            <Text style={styles.headerSubtitle}>Discover {allPlaces.length} heritage sites across the island</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={async () => {
                console.log('🔄 Database reset triggered');
                setLoading(true);
                try {
                  Alert.alert(
                    'Reset Database',
                    'This will reset the database and reload all data. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
                      { 
                        text: 'Reset', 
                        style: 'destructive', 
                        onPress: async () => {
                          try {
                            console.log('🔄 Resetting database...');
                            await databaseService.resetDatabase();
                            console.log('✅ Database reset complete');
                            
                            // Force sync from Firestore after reset
                            console.log('🔄 Syncing from Firestore after reset...');
                            await syncService.syncSitesFromFirestore();
                            
                            // Reload sites
                            const sites = await databaseService.getAllSites();
                            console.log('📊 Sites after reset and sync:', sites.length);
                            
                            if (sites.length === 0) {
                              setAllPlaces(defaultPlaces.map((site: any) => ({
                                ...site,
                                latitude: (site as any).latitude || 0,
                                longitude: (site as any).longitude || 0,
                                created_at: (site as any).created_at || new Date().toISOString(),
                                updated_at: (site as any).updated_at || new Date().toISOString(),
                                gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
                              })));
                            } else {
                              const formattedSites = sites.map((site: any) => ({
                                ...site,
                                distance: site.distance || `${(Math.random() * 100).toFixed(1)} km`,
                                rating: site.rating || 4.5,
                                image: site.image || site.image_url || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
                                openingHours: site.openingHours || site.visiting_hours || 'Daily: 6:00 AM - 6:00 PM',
                                entranceFee: site.entranceFee || site.entry_fee || 'Free entry',
                                gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : []),
                                latitude: site.latitude || 0,
                                longitude: site.longitude || 0,
                                created_at: site.created_at || new Date().toISOString(),
                                updated_at: site.updated_at || new Date().toISOString()
                              }));
                              setAllPlaces(formattedSites);
                            }
                            
                            Alert.alert('Success', 'Database reset and synced successfully!');
                          } catch (resetError) {
                            console.error('❌ Error resetting database:', resetError);
                            Alert.alert('Error', 'Failed to reset database. Using default data.');
                            setAllPlaces(defaultPlaces.map((site: any) => ({
                              ...site,
                              latitude: (site as any).latitude || 0,
                              longitude: (site as any).longitude || 0,
                              created_at: (site as any).created_at || new Date().toISOString(),
                              updated_at: (site as any).updated_at || new Date().toISOString(),
                              gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
                            })));
                          } finally {
                            setLoading(false);
                          }
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('❌ Error in reset flow:', error);
                  setLoading(false);
                }
              }}
              style={styles.resetButton}
            >
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={async () => {
                console.log('🔄 Manual refresh triggered');
                setLoading(true);
                
                try {
                  console.log('🔄 Refreshing from Firestore...');
                  
                  // Direct Firestore fetch
                  const { firestore } = await import('../services/firebase');
                  const { collection, getDocs } = await import('firebase/firestore');
                  
                  const sitesCollection = collection(firestore, 'sites');
                  const sitesSnapshot = await getDocs(sitesCollection);
                  
                  console.log('📊 Refresh - Firestore query result:', sitesSnapshot.size, 'documents');
                  
                  let sitesToDisplay = [];
                  
                  if (sitesSnapshot.size > 0) {
                    const firestoreSites: any[] = [];
                    sitesSnapshot.forEach((doc) => {
                      const data = doc.data();
                      console.log('📄 Refresh - Processing document:', doc.id, data);
                      
                      // Handle ID more robustly
                      let siteId: number;
                      if (!isNaN(parseInt(doc.id))) {
                        siteId = parseInt(doc.id);
                      } else {
                        siteId = Math.abs(doc.id.split('').reduce((a, b) => {
                          a = ((a << 5) - a) + b.charCodeAt(0);
                          return a & a;
                        }, 0));
                      }
                      
                      const siteData = {
                        id: siteId,
                        name: data.name || '',
                        description: data.description || '',
                        location: data.location || '',
                        latitude: data.coordinates?.latitude || data.latitude || 0,
                        longitude: data.coordinates?.longitude || data.longitude || 0,
                        category: data.category || '',
                        image_url: data.image || data.image_url || '',
                        district: data.district || '',
                        distance: data.distance || `${(Math.random() * 100).toFixed(1)} km`,
                        rating: data.rating || 4.5,
                        image: data.image || data.image_url || '',
                        openingHours: data.openingHours || data.visiting_hours || '',
                        entranceFee: data.entranceFee || data.entry_fee || '',
                        gallery: data.gallery ? (Array.isArray(data.gallery) ? data.gallery : []) : [],
                        updated_at: new Date().toISOString()
                      };
                      
                      firestoreSites.push(siteData);
                    });
                    
                    // Combine with defaults
                    const defaultSitesNotInFirestore = defaultPlaces.filter(
                      defaultSite => !firestoreSites.some(fSite => 
                        fSite.name.toLowerCase() === defaultSite.name.toLowerCase()
                      )
                    );
                    
                    sitesToDisplay = [...firestoreSites, ...defaultSitesNotInFirestore];
                    
                    // Update cache
                    await AsyncStorage.setItem('cached_sites', JSON.stringify(sitesToDisplay));
                    console.log('✅ Sites refreshed and cached:', sitesToDisplay.length);
                  } else {
                    sitesToDisplay = defaultPlaces.map((site: any) => ({
                      ...site,
                      latitude: (site as any).latitude || 0,
                      longitude: (site as any).longitude || 0,
                      created_at: (site as any).created_at || new Date().toISOString(),
                      updated_at: (site as any).updated_at || new Date().toISOString(),
                      gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
                    }));
                  }
                  
                  // Format and display
                  const formattedSites = sitesToDisplay.map((site: any) => ({
                    ...site,
                    distance: site.distance || `${(Math.random() * 100).toFixed(1)} km`,
                    rating: site.rating || 4.5,
                    image: site.image || site.image_url || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
                    openingHours: site.openingHours || site.visiting_hours || 'Daily: 6:00 AM - 6:00 PM',
                    entranceFee: site.entranceFee || site.entry_fee || 'Free entry',
                    gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : []),
                    latitude: site.latitude || 0,
                    longitude: site.longitude || 0,
                    created_at: site.created_at || new Date().toISOString(),
                    updated_at: site.updated_at || new Date().toISOString()
                  }));
                  
                  setAllPlaces(formattedSites);
                  console.log('✅ Refresh complete:', formattedSites.length, 'sites');
                  
                  Alert.alert('Success', 'Sites refreshed successfully!');
                } catch (error) {
                  console.error('❌ Error refreshing:', error);
                  Alert.alert('Error', 'Failed to refresh sites. Using cached data.');
                } finally {
                  setLoading(false);
                }
              }}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
            <Badge style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{filteredAndSortedPlaces.length} places</Text>
            </Badge>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Input
            placeholder="Search places, locations, or categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterIcon}>🔧</Text>
            <Text style={styles.filterLabel}>District:</Text>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict} style={styles.select}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterIcon}>📊</Text>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <Select value={sortBy} onValueChange={setSortBy} style={styles.selectSmall}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proximity">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </View>
        </ScrollView>
      </View>

      {/* Places List */}
      <View style={styles.listContainer}>
        {filteredAndSortedPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No places found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedDistrict !== 'All Districts'
                ? 'Try adjusting your search or filter criteria'
                : 'No heritage sites available at the moment'}
            </Text>
            <Button 
              variant="outline" 
              onPress={() => {
                setSearchQuery('');
                setSelectedDistrict('All Districts');
              }}
              style={styles.clearButton}
            >
              Clear Filters
            </Button>
            <Button 
              onPress={() => {
                console.log('🔄 Manual refresh from empty state triggered');
                setLoading(true);
                // Reload the component by forcing a re-render
                setAllPlaces([]);
                setTimeout(() => {
                  const initializeAndLoadData = async () => {
                    try {
                      setLoading(true);
                      console.log('🏛️ AllPlacesScreen: Starting initialization...');
                      
                      // Get current user ID
                      const userId = await AsyncStorage.getItem('userId') || authService.getCurrentUserId();
                      setCurrentUserId(userId);
                      
                      // Try to load from Firestore directly
                      let sitesToDisplay = [];
                      
                      try {
                        const { firestore } = await import('../services/firebase');
                        const { collection, getDocs } = await import('firebase/firestore');
                        
                        const sitesCollection = collection(firestore, 'sites');
                        const sitesSnapshot = await getDocs(sitesCollection);
                        
                        if (sitesSnapshot.size > 0) {
                          const firestoreSites: any[] = [];
                          sitesSnapshot.forEach((doc) => {
                            const data = doc.data();
                            let siteId: number;
                            if (!isNaN(parseInt(doc.id))) {
                              siteId = parseInt(doc.id);
                            } else {
                              siteId = Math.abs(doc.id.split('').reduce((a, b) => {
                                a = ((a << 5) - a) + b.charCodeAt(0);
                                return a & a;
                              }, 0));
                            }
                            
                            const siteData = {
                              id: siteId,
                              name: data.name || '',
                              description: data.description || '',
                              location: data.location || '',
                              latitude: data.coordinates?.latitude || data.latitude || 0,
                              longitude: data.coordinates?.longitude || data.longitude || 0,
                              category: data.category || '',
                              image_url: data.image || data.image_url || '',
                              district: data.district || '',
                              distance: data.distance || `${(Math.random() * 100).toFixed(1)} km`,
                              rating: data.rating || 4.5,
                              image: data.image || data.image_url || '',
                              openingHours: data.openingHours || data.visiting_hours || '',
                              entranceFee: data.entranceFee || data.entry_fee || '',
                              gallery: data.gallery ? (Array.isArray(data.gallery) ? data.gallery : []) : [],
                              updated_at: new Date().toISOString()
                            };
                            
                            firestoreSites.push(siteData);
                          });
                          
                          const defaultSitesNotInFirestore = defaultPlaces.filter(
                            defaultSite => !firestoreSites.some(fSite => 
                              fSite.name.toLowerCase() === defaultSite.name.toLowerCase()
                            )
                          );
                          
                          sitesToDisplay = [...firestoreSites, ...defaultSitesNotInFirestore];
                        } else {
                          sitesToDisplay = defaultPlaces.map((site: any) => ({
                            ...site,
                            latitude: (site as any).latitude || 0,
                            longitude: (site as any).longitude || 0,
                            created_at: (site as any).created_at || new Date().toISOString(),
                            updated_at: (site as any).updated_at || new Date().toISOString(),
                            gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
                          }));
                        }
                      } catch (firestoreError) {
                        console.error('❌ Firestore direct fetch failed:', firestoreError);
                        sitesToDisplay = defaultPlaces.map((site: any) => ({
                          ...site,
                          latitude: (site as any).latitude || 0,
                          longitude: (site as any).longitude || 0,
                          created_at: (site as any).created_at || new Date().toISOString(),
                          updated_at: (site as any).updated_at || new Date().toISOString(),
                          gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
                        }));
                      }
                      
                      const formattedSites = sitesToDisplay.map((site: any) => ({
                        ...site,
                        distance: site.distance || `${(Math.random() * 100).toFixed(1)} km`,
                        rating: site.rating || 4.5,
                        image: site.image || site.image_url || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
                        openingHours: site.openingHours || site.visiting_hours || 'Daily: 6:00 AM - 6:00 PM',
                        entranceFee: site.entranceFee || site.entry_fee || 'Free entry',
                        gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : []),
                        latitude: site.latitude || 0,
                        longitude: site.longitude || 0,
                        created_at: site.created_at || new Date().toISOString(),
                        updated_at: site.updated_at || new Date().toISOString()
                      }));
                      
                      setAllPlaces(formattedSites);
                    } catch (error) {
                      console.error('❌ Error initializing AllPlacesScreen:', error);
                      setAllPlaces(defaultPlaces.map((site: any) => ({
                        ...site,
                        latitude: (site as any).latitude || 0,
                        longitude: (site as any).longitude || 0,
                        created_at: (site as any).created_at || new Date().toISOString(),
                        updated_at: (site as any).updated_at || new Date().toISOString(),
                        gallery: Array.isArray(site.gallery) ? site.gallery : (typeof site.gallery === 'string' ? site.gallery.split(',').filter(Boolean) : [])
                      })));
                    } finally {
                      setLoading(false);
                    }
                  };
                  initializeAndLoadData();
                }, 100);
              }}
              style={styles.clearButton}
            >
              🔄 Refresh Data
            </Button>
          </View>
        ) : (
          <FlatList
            data={filteredAndSortedPlaces}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: place, index }) => {
              const isFavorite = favoriteSites.includes(place.id);
              const isVisited = visitedSites.includes(place.id);
              
              return (
                <TouchableOpacity onPress={() => onNavigateToSite(place)}>
                  <Card style={styles.placeCard}>
                    <CardContent style={styles.placeCardContent}>
                      <View style={styles.cardTopSection}>
                        <View style={styles.siteImageContainer}>
                          {place.image ? (
                            <Image
                              source={{ uri: place.image }}
                              style={styles.siteImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.noImagePlaceholder}>
                              <Text style={styles.noImageText}>📷</Text>
                            </View>
                          )}
                          {isVisited && (
                            <View style={[styles.badge, styles.visitedBadge]}>
                              <Text style={styles.badgeIcon}>👁️</Text>
                            </View>
                          )}
                          {isFavorite && (
                            <View style={[styles.badge, styles.favoriteBadge]}>
                              <Text style={styles.badgeIcon}>❤️</Text>
                            </View>
                          )}
                          {place.updated_at && place.updated_at.includes('17:47:20') && (
                            <View style={[styles.badge, styles.firestoreBadge]}>
                              <Text style={styles.badgeIcon}>🔥</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.siteInfo}>
                          <Text style={styles.siteName} numberOfLines={1}>{place.name}</Text>
                          <Text style={styles.siteDetailText}>{place.location}</Text>
                          <Text style={styles.siteDetailText}>{place.district}</Text>
                          <Text style={styles.siteDescription} numberOfLines={2}>{place.description}</Text>
                          <View style={styles.siteMetadata}>
                            <Badge style={styles.categoryBadge}>{place.category}</Badge>
                            <Text style={styles.rating}>⭐ {place.rating}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.siteActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(place.id);
                          }}
                          style={[styles.actionButton, isFavorite && styles.favoriteActiveButton]}
                        >
                          <Text style={[styles.actionButtonText, isFavorite && styles.favoriteActiveText]}>
                            {isFavorite ? '❤️ Favorited' : '🤍 Favorite'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleVisited(place.id);
                          }}
                          style={[styles.actionButton, isVisited && styles.visitedActiveButton]}
                        >
                          <Text style={[styles.actionButtonText, isVisited && styles.visitedActiveText]}>
                            {isVisited ? '👁️ Visited' : '📍 Mark Visited'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            onNavigateToSite({ ...place, id: place.id.toString() });
                          }}
                          style={styles.detailsButton}
                        >
                          <Text style={styles.detailsButtonText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#0D9488', // A vibrant teal color
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CCFBF1', // A light teal for the subtitle
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 50, 50, 0.4)',
    borderColor: 'rgba(255, 50, 50, 0.6)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#FFFFFF',
    fontSize: 14,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
    height: 60, // Set a fixed height for vertical centering
    justifyContent: 'center', // Center content vertically
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  select: {
    minWidth: 160,
  },
  selectSmall: {
    minWidth: 128,
  },
  listContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  placeCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    paddingTop: 16,
    paddingBottom: 16,
  },
  placeCardContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  siteImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  siteImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  noImageText: {
    fontSize: 30,
    color: '#9CA3AF',
  },
  badge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitedBadge: {
    top: 4,
    right: 4,
    backgroundColor: '#10B981',
  },
  favoriteBadge: {
    bottom: 4,
    right: 4,
    backgroundColor: '#EF4444',
  },
  firestoreBadge: {
    top: 4,
    left: 4,
    backgroundColor: '#F97316',
  },
  badgeIcon: {
    fontSize: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  siteDetailText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  siteDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  siteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    fontWeight: '600',
  },
  rating: {
    fontSize: 15,
    color: '#F59E42',
    fontWeight: 'bold',
  },
  siteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  favoriteActiveButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  favoriteActiveText: {
    color: '#DC2626',
  },
  visitedActiveButton: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  visitedActiveText: {
    color: '#065F46',
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
});