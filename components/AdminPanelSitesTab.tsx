import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { collection, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { databaseService } from '../services/database';

interface Site {
  id: string;
  name: string;
  location: string;
  district: string;
  distance: string;
  rating: number;
  image: string;
  category: string;
  description: string;
  openingHours: string;
  entranceFee: string;
  gallery: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface AdminPanelSitesTabProps {
  onEditSite: (site: Site) => void;
  onManageGallery: (site: Site) => void;
}

export function AdminPanelSitesTab({ onEditSite, onManageGallery }: AdminPanelSitesTabProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSitesFromFirestore();
    
    // Set up real-time listener for sites collection
    const unsubscribe = onSnapshot(
      collection(firestore, 'sites'),
      (snapshot) => {
        const sitesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Site[];
        setSites(sitesData);
        setLoading(false);
        
        // Also sync to local SQLite
        syncSitesToSQLite(sitesData);
      },
      (error) => {
        console.error('Error listening to sites:', error);
        // Fallback to local SQLite data
        loadSitesFromSQLite();
      }
    );

    return () => unsubscribe();
  }, []);

  const loadSitesFromFirestore = async () => {
    try {
      setLoading(true);
      const sitesCollection = collection(firestore, 'sites');
      const sitesSnapshot = await getDocs(sitesCollection);
      
      const sitesData = sitesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Site[];
      
      setSites(sitesData);
      
      // Sync to local SQLite for offline access
      await syncSitesToSQLite(sitesData);
      
    } catch (error) {
      console.error('Error loading sites from Firestore:', error);
      Alert.alert('Error', 'Failed to load sites from server. Loading cached data...');
      
      // Fallback to local SQLite data
      await loadSitesFromSQLite();
    } finally {
      setLoading(false);
    }
  };

  const loadSitesFromSQLite = async () => {
    try {
      const localSites = await databaseService.getAllSites();
      setSites(localSites.map(site => ({
        ...site,
        id: site.id.toString(),
        gallery: site.gallery ? JSON.parse(site.gallery) : []
      })));
    } catch (error) {
      console.error('Error loading sites from SQLite:', error);
      Alert.alert('Error', 'Failed to load sites');
    }
  };

  const syncSitesToSQLite = async (sitesData: Site[]) => {
    try {
      // Clear existing sites and insert new ones
      for (const site of sitesData) {
        await databaseService.insertOrUpdateSite({
          ...site,
          id: parseInt(site.id) || Date.now(),
          gallery: JSON.stringify(site.gallery || [])
        });
      }
    } catch (error) {
      console.error('Error syncing sites to SQLite:', error);
    }
  };

  const handleDeleteSite = async (siteId: string, siteName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${siteName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Firestore
              await deleteDoc(doc(firestore, 'sites', siteId));
              
              // Delete from local SQLite
              await databaseService.deleteSite(parseInt(siteId));
              
              // Log admin action
              await logAdminAction('delete', siteId);
              
              Alert.alert('Success', 'Site deleted successfully!');
              
              // Sites will be automatically updated via the onSnapshot listener
              
            } catch (error) {
              console.error('Error deleting site:', error);
              Alert.alert('Error', 'Failed to delete site. Please try again.');
            }
          }
        }
      ]
    );
  };

  const logAdminAction = async (action: 'edit' | 'delete' | 'add', siteId: string) => {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(firestore, 'admin_logs'), {
        action,
        siteId,
        timestamp: serverTimestamp(),
        adminId: 'current-admin' // You can get this from Firebase Auth
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't show error to user as this is just logging
    }
  };

  const refreshSites = () => {
    loadSitesFromFirestore();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading sites...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.sitesList}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Manage Heritage Sites</Text>
        <Badge style={styles.badge}>{sites.length} Sites</Badge>
      </View>
      
      {sites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sites found</Text>
          <Text style={styles.emptySubtext}>Add your first heritage site to get started</Text>
        </View>
      ) : (
        sites.map(site => (
          <Card key={site.id} style={styles.siteCard}>
            <CardContent style={styles.siteCardContent}>
              {/* Site Image */}
              {site.image && (
                <View style={styles.siteImageContainer}>
                  <Image
                    source={{ uri: site.image }}
                    style={styles.siteImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <View style={styles.siteInfo}>
                <Text style={styles.siteName}>{site.name}</Text>
                <Text style={styles.siteLocation}>{site.location}, {site.district}</Text>
                <View style={styles.siteMetadata}>
                  <Badge style={styles.categoryBadge}>{site.category}</Badge>
                  <Text style={styles.rating}>⭐ {site.rating}</Text>
                </View>
                {!site.image && (
                  <Text style={styles.noImageText}>📷 No main image</Text>
                )}
              </View>
              
              <View style={styles.siteActions}>
                <TouchableOpacity
                  onPress={() => onEditSite(site)}
                  style={[styles.actionButton, { marginLeft: 0 }]}
                >
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => onManageGallery(site)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>🖼️ Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleDeleteSite(site.id, site.name)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sitesList: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#1E40AF',
  },
  siteCard: {
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  siteCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  siteImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  siteImage: {
    width: '100%',
    height: '100%',
  },
  siteInfo: {
    flex: 1,
    paddingRight: 12,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  siteLocation: {
    fontSize: 15,
    color: '#6366F1',
    marginBottom: 6,
    fontWeight: '500',
  },
  siteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryBadge: {
    backgroundColor: '#C7D2FE',
    color: '#3730A3',
    marginRight: 10,
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rating: {
    fontSize: 15,
    color: '#F59E42',
    fontWeight: '600',
  },
  noImageText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  siteActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    marginLeft: 0,
    marginBottom: 6,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 15,
    color: '#3730A3',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});