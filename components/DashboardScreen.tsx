import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
// Note: Replace lucide-react icons with React Native compatible icons
// import { MapPin, Star, Eye, EyeOff, Compass, MessageCircle, Users, Map, Calendar, Trophy, ChevronRight } from 'lucide-react';
// import { ImageWithFallback } from './figma/ImageWithFallback';

interface DashboardScreenProps {
  user: { name: string; email: string } | null;
  visitedSites: number[];
  favoriteSites: number[];
  onNavigateToSite: (site: any) => void;
  onNavigateToScreen: (screen: string) => void;
}

const heritageSites = [
  {
    id: 1,
    name: 'Temple of the Sacred Tooth Relic',
    location: 'Kandy',
    district: 'Kandy',
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
    location: 'Sigiriya',
    district: 'Matale',
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
    district: 'Galle',
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
    district: 'Matale',
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

export function DashboardScreen({ user, visitedSites, favoriteSites, onNavigateToSite, onNavigateToScreen }: DashboardScreenProps) {
  const visitedCount = visitedSites.length;
  const totalSites = heritageSites.length;
  const progressPercentage = (visitedCount / totalSites) * 100;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const recommendedSites = heritageSites.filter(site => !visitedSites.includes(site.id)).slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      {/* Header with Greeting */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{getGreeting()}, {user?.name}!</Text>
            <Text style={styles.subGreetingText}>Ready to explore Sri Lanka's heritage?</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Exploration Progress */}
        <Card style={styles.progressCard}>
          <CardHeader style={styles.progressHeader}>
            <View style={styles.progressHeaderContent}>
              <View style={styles.progressHeaderText}>
                <Text style={styles.cardTitle}>Your Heritage Journey</Text>
                <Text style={styles.cardSubtitle}>Keep exploring to unlock new discoveries</Text>
              </View>
              <Text style={styles.trophyIcon}>🏆</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.progressContent}>
            <View style={styles.progressDetails}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Sites Explored</Text>
                <Text style={styles.progressValue}>{visitedCount} / {totalSites}</Text>
              </View>
              <Progress value={progressPercentage} style={styles.progressBar} />
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.blueText]}>{visitedCount}</Text>
                  <Text style={styles.statLabel}>Visited</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.orangeText]}>{favoriteSites.length}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.greenText]}>{visitedCount * 50}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              onPress={() => onNavigateToScreen('home')}
              style={[styles.actionButton, styles.orangeButton]}
            >
              <Text style={styles.actionIcon}>🗺️</Text>
              <Text style={styles.actionText}>Explore Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigateToScreen('places')}
              style={[styles.actionButton, styles.greenButton]}
            >
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionText}>All Places</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigateToScreen('chat')}
              style={[styles.actionButton, styles.blueButton]}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Ask AI Guide</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigateToScreen('forum')}
              style={[styles.actionButton, styles.purpleButton]}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Join Forum</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended Sites */}
        {recommendedSites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <TouchableOpacity onPress={() => onNavigateToScreen('places')}>
                <Text style={styles.viewAllButton}>View All →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sitesContainer}>
              {recommendedSites.map((site) => (
                <TouchableOpacity key={site.id} onPress={() => onNavigateToSite(site)}>
                  <Card style={styles.siteCard}>
                    <CardContent style={styles.siteCardContent}>
                      <View style={styles.siteRow}>
                        <Image
                          source={{ uri: site.image }}
                          style={styles.siteImage}
                          resizeMode="cover"
                        />
                        <View style={styles.siteInfo}>
                          <Text style={styles.siteName} numberOfLines={1}>{site.name}</Text>
                          <View style={styles.siteMetaRow}>
                            <Badge style={styles.siteBadge}>
                              <Text style={styles.siteBadgeText}>{site.category}</Text>
                            </Badge>
                            <View style={styles.ratingContainer}>
                              <Text style={styles.starIcon}>⭐</Text>
                              <Text style={styles.ratingText}>{site.rating}</Text>
                            </View>
                          </View>
                          <View style={styles.locationRow}>
                            <Text style={styles.locationIcon}>📍</Text>
                            <Text style={styles.locationText}>{site.location} • {site.distance}</Text>
                          </View>
                        </View>
                        <TouchableOpacity style={styles.exploreButton}>
                          <Text style={styles.exploreButtonText}>🧭 Explore</Text>
                        </TouchableOpacity>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <CardHeader>
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </CardHeader>
          <CardContent style={styles.activityContent}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, styles.greenBackground]}>
                <Text style={styles.activityEmoji}>📍</Text>
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Visited Temple of the Sacred Tooth</Text>
                <Text style={styles.activityTime}>2 days ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, styles.blueBackground]}>
                <Text style={styles.activityEmoji}>📅</Text>
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Added Galle Fort to favorites</Text>
                <Text style={styles.activityTime}>1 week ago</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subGreetingText: {
    fontSize: 16,
    color: '#FED7AA', // orange-100
  },
  content: {
    padding: 16,
    gap: 24,
  },
  // Progress Card
  progressCard: {
    backgroundColor: '#EFF6FF', // blue-50
    borderColor: '#BFDBFE', // blue-200
  },
  progressHeader: {
    paddingBottom: 12,
  },
  progressHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  trophyIcon: {
    fontSize: 32,
  },
  progressContent: {
    gap: 12,
  },
  progressDetails: {
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  progressBar: {
    height: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#4B5563', // gray-600
  },
  blueText: {
    color: '#2563EB', // blue-600
  },
  orangeText: {
    color: '#EA580C', // orange-600
  },
  greenText: {
    color: '#16A34A', // green-600
  },
  // Sections
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    height: 80,
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  orangeButton: {
    backgroundColor: '#EA580C', // orange-600
  },
  greenButton: {
    backgroundColor: '#16A34A', // green-600
  },
  blueButton: {
    backgroundColor: '#2563EB', // blue-600
  },
  purpleButton: {
    backgroundColor: '#9333EA', // purple-600
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Sites
  sitesContainer: {
    gap: 12,
  },
  siteCard: {
    backgroundColor: '#FFFFFF',
  },
  siteCardContent: {
    padding: 16,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  siteImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  siteInfo: {
    flex: 1,
    gap: 4,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  siteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  siteBadgeText: {
    fontSize: 12,
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
    color: '#6B7280', // gray-500
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
  exploreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7AA', // orange-200
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreButtonText: {
    fontSize: 12,
    color: '#EA580C', // orange-600
    fontWeight: '500',
  },
  // Activity
  activityCard: {
    backgroundColor: '#FFFFFF',
  },
  activityContent: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenBackground: {
    backgroundColor: '#DCFCE7', // green-100
  },
  blueBackground: {
    backgroundColor: '#DBEAFE', // blue-100
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
});