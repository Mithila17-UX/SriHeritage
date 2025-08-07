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
    const unsubscribe = onSnapshot(collection(firestore, 'sites'),
      (snapshot) => {
        const sitesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Site[];
        setSites(sitesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to sites:', error);
        loadSitesFromSQLite();
      }
    );

    return () => unsubscribe();
  }, []);

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
    } finally {
      setLoading(false);
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
              await deleteDoc(doc(firestore, 'sites', siteId));
              Alert.alert('Success', 'Site deleted successfully!');
            } catch (error) {
              console.error('Error deleting site:', error);
              Alert.alert('Error', 'Failed to delete site. Please try again.');
            }
          }
        }
      ]
    );
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
              <View style={styles.cardTopSection}>
                <View style={styles.siteImageContainer}>
                  {site.image ? (
                    <Image
                      source={{ uri: site.image }}
                      style={styles.siteImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImagePlaceholder}>
                      <Text style={styles.noImageText}>📷</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <Text style={styles.siteDetailText}>{site.location}</Text>
                  <Text style={styles.siteDetailText}>{site.district}</Text>
                  <View style={styles.siteMetadata}>
                    <Badge style={styles.categoryBadge}>{site.category}</Badge>
                    <Text style={styles.rating}>⭐ {site.rating}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.siteActions}>
                <TouchableOpacity onPress={() => onEditSite(site)} style={[styles.actionButton, styles.editButton]}>
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => onManageGallery(site)} style={[styles.actionButton, styles.galleryButton]}>
                  <Text style={styles.actionButtonText}>🖼️ Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleDeleteSite(site.id, site.name)} style={[styles.actionButton, styles.deleteButton]}>
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️ Delete</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    paddingTop: 16, 
    paddingBottom: 16, 
  },
  siteCardContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  siteImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  siteImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  noImageText: {
    fontSize: 30,
    color: '#9CA3AF',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  siteDetailText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  siteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    fontWeight: '600',
  },
  rating: {
    fontSize: 15,
    color: '#F59E42',
    fontWeight: 'bold',
  },
  siteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#F3F4F6',
  },
  galleryButton: {
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButtonText: {
    color: '#DC2626',
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
