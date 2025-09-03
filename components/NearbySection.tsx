import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NearbyCard } from './NearbyCard';

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
  currentSite: {
    id: number;
    name: string;
    subplaces?: NearbySectionSite[];
    nearby?: NearbySectionSite[];
  };
  onNavigateToSite: (site: NearbySectionSite) => void;
  isOffline?: boolean;
}

export function NearbySection({ currentSite, onNavigateToSite, isOffline = false }: NearbySectionProps) {
  // Filter subplaces (within this site)
  const subplaces = currentSite.subplaces || [];
  
  // Filter nearby attractions within 2km
  const nearbyAttractions = (currentSite.nearby || []).filter(site => 
    !site.distanceKm || site.distanceKm <= 2
  );

  const renderEmptySubplaces = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>No subplaces listed.</Text>
    </View>
  );

  const renderEmptyNearby = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>No nearby attractions found.</Text>
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
        <Text style={styles.sectionTitle}>Within This Site</Text>
        {subplaces.length > 0 ? (
          <View>
            {subplaces.map((item) => (
              <NearbyCard
                key={`subplace-${item.id}`}
                site={item}
                onPress={onNavigateToSite}
                isOffline={isOffline}
                testID={`nearby-card-${item.id}`}
              />
            ))}
          </View>
        ) : (
          renderEmptySubplaces()
        )}
      </View>

      {/* Nearby Attractions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Attractions (Within 2 km)</Text>
        {nearbyAttractions.length > 0 ? (
          <View>
            {nearbyAttractions.map((item) => (
              <NearbyCard
                key={`nearby-${item.id}`}
                site={item}
                onPress={onNavigateToSite}
                isOffline={isOffline}
                testID={`nearby-card-${item.id}`}
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
});
