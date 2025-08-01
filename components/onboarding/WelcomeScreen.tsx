import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
// Note: Replace lucide-react icons with React Native compatible icons
// import { ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onNext, onSkip }: WelcomeScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <CardContent style={styles.content}>
          {/* Skip Button */}
          <View style={styles.skipButtonContainer}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Sri Lankan Moonstone-inspired Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoOuter}>
              <View style={styles.logoMiddle}>
                <View style={styles.logoInner}>
                  <View style={styles.logoCenter}>
                    <View style={styles.logoCore}></View>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          <Text style={styles.title}>Welcome to Sri Heritage</Text>
          <Text style={styles.description}>
            Discover the rich cultural heritage of Sri Lanka through an immersive journey across ancient temples, historic forts, and UNESCO World Heritage sites.
          </Text>

          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🗺️</Text>
              </View>
              <Text style={styles.featureLabel}>Interactive Maps</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🏛️</Text>
              </View>
              <Text style={styles.featureLabel}>Rich History</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>👥</Text>
              </View>
              <Text style={styles.featureLabel}>Community</Text>
            </View>
          </View>
          
          <Button
            onPress={onNext}
            style={styles.getStartedButton}
          >
            <Text style={styles.getStartedButtonText}>Get Started →</Text>
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED', // Equivalent to bg-gradient-to-br from-amber-50 via-orange-50 to-red-50
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  skipButtonContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F59E0B', // amber-500
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  logoMiddle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EA580C', // orange-600
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626', // red-600
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B91C1C', // red-700
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FED7AA', // orange-100
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureLabel: {
    fontSize: 12,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  getStartedButton: {
    backgroundColor: '#EA580C', // orange-600
    width: '100%',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});