import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NearbyCard } from './NearbyCard';
import { databaseService, Site } from '../services/database';
import { useSites } from '../hooks/useSites';
import { formatKm } from '../utils/geo';

// Re-use existing Site type structure
interface NearbySectionSite {
  id: number;
  name: string;
  location?: string;
  category: string;
  description: string;
  rating?: number;
  image?: string;
  image_url?: string;
  openingHours?: string;
  visiting_hours?: string;
  distanceKm?: number;
}

interface NearbySectionProps {
  currentSite: Site;
  onNavigateToSite: (siteId: string | number) => void;
  isOffline?: boolean;
}

export function NearbySection({ currentSite, onNavigateToSite, isOffline = false }: NearbySectionProps) {
  const { getSiteById, computingNearby } = useSites();
  
  // Get computed relations from the site
  const withinRelations = currentSite.computedWithin || [];
  const nearbyRelations = currentSite.computedNearby || [];
  
  console.log('🏛️  NearbySection for site:', currentSite.name);
  console.log('📊 Within relations:', withinRelations.length);
  console.log('📊 Nearby relations:', nearbyRelations.length);
  
  // Convert relations to displayable site data
  const withinSites = withinRelations.map(relation => {
    const site = getSiteById(relation.siteId);
    if (!site) {
      console.warn('⚠️  Site not found for relation:', relation.siteId);
      return null;
    }
    
    return {
      ...site,
      airDistanceKm: relation.airDistanceKm,
      roadDistanceKm: relation.roadDistanceKm
    };
  }).filter(Boolean) as (Site & { airDistanceKm: number; roadDistanceKm?: number })[];
  
  const nearbySites = nearbyRelations.map(relation => {
    const site = getSiteById(relation.siteId);
    if (!site) {
      console.warn('⚠️  Site not found for relation:', relation.siteId);
      return null;
    }
    
    return {
      ...site,
      airDistanceKm: relation.airDistanceKm,
      roadDistanceKm: relation.roadDistanceKm
    };
  }).filter(Boolean) as (Site & { airDistanceKm: number; roadDistanceKm?: number })[];
  
  // Handle navigating to a site using just the site ID (fixes navigation issue)
  const handleNavigateToSite = (siteId: string | number) => {
    console.log('🧭 Navigating to site ID:', siteId);
    onNavigateToSite(siteId);
  };

  const renderEmptyWithin = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>No sites within 2 km found.</Text>
      {computingNearby && (
        <Text style={styles.computingText}>Computing nearby relations...</Text>
      )}
    </View>
  );

  const renderEmptyNearby = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>No nearby attractions within 10 km found.</Text>
      {computingNearby && (
        <Text style={styles.computingText}>Computing nearby relations...</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineIcon}>📶</Text>
          <Text style={styles.offlineText}>Viewing offline content</Text>
        </View>
      )}

      {/* Within This Site Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Within This Site (2 km)</Text>
        {withinSites.length > 0 ? (
          <View>
            {withinSites.map((site) => (
              <NearbyCard
                key={`within-${site.id}`}
                site={site}
                onPress={() => handleNavigateToSite(site.id)}
                isOffline={isOffline}
                testID={`nearby-card-${site.id}`}
                roadDistanceKm={site.roadDistanceKm}
              />
            ))}
          </View>
        ) : (
          renderEmptyWithin()
        )}
      </View>

      {/* Nearby Attractions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Attractions (10 km)</Text>
        {nearbySites.length > 0 ? (
          <View>
            {nearbySites.map((site) => (
              <NearbyCard
                key={`nearby-${site.id}`}
                site={site}
                onPress={() => handleNavigateToSite(site.id)}
                isOffline={isOffline}
                testID={`nearby-card-${site.id}`}
                roadDistanceKm={site.roadDistanceKm}
              />
            ))}
          </View>
        ) : (
          renderEmptyNearby()
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // amber-100
    borderWidth: 1,
    borderColor: '#FCD34D', // amber-300
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  offlineIcon: {
    fontSize: 16,
  },
  offlineText: {
    fontSize: 14,
    color: '#92400E', // amber-800
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 12,
  },
  emptyStateContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF', // gray-400
    fontStyle: 'italic',
  },
  computingText: {
    fontSize: 12,
    color: '#6B7280', // gray-500
    fontStyle: 'italic',
    marginTop: 4,
  },
});
