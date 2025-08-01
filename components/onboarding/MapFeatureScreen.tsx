import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

interface MapFeatureScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export function MapFeatureScreen({ onNext, onSkip }: MapFeatureScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <Progress value={25} style={styles.progress} />
              <Button variant="ghost" size="sm" onPress={onSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </Button>
            </View>

            {/* Feature Illustration */}
            <View style={styles.illustration}>
              <View style={styles.iconContainer}>
                <Text style={styles.mapIcon}>🗺️</Text>
              </View>
              
              {/* Map Visualization */}
              <View style={styles.mapVisualization}>
                <View style={styles.mapGrid}>
                  {[...Array(9)].map((_, i) => (
                    <View key={i} style={styles.mapTile} />
                  ))}
                </View>
                
                {/* Map Pins */}
                <View style={[styles.mapPin, { top: 12, left: 24 }]}>
                  <Text style={styles.pinIcon}>📍</Text>
                </View>
                <View style={[styles.mapPin, { top: 24, right: 16 }]}>
                  <Text style={styles.pinIcon}>📍</Text>
                </View>
                <View style={[styles.mapPin, { bottom: 16, left: 32 }]}>
                  <Text style={styles.pinIcon}>📍</Text>
                </View>
              </View>
            </View>

            {/* Content */}
            <View style={styles.textContent}>
              <Text style={styles.title}>Explore with Our Interactive Map</Text>
              <Text style={styles.description}>
                Navigate through Sri Lanka's heritage sites with our interactive map. Discover nearby attractions, get directions, and plan your cultural journey with ease.
              </Text>
              
              {/* Features List */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>Real-time location tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>Nearby heritage sites discovery</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>Turn-by-turn navigation</Text>
                </View>
              </View>
            </View>
            
            <Button onPress={onNext} style={styles.continueButton}>
              <Text style={styles.continueText}>Continue →</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED', // amber-50
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progress: {
    flex: 1,
    marginRight: 16,
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  skipText: {
    color: '#6B7280', // gray-500
    fontSize: 14,
  },
  illustration: {
    backgroundColor: '#EFF6FF', // blue-50
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#3B82F6', // blue-500
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapIcon: {
    fontSize: 32,
  },
  mapVisualization: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    position: 'relative',
  },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mapTile: {
    width: '30%',
    height: 32,
    backgroundColor: 'rgba(147, 197, 253, 0.5)', // blue-200/50
    borderRadius: 4,
  },
  mapPin: {
    position: 'absolute',
  },
  pinIcon: {
    fontSize: 16,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresList: {
    gap: 12,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#DCFCE7', // green-100
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#16A34A', // green-600
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#374151', // gray-700
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#3B82F6', // blue-500
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});