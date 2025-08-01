import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
// Note: Replace lucide-react icons with React Native compatible icons
// import { MapPin, Navigation, Star, Clock, Camera, Heart, Eye } from 'lucide-react';
// import { ImageWithFallback } from './figma/ImageWithFallback';

interface HomeScreenProps {
  user: { name: string; email: string } | null;
  onNavigateToSite: (site: any) => void;
  favoriteSites: number[];
  visitedSites: number[];
}

const heritageSites = [
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
    ]
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
    ]
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
    ]
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
    ]
  }
];

export function HomeScreen({ user, onNavigateToSite, favoriteSites, visitedSites }: HomeScreenProps) {
  const [selectedSite, setSelectedSite] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Heritage Map</Text>
            <Text style={styles.headerSubtitle}>Explore Sri Lanka's cultural sites</Text>
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>🧭</Text>
            <Text style={styles.locationText}>Kandy</Text>
          </View>
        </View>
      </View>

      {/* Map Area - Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapCenter}>
            <View style={styles.mapIcon}>
              <Text style={styles.mapIconText}>🗺️</Text>
            </View>
            <Text style={styles.mapTitle}>Interactive Map View</Text>
            <Text style={styles.mapSubtitle}>Heritage sites will appear as pins</Text>
          </View>
        </View>
        
        {/* Mock map pins */}
        <View style={[styles.mapPin, styles.mapPin1, { backgroundColor: '#EF4444' }]}>
          <Text style={styles.mapPinIcon}>📍</Text>
        </View>
        <View style={[styles.mapPin, styles.mapPin2, { backgroundColor: '#3B82F6' }]}>
          <Text style={styles.mapPinIcon}>📍</Text>
        </View>
        <View style={[styles.mapPin, styles.mapPin3, { backgroundColor: '#10B981' }]}>
          <Text style={styles.mapPinIcon}>📍</Text>
        </View>
      </View>

      {/* Sites List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Nearby Heritage Sites</Text>
          <Text style={styles.listSubtitle}>Discover the cultural treasures around you</Text>
        </View>
        
        <View style={styles.sitesList}>
          {heritageSites.map((site) => {
            const isFavorite = favoriteSites.includes(site.id);
            const isVisited = visitedSites.includes(site.id);
            
            return (
              <TouchableOpacity 
                key={site.id}
                onPress={() => setSelectedSite(selectedSite === site.id ? null : site.id)}
              >
                <Card style={[
                  styles.siteCard,
                  selectedSite === site.id && styles.selectedSiteCard
                ]}>
                  <CardContent style={styles.siteCardContent}>
                    <View style={styles.siteRow}>
                      <View style={styles.siteImageContainer}>
                        <Image
                          source={{ uri: site.image }}
                          style={styles.siteImage}
                          resizeMode="cover"
                        />
                        <View style={styles.cameraOverlay}>
                          <Text style={styles.cameraIcon}>📷</Text>
                        </View>
                        {isVisited && (
                          <View style={[styles.siteBadge, styles.visitedBadge]}>
                            <Text style={styles.siteBadgeIcon}>👁️</Text>
                          </View>
                        )}
                        {isFavorite && (
                          <View style={[styles.siteBadge, styles.favoriteBadge]}>
                            <Text style={styles.siteBadgeIcon}>❤️</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.siteInfo}>
                        <View style={styles.siteHeader}>
                          <Text style={styles.siteName} numberOfLines={1}>{site.name}</Text>
                          <View style={styles.ratingContainer}>
                            <Text style={styles.starIcon}>⭐</Text>
                            <Text style={styles.ratingText}>{site.rating}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.siteMetadata}>
                          <Badge variant="secondary" style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{site.category}</Text>
                          </Badge>
                          <View style={styles.locationContainer}>
                            <Text style={styles.locationIcon}>📍</Text>
                            <Text style={styles.locationText}>{site.location}</Text>
                          </View>
                          {isVisited && (
                            <Badge style={styles.visitedLabel}>
                              <Text style={styles.visitedLabelText}>Visited</Text>
                            </Badge>
                          )}
                        </View>
                        
                        <View style={styles.siteFooter}>
                          <View style={styles.distanceContainer}>
                            <Text style={styles.clockIcon}>🕐</Text>
                            <Text style={styles.distanceText}>{site.distance} away</Text>
                          </View>
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
                      </View>
                    </View>
                    
                    {selectedSite === site.id && (
                      <View style={styles.expandedContent}>
                        <Text style={styles.siteDescription}>{site.description}</Text>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>Get Directions</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Book a Ride</Text>
                          </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  header: {
    backgroundColor: '#EA580C', // orange-600 (gradient approximation)
    paddingTop: 40, // Safe area top
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FED7AA', // orange-100
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 6,
    gap: 8,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Map Area
  mapContainer: {
    height: 256,
    backgroundColor: '#DCFCE7', // green-100 to blue-100 approximation
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapCenter: {
    alignItems: 'center',
  },
  mapIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#EA580C', // orange-600
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  mapIconText: {
    fontSize: 24,
  },
  mapTitle: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  mapPin1: {
    top: 48,
    left: 64,
  },
  mapPin2: {
    top: 80,
    right: 80,
  },
  mapPin3: {
    bottom: 64,
    left: '33%',
  },
  mapPinIcon: {
    fontSize: 16,
  },
  // Sites List
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  sitesList: {
    gap: 16,
  },
  siteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSiteCard: {
    borderColor: '#FB923C', // orange-400
  },
  siteCardContent: {
    padding: 16,
  },
  siteRow: {
    flexDirection: 'row',
    gap: 12,
  },
  siteImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  siteImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 12,
  },
  siteBadge: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitedBadge: {
    bottom: 4,
    left: 4,
    backgroundColor: '#10B981', // green-500
  },
  favoriteBadge: {
    bottom: 4,
    right: 4,
    backgroundColor: '#EF4444', // red-500
  },
  siteBadgeIcon: {
    fontSize: 12,
  },
  siteInfo: {
    flex: 1,
    gap: 8,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  siteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 12,
  },
  locationIcon: {
    fontSize: 12,
  },
  visitedLabel: {
    backgroundColor: '#DCFCE7', // green-100
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  visitedLabelText: {
    fontSize: 12,
    color: '#166534', // green-800
  },
  siteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockIcon: {
    fontSize: 12,
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FED7AA', // orange-200
    borderRadius: 6,
    backgroundColor: '#FFF7ED', // orange-50
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
  // Expanded Content
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', // gray-100
  },
  siteDescription: {
    fontSize: 14,
    color: '#4B5563', // gray-600
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#EA580C', // orange-600
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#374151', // gray-700
    fontWeight: '500',
  },
});