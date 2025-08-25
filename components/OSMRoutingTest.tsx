/**
 * OSM Routing Test Component
 * Simple test page to verify OpenStreetMap + Leaflet integration
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { routingServiceOSM } from '../services/routingServiceOSM';
import { LeafletPageService } from '../services/leafletPage';

export function OSMRoutingTest() {
  const [mapHTML, setMapHTML] = useState<string>('');
  const [showMap, setShowMap] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Test coordinates (Colombo to Kandy)
  const testRoute = {
    origin: { latitude: 6.9271, longitude: 79.8612 }, // Colombo
    destination: { latitude: 7.2906, longitude: 80.6337 }, // Kandy
  };

  const testOSMRouting = async () => {
    setLoading(true);
    console.log('🧪 Testing OSM routing...');

    try {
      // Test the routing service
      const route = await routingServiceOSM.getRoute(
        testRoute.origin,
        testRoute.destination,
        { mode: 'driving', fallbackToStraightLine: true }
      );

      if (route) {
        console.log('✅ Route received:', {
          distance: route.distance + 'km',
          duration: route.duration + 'min',
          coordinates: route.coordinates.length + ' points',
          isFallback: route.isFallback
        });

        // Generate map HTML
        const html = LeafletPageService.generateMapHTML({
          userLocation: testRoute.origin,
          destination: {
            latitude: testRoute.destination.latitude,
            longitude: testRoute.destination.longitude,
            name: 'Kandy',
            description: 'Temple of the Sacred Tooth Relic'
          },
          routeCoordinates: route.coordinates,
          showFallbackMessage: route.isFallback,
          fallbackMessage: route.isFallback ? 'Using fallback route' : undefined
        });

        setMapHTML(html);
        setShowMap(true);

        Alert.alert(
          'OSM Routing Test',
          `✅ Success!\n\nDistance: ${route.distance}km\nTime: ${route.duration}min\nRoute type: ${route.isFallback ? 'Fallback' : 'OSRM'}\nPoints: ${route.coordinates.length}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('OSM Routing Test', '❌ Failed to get route');
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      Alert.alert('OSM Routing Test', `❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnectivity = async () => {
    setLoading(true);
    console.log('🧪 Testing OSRM connectivity...');

    try {
      const isConnected = await routingServiceOSM.testConnectivity();
      Alert.alert(
        'Connectivity Test',
        isConnected 
          ? '✅ OSRM server is reachable and working!' 
          : '⚠️ OSRM server is not reachable. Will use fallback routes.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Connectivity test error:', error);
      Alert.alert('Connectivity Test', `❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const showSimpleMap = () => {
    const html = LeafletPageService.generateSimpleMapHTML(
      7.2906, // Kandy latitude
      80.6337, // Kandy longitude
      'Temple of the Sacred Tooth Relic',
      'UNESCO World Heritage Site in Kandy'
    );
    setMapHTML(html);
    setShowMap(true);
  };

  if (showMap) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowMap(false)}
          >
            <Text style={styles.backButtonText}>← Back to Tests</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OpenStreetMap Test</Text>
        </View>
        
        <WebView
          style={styles.webview}
          source={{ html: mapHTML }}
          javaScriptEnabled={true}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('Test WebView error:', nativeEvent);
            Alert.alert('Map Error', 'Failed to load test map');
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading test map...</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OSM Routing Tests</Text>
        <Text style={styles.headerSubtitle}>
          Test OpenStreetMap + Leaflet integration
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>🗺️ Routing Tests</Text>
          
          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={testOSMRouting}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>
              {loading ? 'Testing Route...' : 'Test Colombo → Kandy Route'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={testConnectivity}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>
              {loading ? 'Testing...' : 'Test OSRM Connectivity'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>🗺️ Map Tests</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={showSimpleMap}
          >
            <Text style={styles.testButtonText}>Show Simple Map (Kandy)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Test Information</Text>
          <Text style={styles.infoText}>
            • Uses OSRM demo server (no API keys){'\n'}
            • Falls back to straight line if OSRM fails{'\n'}
            • OpenStreetMap tiles with proper attribution{'\n'}
            • Secure WebView implementation{'\n'}
            • Free and open source solution
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  testSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
