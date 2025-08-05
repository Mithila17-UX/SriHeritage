import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HomeScreenProps {
  user: { name: string; email: string } | null;
  onNavigateToSite: (site: any) => void;
  favoriteSites: number[];
  visitedSites: number[];
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
  const [heritageSites, setHeritageSites] = useState(defaultHeritageSites);

  useEffect(() => {
    const loadSites = async () => {
      try {
        const storedSites = await AsyncStorage.getItem('sri-heritage-sites');
        if (storedSites) {
          setHeritageSites(JSON.parse(storedSites));
        }
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    };

    loadSites();
    
    const interval = setInterval(loadSites, 2000); 
    
    return () => clearInterval(interval);
  }, []);

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
            <Text style={styles.headerSubtitle}>Discover and navigate to cultural sites</Text>
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
        <View style={[styles.mapPin, styles.mapPin1, { backgroundColor: '#EF4444' }]}><Text style={styles.mapPinIcon}>📍</Text></View>
        <View style={[styles.mapPin, styles.mapPin2, { backgroundColor: '#3B82F6' }]}><Text style={styles.mapPinIcon}>📍</Text></View>
        <View style={[styles.mapPin, styles.mapPin3, { backgroundColor: '#10B981' }]}><Text style={styles.mapPinIcon}>📍</Text></View>
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
                <Card style={[styles.siteCard, selectedSite === site.id && styles.selectedSiteCard]}>
                  <CardContent style={styles.siteCardContent}>
                    <View style={styles.cardTopSection}>
                      <View style={styles.siteImageContainer}>
                        {site.image ? (
                           <Image source={{ uri: site.image }} style={styles.siteImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.noImagePlaceholder}><Text style={styles.noImageText}>📷</Text></View>
                        )}
                        {isVisited && <View style={[styles.badge, styles.visitedBadge]}><Text style={styles.badgeIcon}>👁️</Text></View>}
                        {isFavorite && <View style={[styles.badge, styles.favoriteBadge]}><Text style={styles.badgeIcon}>❤️</Text></View>}
                      </View>
                      
                      <View style={styles.siteInfo}>
                        <Text style={styles.siteName} numberOfLines={1}>{site.name}</Text>
                        <Text style={styles.siteDetailText}>{site.location}</Text>
                        <Text style={styles.siteDetailText}>{site.distance} away</Text>
                        <View style={styles.siteMetadata}>
                          <Badge style={styles.categoryBadge}>{site.category}</Badge>
                          <Text style={styles.rating}>⭐ {site.rating}</Text>
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
                          <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryButtonText}>Get Directions</Text></TouchableOpacity>
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
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapCenter: { alignItems: 'center' },
  mapIcon: { width: 64, height: 64, backgroundColor: '#EA580C', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  mapIconText: { fontSize: 24 },
  mapTitle: { fontSize: 16, color: '#4B5563', marginBottom: 4 },
  mapSubtitle: { fontSize: 14, color: '#6B7280' },
  mapPin: { position: 'absolute', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  mapPin1: { top: 48, left: 64 },
  mapPin2: { top: 80, right: 80 },
  mapPin3: { bottom: 64, left: '33%' },
  mapPinIcon: { fontSize: 16 },
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
});
