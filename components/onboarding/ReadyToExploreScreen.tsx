import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

interface ReadyToExploreScreenProps {
  onStartExploring: () => void;
  onSkip: () => void;
}

export function ReadyToExploreScreen({ onStartExploring, onSkip }: ReadyToExploreScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <Progress value={100} style={styles.progress} />
              <Button variant="ghost" size="sm" onPress={onSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </Button>
            </View>

            {/* Celebration Illustration */}
            <View style={styles.celebration}>
              <View style={styles.iconGroup}>
                <View style={styles.mainIcon}>
                  <Text style={styles.compassIcon}>🧭</Text>
                </View>
                
                {/* Floating Icons */}
                <View style={[styles.floatingIcon, styles.floatingIcon1]}>
                  <Text style={styles.floatingIconText}>🗺️</Text>
                </View>
                <View style={[styles.floatingIcon, styles.floatingIcon2]}>
                  <Text style={styles.floatingIconText}>👥</Text>
                </View>
                <View style={[styles.floatingIcon, styles.floatingIcon3]}>
                  <Text style={styles.floatingIconText}>ℹ️</Text>
                </View>
              </View>
              
              <Text style={styles.title}>Ready to Explore?</Text>
              <Text style={styles.subtitle}>
                You're all set to begin your journey through Sri Lanka's incredible heritage!
              </Text>
            </View>

            {/* Key Benefits Summary */}
            <View style={styles.benefits}>
              <View style={styles.benefitsHeader}>
                <Text style={styles.sparkleIcon}>✨</Text>
                <Text style={styles.benefitsTitle}>What you can do:</Text>
              </View>
              
              <View style={styles.benefitsGrid}>
                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.benefitIconText}>🗺️</Text>
                  </View>
                  <Text style={styles.benefitTitle}>Interactive Maps</Text>
                  <Text style={styles.benefitSubtitle}>Navigate & discover</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: '#FED7AA' }]}>
                    <Text style={styles.benefitIconText}>ℹ️</Text>
                  </View>
                  <Text style={styles.benefitTitle}>Rich Details</Text>
                  <Text style={styles.benefitSubtitle}>History & info</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: '#E9D5FF' }]}>
                    <Text style={styles.benefitIconText}>👥</Text>
                  </View>
                  <Text style={styles.benefitTitle}>Community</Text>
                  <Text style={styles.benefitSubtitle}>Share & connect</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.benefitIconText}>🧭</Text>
                  </View>
                  <Text style={styles.benefitTitle}>AI Guide</Text>
                  <Text style={styles.benefitSubtitle}>Expert assistance</Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <View style={styles.cta}>
              <Button onPress={onStartExploring} style={styles.startButton}>
                <Text style={styles.startButtonText}>Start Exploring Sri Heritage →</Text>
              </Button>
              
              <Text style={styles.ctaSubtext}>
                Embark on your cultural journey today
              </Text>
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
  celebration: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGroup: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#F59E0B', // amber-500
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  compassIcon: {
    fontSize: 48,
  },
  floatingIcon: {
    position: 'absolute',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIcon1: {
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6', // blue-500
  },
  floatingIcon2: {
    bottom: -8,
    left: -8,
    width: 32,
    height: 32,
    backgroundColor: '#8B5CF6', // purple-500
  },
  floatingIcon3: {
    top: 16,
    left: -24,
    width: 24,
    height: 24,
    backgroundColor: '#10B981', // green-500
  },
  floatingIconText: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    lineHeight: 26,
  },
  benefits: {
    backgroundColor: '#FFF7ED', // amber-50
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparkleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  benefitItem: {
    width: '47%',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitIconText: {
    fontSize: 20,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    textAlign: 'center',
    marginBottom: 4,
  },
  benefitSubtitle: {
    fontSize: 12,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  cta: {
    gap: 12,
  },
  startButton: {
    backgroundColor: '#F59E0B', // amber-500
    width: '100%',
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  ctaSubtext: {
    fontSize: 12,
    color: '#6B7280', // gray-500
    textAlign: 'center',
  },
});