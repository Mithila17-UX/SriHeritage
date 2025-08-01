import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

// Example component showing how to use @expo/vector-icons
// This replaces the emoji icons used throughout the app

export function IconsExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Icon Examples</Text>
      
      {/* Navigation Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        <View style={styles.iconRow}>
          <Ionicons name="home" size={24} color="#EA580C" />
          <Ionicons name="map" size={24} color="#EA580C" />
          <Ionicons name="chatbubbles" size={24} color="#EA580C" />
          <Ionicons name="person" size={24} color="#EA580C" />
        </View>
      </View>

      {/* Action Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.iconRow}>
          <Ionicons name="heart" size={24} color="#EF4444" />
          <Ionicons name="share-social" size={24} color="#3B82F6" />
          <Ionicons name="bookmark" size={24} color="#10B981" />
          <Ionicons name="camera" size={24} color="#8B5CF6" />
        </View>
      </View>

      {/* Location Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.iconRow}>
          <Ionicons name="location" size={24} color="#EA580C" />
          <Ionicons name="navigate" size={24} color="#EA580C" />
          <Ionicons name="car" size={24} color="#EA580C" />
          <MaterialIcons name="directions" size={24} color="#EA580C" />
        </View>
      </View>

      {/* Rating Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rating</Text>
        <View style={styles.iconRow}>
          <Ionicons name="star" size={24} color="#F59E0B" />
          <Ionicons name="star-half" size={24} color="#F59E0B" />
          <Ionicons name="star-outline" size={24} color="#F59E0B" />
          <FontAwesome name="trophy" size={24} color="#F59E0B" />
        </View>
      </View>

      {/* Status Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.iconRow}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Ionicons name="close-circle" size={24} color="#EF4444" />
          <Ionicons name="time" size={24} color="#6B7280" />
          <Ionicons name="wifi-off" size={24} color="#F59E0B" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
  },
});

// Icon mapping for easy replacement throughout the app
export const AppIcons = {
  // Navigation
  home: (props: any) => <Ionicons name="home" {...props} />,
  map: (props: any) => <Ionicons name="map" {...props} />,
  chat: (props: any) => <Ionicons name="chatbubbles" {...props} />,
  profile: (props: any) => <Ionicons name="person" {...props} />,
  places: (props: any) => <Ionicons name="location" {...props} />,
  
  // Actions
  heart: (props: any) => <Ionicons name="heart" {...props} />,
  heartOutline: (props: any) => <Ionicons name="heart-outline" {...props} />,
  share: (props: any) => <Ionicons name="share-social" {...props} />,
  bookmark: (props: any) => <Ionicons name="bookmark" {...props} />,
  camera: (props: any) => <Ionicons name="camera" {...props} />,
  
  // Location & Navigation
  location: (props: any) => <Ionicons name="location" {...props} />,
  navigate: (props: any) => <Ionicons name="navigate" {...props} />,
  car: (props: any) => <Ionicons name="car" {...props} />,
  directions: (props: any) => <MaterialIcons name="directions" {...props} />,
  
  // Rating
  star: (props: any) => <Ionicons name="star" {...props} />,
  starHalf: (props: any) => <Ionicons name="star-half" {...props} />,
  starOutline: (props: any) => <Ionicons name="star-outline" {...props} />,
  trophy: (props: any) => <FontAwesome name="trophy" {...props} />,
  
  // Status
  checkmark: (props: any) => <Ionicons name="checkmark-circle" {...props} />,
  close: (props: any) => <Ionicons name="close-circle" {...props} />,
  time: (props: any) => <Ionicons name="time" {...props} />,
  wifiOff: (props: any) => <Ionicons name="wifi-off" {...props} />,
  
  // UI Elements
  back: (props: any) => <Ionicons name="arrow-back" {...props} />,
  forward: (props: any) => <Ionicons name="arrow-forward" {...props} />,
  search: (props: any) => <Ionicons name="search" {...props} />,
  filter: (props: any) => <Ionicons name="filter" {...props} />,
  add: (props: any) => <Ionicons name="add" {...props} />,
  settings: (props: any) => <Ionicons name="settings" {...props} />,
  
  // Communication
  send: (props: any) => <Ionicons name="send" {...props} />,
  messageCircle: (props: any) => <Ionicons name="chatbubble-ellipses" {...props} />,
  
  // Misc
  eye: (props: any) => <Ionicons name="eye" {...props} />,
  eyeOff: (props: any) => <Ionicons name="eye-off" {...props} />,
  refresh: (props: any) => <Ionicons name="refresh" {...props} />,
  download: (props: any) => <Ionicons name="download" {...props} />,
};