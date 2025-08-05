import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, FlatList } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: Replace lucide-react icons with React Native compatible icons
// import { MapPin, Navigation, Star, Search, Filter, Heart, Eye, SortAsc } from 'lucide-react';
// import { ImageWithFallback } from './figma/ImageWithFallback';

interface AllPlacesScreenProps {
  user: { name: string; email: string } | null;
  onNavigateToSite: (site: any) => void;
  favoriteSites: number[];
  visitedSites: number[];
}

const defaultPlaces = [
  {
    id: 1,
    name: 'Temple of the Sacred Tooth Relic',
    location: 'Kandy',
    district: 'Kandy',
    distance: '2.3 km',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
    category: 'Temple',
    description: 'A Buddhist temple that houses the relic of the tooth of the Buddha. One of the most sacred Buddhist sites.',
    openingHours: 'Daily: 5:30 AM - 8:00 PM',
    entranceFee: 'Local: LKR 50, Foreign: LKR 1,000',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571715268652-3c2247e38d3e?w=800&h=600&fit=crop'
    ]
  },
  {
    id: 2,
    name: 'Sigiriya Rock Fortress',
    location: 'Sigiriya',
    district: 'Matale',
    distance: '45.2 km',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1571715268652-3c2247e38d3e?w=400&h=300&fit=crop',
    category: 'Ancient City',
    description: 'An ancient rock fortress and palace with magnificent frescoes. UNESCO World Heritage Site.',
    openingHours: 'Daily: 7:00 AM - 5:30 PM',
    entranceFee: 'Local: LKR 60, Foreign: USD 30',
    gallery: [
      'https://images.unsplash.com/photo-1571715268652-3c2247e38d3e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop'
    ]
  },
  {
    id: 3,
    name: 'Galle Fort',
    location: 'Galle',
    district: 'Galle',
    distance: '78.5 km',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop',
    category: 'Colonial Fort',
    description: 'A 17th-century fort built by the Portuguese and later fortified by the Dutch. Charming colonial architecture.',
    openingHours: 'Daily: 6:00 AM - 6:00 PM',
    entranceFee: 'Free entry to fort area',
    gallery: [
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1575484470027-8d85bbf23b62?w=800&h=600&fit=crop'
    ]
  },
  {
    id: 4,
    name: 'Dambulla Cave Temple',
    location: 'Dambulla',
    district: 'Matale',
    distance: '52.1 km',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1575484470027-8d85bbf23b62?w=400&h=300&fit=crop',
    category: 'Cave Temple',
    description: 'The largest and best-preserved cave temple complex in Sri Lanka with ancient Buddhist paintings.',
    openingHours: 'Daily: 7:00 AM - 7:00 PM',
    entranceFee: 'Local: LKR 500, Foreign: USD 10',
    gallery: [
      'https://images.unsplash.com/photo-1575484470027-8d85bbf23b62?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop'
    ]
  },
  {
    id: 5,
    name: 'Polonnaruwa Ancient City',
    location: 'Polonnaruwa',
    district: 'Polonnaruwa',
    distance: '65.8 km',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    category: 'Ancient City',
    description: 'Medieval capital of Sri Lanka with well-preserved ruins and ancient architecture.',
    openingHours: 'Daily: 7:00 AM - 6:00 PM',
    entranceFee: 'Local: LKR 60, Foreign: USD 25',
    gallery: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
    ]
  },
  {
    id: 6,
    name: 'Anuradhapura Sacred City',
    location: 'Anuradhapura',
    district: 'Anuradhapura',
    distance: '95.2 km',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1609137144043-8b1dcb1d6b95?w=400&h=300&fit=crop',
    category: 'Ancient City',
    description: 'First capital of Sri Lanka with magnificent stupas and ancient Buddhist monasteries.',
    openingHours: 'Daily: 6:00 AM - 6:00 PM',
    entranceFee: 'Local: LKR 60, Foreign: USD 25',
    gallery: [
      'https://images.unsplash.com/photo-1609137144043-8b1dcb1d6b95?w=800&h=600&fit=crop'
    ]
  },
  {
    id: 7,
    name: 'Ella Rock',
    location: 'Ella',
    district: 'Badulla',
    distance: '120.5 km',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=400&h=300&fit=crop',
    category: 'Natural Site',
    description: 'Popular hiking destination with breathtaking views of the hill country and tea plantations.',
    openingHours: 'Daily: 5:00 AM - 6:00 PM',
    entranceFee: 'Free access',
    gallery: [
      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&h=600&fit=crop'
    ]
  },
  {
    id: 8,
    name: 'Yala National Park',
    location: 'Yala',
    district: 'Hambantota',
    distance: '165.3 km',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1549366021-9f761d040fff?w=400&h=300&fit=crop',
    category: 'National Park',
    description: 'Famous wildlife sanctuary known for leopards, elephants, and diverse bird species.',
    openingHours: 'Daily: 6:00 AM - 6:00 PM',
    entranceFee: 'Local: LKR 1,500, Foreign: USD 20',
    gallery: [
      'https://images.unsplash.com/photo-1549366021-9f761d040fff?w=800&h=600&fit=crop'
    ]
  }
];

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

export function AllPlacesScreen({ user, onNavigateToSite, favoriteSites, visitedSites }: AllPlacesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [sortBy, setSortBy] = useState('proximity');
  const [allPlaces, setAllPlaces] = useState(defaultPlaces);

  // Load sites from AsyncStorage
  useEffect(() => {
    const loadSites = async () => {
      try {
        const storedSites = await AsyncStorage.getItem('sri-heritage-sites');
        if (storedSites) {
          setAllPlaces(JSON.parse(storedSites));
        }
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    };

    loadSites();
    
    // Set up interval to check for updates
    const interval = setInterval(loadSites, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  const filteredAndSortedPlaces = useMemo(() => {
    let filtered = allPlaces;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by district
    if (selectedDistrict !== 'All Districts') {
      filtered = filtered.filter(place => place.district === selectedDistrict);
    }

    // Sort places
    switch (sortBy) {
      case 'proximity':
        return filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered;
    }
  }, [searchQuery, selectedDistrict, sortBy]);

  const handleGetDirections = (place: any) => {
    Alert.alert('Directions', `Getting directions to ${place.name}...`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>All Places in Sri Lanka</Text>
            <Text style={styles.headerSubtitle}>Discover {allPlaces.length} heritage sites across the island</Text>
          </View>
          <Badge style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{filteredAndSortedPlaces.length} places</Text>
          </Badge>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Input
            placeholder="Search places, locations, or categories..."
            placeholderTextColor="#A7F3D0" // A light green that complements the teal
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
                            onNavigateToSite(place);
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
    justifyContent: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
});