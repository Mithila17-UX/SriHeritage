import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
// Note: Replace lucide-react icons with React Native compatible icons
// Note: Avatar and ImageWithFallback components would need React Native conversion
// import { Avatar, AvatarFallback } from './ui/avatar';
// import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProfileScreenProps {
  user: { name: string; email: string } | null;
  onLogout: () => void;
  favoriteSites: number[];
  visitedSites: number[];
  offlineMode: boolean;
  onToggleOfflineMode: (enabled: boolean) => void;
  onNavigateToSite: (site: any) => void;
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

export function ProfileScreen({ 
  user, 
  onLogout, 
  favoriteSites, 
  visitedSites, 
  offlineMode, 
  onToggleOfflineMode,
  onNavigateToSite 
}: ProfileScreenProps) {
  const [showFavorites, setShowFavorites] = useState(false);
  const [offlineStorageUsed] = useState(245); // MB
  const [lastSyncTime] = useState(new Date().toLocaleString());

  const stats = [
    { label: 'Sites Visited', value: visitedSites.length.toString(), icon: '📍' },
    { label: 'Posts Shared', value: '8', icon: '📅' },
    { label: 'Points Earned', value: (visitedSites.length * 50).toString(), icon: '🏆' }
  ];

  const menuItems = [
    { label: 'Notifications', icon: '🔔', action: () => {} },
    { label: 'Privacy & Security', icon: '🛡️', action: () => {} },
    { label: 'Help & Support', icon: '❓', action: () => {} },
    { label: 'Settings', icon: '⚙️', action: () => {} }
  ];

  const favoriteSiteData = heritageSites.filter(site => favoriteSites.includes(site.id));

  const handleRefreshOfflineData = () => {
    Alert.alert('Offline Data', 'Refreshing offline data for saved sites...');
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      'Clear Offline Data',
      'Are you sure you want to clear all offline data? This will remove cached information for all saved sites.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Offline data cleared successfully') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Badge style={styles.userBadge}>
              <Text style={styles.userBadgeText}>Heritage Explorer</Text>
            </Badge>
          </View>
          {offlineMode && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineIcon}>📶</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Your Journey</Text>
          </CardHeader>
          <CardContent style={{ paddingBottom: 16 }}>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <Text style={styles.statEmoji}>{stat.icon}</Text>
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Offline Mode Settings */}
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Offline Mode</Text>
          </CardHeader>
          <CardContent style={[styles.offlineContent, { paddingBottom: 16 }]}>
            <View style={styles.offlineRow}>
              <View style={styles.offlineInfo}>
                <Text style={styles.offlineStatusIcon}>
                  {offlineMode ? '📶' : '🌐'}
                </Text>
                <View style={styles.offlineText}>
                  <Text style={styles.offlineTitle}>Enable Offline Access</Text>
                  <Text style={styles.offlineSubtitle}>Access saved sites without internet</Text>
                </View>
              </View>
              <Switch
                value={offlineMode}
                onValueChange={onToggleOfflineMode}
              />
            </View>
            
            {offlineMode && (
              <View style={styles.offlineStatus}>
                <Text style={styles.offlineStatusText}>
                  Offline mode is enabled. You can access saved site information without internet connection.
                </Text>
                <Text style={styles.offlineStatusTime}>
                  Last synced: {lastSyncTime}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Settings</Text>
          </CardHeader>
          <CardContent style={{ paddingBottom: 16 }}>
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.action}
                >
                  <View style={styles.menuItemLeft}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onPress={onLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </Button>
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
    backgroundColor: '#8B5CF6', // violet-500
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#EDE9FE', // violet-100
    marginBottom: 8,
  },
  userBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  userBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  offlineIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  offlineIcon: {
    fontSize: 20,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FED7AA', // orange-100
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  offlineContent: {
    gap: 16,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  offlineStatusIcon: {
    fontSize: 20,
  },
  offlineText: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827', // gray-900
    marginBottom: 2,
  },
  offlineSubtitle: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  offlineStatus: {
    backgroundColor: '#FEF3C7', // amber-50
    borderWidth: 1,
    borderColor: '#FCD34D', // amber-200
    borderRadius: 8,
    padding: 12,
  },
  offlineStatusText: {
    fontSize: 14,
    color: '#92400E', // amber-800
    marginBottom: 8,
    lineHeight: 20,
  },
  offlineStatusTime: {
    fontSize: 12,
    color: '#B45309', // amber-700
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB', // gray-50
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  menuArrow: {
    fontSize: 16,
    color: '#9CA3AF', // gray-400
  },
  logoutButton: {
    backgroundColor: '#EF4444', // red-500
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activityList: {
    gap: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
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