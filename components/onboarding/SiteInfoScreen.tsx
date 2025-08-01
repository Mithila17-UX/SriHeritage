import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

interface SiteInfoScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export function SiteInfoScreen({ onNext, onSkip }: SiteInfoScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <Progress value={50} style={styles.progress} />
              <Button variant="ghost" size="sm" onPress={onSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </Button>
            </View>

            {/* Feature Illustration */}
            <View style={styles.illustration}>
              <View style={styles.iconContainer}>
                <Text style={styles.infoIcon}>ℹ️</Text>
              </View>
              
              {/* Site Info Card Mock */}
              <View style={styles.mockCard}>
                <View style={styles.mockHeader}>
                  <View style={styles.mockImageContainer}>
                    <Text style={styles.mockImage}>🏛️</Text>
                  </View>
                  <View style={styles.mockInfo}>
                    <Text style={styles.mockTitle}>Temple of Sacred Tooth</Text>
                    <View style={styles.mockRating}>
                      <Text style={styles.starIcon}>⭐</Text>
                      <Text style={styles.mockRatingText}>4.8 • Kandy</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.mockDetails}>
                  <View style={styles.mockDetailItem}>
                    <Text style={styles.clockIcon}>🕐</Text>
                    <Text style={styles.mockDetailText}>5:30 AM - 8:00 PM</Text>
                  </View>
                  <View style={styles.mockDetailItem}>
                    <Text style={styles.dollarIcon}>💰</Text>
                    <Text style={styles.mockDetailText}>LKR 1,000</Text>
                  </View>
                </View>
                
                <View style={styles.mockBadges}>
                  <Badge variant="secondary" style={styles.mockBadge}>
                    <Text style={styles.badgeText}>Temple</Text>
                  </Badge>
                  <Badge variant="secondary" style={styles.mockBadge}>
                    <Text style={styles.badgeText}>UNESCO</Text>
                  </Badge>
                </View>
              </View>
            </View>

            {/* Content */}
            <View style={styles.textContent}>
              <Text style={styles.title}>Discover Detailed Site Information</Text>
              <Text style={styles.description}>
                Get comprehensive details about each heritage site including history, visiting hours, entrance fees, and stunning photo galleries.
              </Text>
              
              {/* Features List */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>Rich historical background</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>Opening hours & entrance fees</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>Photo galleries & reviews</Text>
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
    backgroundColor: '#FFF7ED', // orange-50
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#F97316', // orange-500
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
  infoIcon: {
    fontSize: 32,
  },
  mockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mockHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mockImageContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FDE68A', // amber-200
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockImage: {
    fontSize: 18,
  },
  mockInfo: {
    flex: 1,
  },
  mockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  mockRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 12,
  },
  mockRatingText: {
    fontSize: 12,
    color: '#4B5563', // gray-600
  },
  mockDetails: {
    gap: 8,
    marginBottom: 12,
  },
  mockDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clockIcon: {
    fontSize: 12,
  },
  dollarIcon: {
    fontSize: 12,
  },
  mockDetailText: {
    fontSize: 12,
    color: '#4B5563', // gray-600
  },
  mockBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  mockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
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
    backgroundColor: '#F97316', // orange-500
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