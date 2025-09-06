import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getSitesFromFirestore, FirestoreSite } from '../services/firebase';
import { NearbySection } from './NearbySection';

export function NearbyDebugTest() {
  const [sites, setSites] = useState<FirestoreSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<FirestoreSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSites() {
      try {
        setLoading(true);
        const fetchedSites = await getSitesFromFirestore();
        console.log(`Fetched ${fetchedSites.length} sites from Firestore`);
        
        // Log nearby data for debugging
        fetchedSites.forEach(site => {
          if (site.nearby?.length || site.subplaces?.length) {
            console.log(`Site ${site.id} - ${site.name} has:`, {
              nearby: site.nearby?.length || 0,
              subplaces: site.subplaces?.length || 0
            });
          }
        });
        
        setSites(fetchedSites);
        
        // Select first site with nearby data
        const siteWithNearby = fetchedSites.find(site => site.nearby?.length || site.subplaces?.length);
        if (siteWithNearby) {
          setSelectedSite(siteWithNearby);
        } else if (fetchedSites.length > 0) {
          // Just select first site if none have nearby data
          setSelectedSite(fetchedSites[0]);
        }
      } catch (err) {
        console.error('Error fetching sites:', err);
        setError('Failed to load sites from Firestore. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchSites();
  }, []);

  // Convert FirestoreSite to the format expected by NearbySection
  const convertToNearbySectionSite = (site: FirestoreSite) => {
    return {
      id: site.id,
      name: site.name,
      location: site.location,
      category: site.category,
      description: site.description,
      rating: site.rating,
      image: site.image || site.image_url,
      openingHours: site.openingHours || site.visiting_hours,
      nearby: site.nearby?.map(item => ({
        id: parseInt(item.id),
        name: item.name || '',
        category: item.category || '',
        description: 'Nearby attraction',
        distanceKm: item.distanceKm || 0
      })),
      subplaces: site.subplaces?.map(item => ({
        id: parseInt(item.id),
        name: item.name || '',
        category: item.category || '',
        description: 'Within this site',
        distanceKm: item.distanceKm || 0
      }))
    };
  };

  const handleNavigateToSite = (site: any) => {
    // For debugging, just log the navigation
    console.log('Would navigate to site:', site);
    
    // Find the site in our list by ID
    const targetSite = sites.find(s => s.id.toString() === site.id.toString());
    if (targetSite) {
      setSelectedSite(targetSite);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Debug Test</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Loading sites from Firestore...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              getSitesFromFirestore()
                .then(fetchedSites => {
                  setSites(fetchedSites);
                  setLoading(false);
                })
                .catch(err => {
                  console.error('Error retrying fetch:', err);
                  setError('Failed to load sites. Please try again.');
                  setLoading(false);
                });
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Site Selection */}
          <View style={styles.siteSelection}>
            <Text style={styles.sectionTitle}>Select a Site</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.siteButtonsContainer}
            >
              {sites.map(site => (
                <TouchableOpacity
                  key={site.id}
                  style={[
                    styles.siteButton,
                    selectedSite?.id === site.id && styles.selectedSiteButton
                  ]}
                  onPress={() => setSelectedSite(site)}
                >
                  <Text 
                    style={[
                      styles.siteButtonText,
                      selectedSite?.id === site.id && styles.selectedSiteButtonText
                    ]}
                    numberOfLines={1}
                  >
                    {site.name}
                  </Text>
                  {(site.nearby?.length || site.subplaces?.length) ? (
                    <View style={styles.nearbyIndicator}>
                      <Text style={styles.nearbyIndicatorText}>
                        {(site.nearby?.length || 0) + (site.subplaces?.length || 0)}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Selected Site Info */}
          {selectedSite && (
            <View style={styles.selectedSiteInfo}>
              <Text style={styles.selectedSiteName}>{selectedSite.name}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{selectedSite.location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nearby Count:</Text>
                <Text style={styles.infoValue}>{selectedSite.nearby?.length || 0}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Subplaces Count:</Text>
                <Text style={styles.infoValue}>{selectedSite.subplaces?.length || 0}</Text>
              </View>
            </View>
          )}
          
          {/* Nearby Section Component */}
          {selectedSite && (
            <View style={styles.nearbySectionContainer}>
              <Text style={styles.sectionTitle}>Nearby Section Preview</Text>
              <NearbySection
                currentSite={convertToNearbySectionSite(selectedSite)}
                onNavigateToSite={handleNavigateToSite}
                isOffline={false}
              />
            </View>
          )}
          
          {/* Raw Data Debug */}
          {selectedSite && (
            <View style={styles.rawDataContainer}>
              <Text style={styles.sectionTitle}>Raw Nearby Data</Text>
              <Text style={styles.rawDataLabel}>nearby:</Text>
              <Text style={styles.rawDataContent}>
                {selectedSite.nearby?.length 
                  ? JSON.stringify(selectedSite.nearby, null, 2) 
                  : 'No nearby data'}
              </Text>
              <Text style={styles.rawDataLabel}>subplaces:</Text>
              <Text style={styles.rawDataContent}>
                {selectedSite.subplaces?.length 
                  ? JSON.stringify(selectedSite.subplaces, null, 2)
                  : 'No subplaces data'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  siteSelection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  siteButtonsContainer: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  siteButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedSiteButton: {
    backgroundColor: '#EA580C',
  },
  siteButtonText: {
    fontSize: 16,
    color: '#4B5563',
    maxWidth: 150,
  },
  selectedSiteButtonText: {
    color: '#FFFFFF',
  },
  nearbyIndicator: {
    backgroundColor: '#3B82F6',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  nearbyIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedSiteInfo: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSiteName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 120,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  nearbySectionContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rawDataContainer: {
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rawDataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  rawDataContent: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 12,
  }
});
