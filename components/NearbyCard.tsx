import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Badge } from './ui/badge';

// Re-use existing Site type structure
interface NearbyCardSite {
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

interface NearbyCardProps {
  site: NearbyCardSite;
  onPress: (site: NearbyCardSite) => void;
  isOffline?: boolean;
  testID?: string;
}

export function NearbyCard({ site, onPress, isOffline = false, testID }: NearbyCardProps) {
  const imageUrl = site.image || site.image_url;
  const hours = site.openingHours || site.visiting_hours || 'Hours not available';
  const rating = site.rating || 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(site)}
      accessibilityRole="button"
      accessibilityLabel={site.name}
      testID={testID}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {imageUrl && !isOffline ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Text style={styles.placeholderIcon}>🏛️</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Rating Row */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {site.name}
          </Text>
          {rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          <Badge style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{site.category}</Text>
          </Badge>
          {site.distanceKm !== undefined && (
            <Badge style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{site.distanceKm.toFixed(1)} km</Text>
            </Badge>
          )}
        </View>

        {/* Hours */}
        <Text style={styles.hours} numberOfLines={1}>
          🕐 {hours}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {site.description}
        </Text>
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
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
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#FFF7ED', // orange-50
    borderColor: '#FDBA74', // orange-300
  },
  categoryText: {
    fontSize: 10,
    color: '#C2410C', // orange-700
    fontWeight: '500',
  },
  distanceBadge: {
    backgroundColor: '#F0FDF4', // green-50
    borderColor: '#BBF7D0', // green-200
  },
  distanceText: {
    fontSize: 10,
    color: '#166534', // green-800
    fontWeight: '500',
  },
  hours: {
    fontSize: 12,
    color: '#6B7280', // gray-500
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#4B5563', // gray-600
    lineHeight: 16,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF', // gray-400
    fontWeight: '300',
  },
});
