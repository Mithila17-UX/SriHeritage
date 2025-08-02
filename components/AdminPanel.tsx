import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, Modal, FlatList, Dimensions } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminPanelProps {
  onLogout: () => void;
}

interface Site {
  id: number;
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

type TabType = 'sites' | 'add-site' | 'analytics' | 'settings';

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sites');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddGalleryModalVisible, setIsAddGalleryModalVisible] = useState(false);
  const [newGalleryImage, setNewGalleryImage] = useState('');
  const [isImagePickerModalVisible, setIsImagePickerModalVisible] = useState(false);
  const [isLocationPickerModalVisible, setIsLocationPickerModalVisible] = useState(false);
  const [isGalleryGridVisible, setIsGalleryGridVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imagePickerMode, setImagePickerMode] = useState<'main' | 'gallery'>('main');
  
  // Form states for adding/editing sites
  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    location: '',
    district: '',
    distance: '',
    rating: 0,
    image: '',
    category: '',
    description: '',
    openingHours: '',
    entranceFee: '',
    gallery: [],
    coordinates: { latitude: 0, longitude: 0 }
  });

  // Load sites from AsyncStorage
  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const storedSites = await AsyncStorage.getItem('sri-heritage-sites');
      if (storedSites) {
        setSites(JSON.parse(storedSites));
      } else {
        // Initialize with default sites
        const defaultSites: Site[] = [
          {
            id: 1,
            name: 'Temple of the Sacred Tooth Relic',
            location: 'Kandy',
            district: 'Kandy',
            distance: '120 km',
            rating: 4.8,
            image: 'https://example.com/tooth-temple.jpg',
            category: 'Religious',
            description: 'Sri Dalada Maligawa, commonly known as the Temple of the Sacred Tooth Relic, is a Buddhist temple in Kandy, Sri Lanka.',
            openingHours: '5:30 AM - 8:00 PM',
            entranceFee: 'Rs. 1,500 (Foreign), Rs. 100 (Local)',
            gallery: [],
            coordinates: { latitude: 7.2936, longitude: 80.6413 }
          },
          {
            id: 2,
            name: 'Sigiriya Rock Fortress',
            location: 'Matale District',
            district: 'Matale',
            distance: '169 km',
            rating: 4.9,
            image: 'https://example.com/sigiriya.jpg',
            category: 'Archaeological',
            description: 'Sigiriya or Sinhagiri is an ancient rock fortress located in the northern Matale District near the town of Dambulla.',
            openingHours: '6:00 AM - 5:00 PM',
            entranceFee: 'USD 30 (Foreign), Rs. 100 (Local)',
            gallery: [],
            coordinates: { latitude: 7.9570, longitude: 80.7603 }
          }
        ];
        setSites(defaultSites);
        await AsyncStorage.setItem('sri-heritage-sites', JSON.stringify(defaultSites));
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const saveSites = async (updatedSites: Site[]) => {
    try {
      await AsyncStorage.setItem('sri-heritage-sites', JSON.stringify(updatedSites));
      setSites(updatedSites);
    } catch (error) {
      console.error('Error saving sites:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleAddSite = async () => {
    try {
      console.log('Adding site with data:', formData);
      
      if (!formData.name || !formData.location || !formData.coordinates?.latitude || !formData.coordinates?.longitude) {
        Alert.alert('Error', 'Please fill in all required fields including coordinates');
        return;
      }

      const newSite: Site = {
        id: Date.now(),
        name: formData.name || '',
        location: formData.location || '',
        district: formData.district || '',
        distance: formData.distance || '',
        rating: formData.rating || 0,
        image: formData.image || '',
        category: formData.category || '',
        description: formData.description || '',
        openingHours: formData.openingHours || '',
        entranceFee: formData.entranceFee || '',
        gallery: formData.gallery || [],
        coordinates: formData.coordinates || { latitude: 0, longitude: 0 }
      };

      const updatedSites = [...sites, newSite];
      await saveSites(updatedSites);
      
      Alert.alert('Success', 'New site added successfully!');
      setFormData({
        name: '',
        location: '',
        district: '',
        distance: '',
        rating: 0,
        image: '',
        category: '',
        description: '',
        openingHours: '',
        entranceFee: '',
        gallery: [],
        coordinates: { latitude: 0, longitude: 0 }
      });
      setActiveTab('sites');
    } catch (error) {
      console.error('Error adding site:', error);
      Alert.alert('Error', 'Failed to add site. Please try again.');
    }
  };

  const handleUpdateSite = async () => {
    try {
      if (!selectedSite) return;

      const updatedSites = sites.map(site => 
        site.id === selectedSite.id ? { ...site, ...formData, id: site.id } : site
      );
      
      await saveSites(updatedSites);
      Alert.alert('Success', 'Site updated successfully!');
      setIsEditModalVisible(false);
      setSelectedSite(null);
    } catch (error) {
      console.error('Error updating site:', error);
      Alert.alert('Error', 'Failed to update site. Please try again.');
    }
  };

  const handleDeleteSite = async (siteId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this heritage site?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedSites = sites.filter(site => site.id !== siteId);
            await saveSites(updatedSites);
            Alert.alert('Success', 'Site deleted successfully!');
          }
        }
      ]
    );
  };

  const handleAddGalleryImage = async () => {
    if (!selectedSite || !newGalleryImage) return;

    const updatedSites = sites.map(site => {
      if (site.id === selectedSite.id) {
        return {
          ...site,
          gallery: [...site.gallery, newGalleryImage]
        };
      }
      return site;
    });

    await saveSites(updatedSites);
    setSelectedSite({ ...selectedSite, gallery: [...selectedSite.gallery, newGalleryImage] });
    setNewGalleryImage('');
    Alert.alert('Success', 'Image added to gallery!');
  };

  const handleRemoveGalleryImage = async (imageUrl: string) => {
    if (!selectedSite) return;

    const updatedSites = sites.map(site => {
      if (site.id === selectedSite.id) {
        return {
          ...site,
          gallery: site.gallery.filter(img => img !== imageUrl)
        };
      }
      return site;
    });

    await saveSites(updatedSites);
    setSelectedSite({ ...selectedSite, gallery: selectedSite.gallery.filter(img => img !== imageUrl) });
    Alert.alert('Success', 'Image removed from gallery!');
  };

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imagePickerMode === 'main') {
          setFormData({ ...formData, image: imageUri });
        } else {
          setNewGalleryImage(imageUri);
        }
        setIsImagePickerModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imagePickerMode === 'main') {
          setFormData({ ...formData, image: imageUri });
        } else {
          setNewGalleryImage(imageUri);
        }
        setIsImagePickerModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openGoogleMapsLocationPicker = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to use this feature');
        return;
      }

      Alert.alert(
        'Choose Location Method',
        'How would you like to select the location?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Current Location', 
            onPress: async () => {
              try {
                const location = await Location.getCurrentPositionAsync({});
                setFormData({
                  ...formData,
                  coordinates: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                  }
                });
                Alert.alert('Success', 'Current location has been set!');
              } catch (error) {
                Alert.alert('Error', 'Failed to get current location');
              }
            }
          },
          { 
            text: 'Open Google Maps', 
            onPress: () => {
              const mapsUrl = `https://www.google.com/maps/@${formData.coordinates?.latitude || 7.8731},${formData.coordinates?.longitude || 80.7718},15z`;
              Linking.openURL(mapsUrl);
              Alert.alert(
                'Instructions',
                'In Google Maps:\n1. Long press on the desired location\n2. Copy the coordinates from the info panel\n3. Return to the app and enter them manually',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to access location services');
    }
  };

  const handleBulkRemoveImages = async () => {
    if (!selectedSite || selectedImages.length === 0) return;

    Alert.alert(
      'Confirm Removal',
      `Remove ${selectedImages.length} selected image(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedSites = sites.map(site => {
              if (site.id === selectedSite.id) {
                return {
                  ...site,
                  gallery: site.gallery.filter(img => !selectedImages.includes(img))
                };
              }
              return site;
            });

            await saveSites(updatedSites);
            setSelectedSite({ 
              ...selectedSite, 
              gallery: selectedSite.gallery.filter(img => !selectedImages.includes(img)) 
            });
            setSelectedImages([]);
            Alert.alert('Success', `${selectedImages.length} image(s) removed from gallery!`);
          }
        }
      ]
    );
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl)
        ? prev.filter(img => img !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const renderSitesList = () => (
    <ScrollView style={styles.sitesList}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Manage Heritage Sites</Text>
        <Badge style={styles.badge}>{sites.length} Sites</Badge>
      </View>
      
      {sites.map(site => (
        <Card key={site.id} style={styles.siteCard}>
          <CardContent style={styles.siteCardContent}>
            <View style={styles.siteInfo}>
              <Text style={styles.siteName}>{site.name}</Text>
              <Text style={styles.siteLocation}>{site.location}, {site.district}</Text>
              <View style={styles.siteMetadata}>
                <Badge style={styles.categoryBadge}>{site.category}</Badge>
                <Text style={styles.rating}>⭐ {site.rating}</Text>
              </View>
            </View>
            
            <View style={styles.siteActions}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedSite(site);
                  setFormData(site);
                  setIsEditModalVisible(true);
                }}
                style={[styles.actionButton, { marginLeft: 0 }]}
              >
                <Text style={styles.actionButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setSelectedSite(site);
                  setIsAddGalleryModalVisible(true);
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>🖼️ Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleDeleteSite(site.id)}
                style={[styles.actionButton, styles.deleteButton]}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      ))}
    </ScrollView>
  );

  const renderAddSiteForm = () => (
    <ScrollView style={styles.formContainer}>
      <Card style={styles.formCard}>
        <CardHeader>
          <Text style={styles.formTitle}>Add New Heritage Site</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.formGroup}>
            <Label style={styles.label}>Site Name *</Label>
            <Input
              placeholder="Enter site name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Label style={styles.label}>Location *</Label>
            <Input
              placeholder="Enter location"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              style={styles.input}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Label style={styles.label}>District</Label>
              <Input
                placeholder="Enter district"
                value={formData.district}
                onChangeText={(text) => setFormData({ ...formData, district: text })}
                style={styles.input}
              />
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Label style={styles.label}>Distance</Label>
              <Input
                placeholder="e.g., 120 km"
                value={formData.distance}
                onChangeText={(text) => setFormData({ ...formData, distance: text })}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Label style={styles.label}>Category</Label>
            <Input
              placeholder="e.g., Religious, Archaeological"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Label style={styles.label}>Coordinates (from Google Maps) *</Label>
            <View style={styles.coordinatesContainer}>
              <View style={styles.coordinateInput}>
                <Label style={styles.coordinateLabel}>Latitude</Label>
                <Input
                  placeholder="e.g., 7.2936"
                  value={formData.coordinates?.latitude.toString()}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    coordinates: { 
                      ...formData.coordinates!, 
                      latitude: parseFloat(text) || 0 
                    } 
                  })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.coordinateInput}>
                <Label style={styles.coordinateLabel}>Longitude</Label>
                <Input
                  placeholder="e.g., 80.6413"
                  value={formData.coordinates?.longitude.toString()}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    coordinates: { 
                      ...formData.coordinates!, 
                      longitude: parseFloat(text) || 0 
                    } 
                  })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.locationPickerButton}
              onPress={openGoogleMapsLocationPicker}
            >
              <Text style={styles.locationPickerButtonText}>🗺️ Choose Location from Google Maps</Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              💡 Tip: Use the button above to pick location or manually enter coordinates
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Label style={styles.label}>Description</Label>
            <TextInput
              placeholder="Enter site description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={styles.textarea}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Label style={styles.label}>Opening Hours</Label>
              <Input
                placeholder="e.g., 6:00 AM - 5:00 PM"
                value={formData.openingHours}
                onChangeText={(text) => setFormData({ ...formData, openingHours: text })}
                style={styles.input}
              />
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Label style={styles.label}>Entrance Fee</Label>
              <Input
                placeholder="e.g., Rs. 1,500"
                value={formData.entranceFee}
                onChangeText={(text) => setFormData({ ...formData, entranceFee: text })}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Label style={styles.label}>Main Image</Label>
            <Input
              placeholder="Enter image URL or use picker below"
              value={formData.image}
              onChangeText={(text) => setFormData({ ...formData, image: text })}
              style={styles.input}
            />
            <View style={styles.imagePickerButtons}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => {
                  setImagePickerMode('main');
                  setIsImagePickerModalVisible(true);
                }}
              >
                <Text style={styles.imagePickerButtonText}>📱 Pick from Device</Text>
              </TouchableOpacity>
            </View>
            {formData.image && (
              <Image
                source={{ uri: formData.image }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Label style={styles.label}>Rating (0-5)</Label>
            <Input
              placeholder="e.g., 4.8"
              value={formData.rating?.toString()}
              onChangeText={(text) => setFormData({ ...formData, rating: parseFloat(text) || 0 })}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <Button
            onPress={handleAddSite}
            style={styles.submitButton}
          >
            Add Heritage Site
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.analyticsContainer}>
      <Text style={styles.sectionTitle}>Analytics Dashboard</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>{sites.length}</Text>
            <Text style={styles.statLabel}>Total Sites</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>
              {sites.filter(s => s.category === 'Religious').length}
            </Text>
            <Text style={styles.statLabel}>Religious Sites</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>
              {sites.filter(s => s.category === 'Archaeological').length}
            </Text>
            <Text style={styles.statLabel}>Archaeological Sites</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent>
            <Text style={styles.statValue}>
              {(sites.reduce((acc, site) => acc + site.rating, 0) / sites.length).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.recentActivityCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>Recent Activity</Text>
        </CardHeader>
        <CardContent>
          <Text style={styles.activityItem}>• Admin logged in</Text>
          <Text style={styles.activityItem}>• {sites.length} sites currently managed</Text>
          <Text style={styles.activityItem}>• Last update: Just now</Text>
        </CardContent>
      </Card>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.settingsContainer}>
      <Card style={styles.settingsCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>Admin Settings</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Admin Email</Text>
            <Text style={styles.settingValue}>Admin@SriHeritage</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Role</Text>
            <Text style={styles.settingValue}>Super Administrator</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Last Login</Text>
            <Text style={styles.settingValue}>{new Date().toLocaleString()}</Text>
          </View>

          <Button
            onPress={onLogout}
            style={styles.logoutButton}
          >
            Logout from Admin Panel
          </Button>
        </CardContent>
      </Card>

      <Card style={styles.settingsCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>App Settings</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto-sync</Text>
            <Text style={styles.settingValue}>Enabled ✅</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Enabled ✅</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Data Backup</Text>
            <Text style={styles.settingValue}>Daily at 2:00 AM</Text>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );

  const renderContent = () => {
    console.log('Active tab:', activeTab);
    switch (activeTab) {
      case 'sites':
        return renderSitesList();
      case 'add-site':
        return renderAddSiteForm();
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return renderSettings();
      default:
        return renderSitesList();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sri Heritage Admin Panel</Text>
        <Text style={styles.headerSubtitle}>Manage Heritage Sites & Content</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => {
            console.log('Sites tab pressed');
            setActiveTab('sites');
          }}
          style={[styles.tab, activeTab === 'sites' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'sites' && styles.activeTabText]}>
            📍 Sites
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            console.log('Add Site tab pressed');
            setActiveTab('add-site');
          }}
          style={[styles.tab, activeTab === 'add-site' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'add-site' && styles.activeTabText]}>
            ➕ Add Site
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            console.log('Analytics tab pressed');
            setActiveTab('analytics');
          }}
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            📊 Analytics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            console.log('Settings tab pressed');
            setActiveTab('settings');
          }}
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            ⚙️ Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Enhanced Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Heritage Site Details</Text>
              
              <View style={styles.formGroup}>
                <Label style={styles.label}>Site Name *</Label>
                <Input
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Label style={styles.label}>Location *</Label>
                <Input
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  style={styles.input}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Label style={styles.label}>District</Label>
                  <Input
                    value={formData.district}
                    onChangeText={(text) => setFormData({ ...formData, district: text })}
                    style={styles.input}
                  />
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Label style={styles.label}>Distance</Label>
                  <Input
                    value={formData.distance}
                    onChangeText={(text) => setFormData({ ...formData, distance: text })}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Label style={styles.label}>Category</Label>
                <Input
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Label style={styles.label}>Main Image</Label>
                <Input
                  value={formData.image}
                  onChangeText={(text) => setFormData({ ...formData, image: text })}
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => {
                    setImagePickerMode('main');
                    setIsImagePickerModalVisible(true);
                  }}
                >
                  <Text style={styles.imagePickerButtonText}>📱 Pick Image</Text>
                </TouchableOpacity>
                {formData.image && (
                  <Image
                    source={{ uri: formData.image }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Label style={styles.label}>Coordinates *</Label>
                <View style={styles.coordinatesContainer}>
                  <View style={styles.coordinateInput}>
                    <Label style={styles.coordinateLabel}>Latitude</Label>
                    <Input
                      value={formData.coordinates?.latitude.toString()}
                      onChangeText={(text) => setFormData({ 
                        ...formData, 
                        coordinates: { 
                          ...formData.coordinates!, 
                          latitude: parseFloat(text) || 0 
                        } 
                      })}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.coordinateInput}>
                    <Label style={styles.coordinateLabel}>Longitude</Label>
                    <Input
                      value={formData.coordinates?.longitude.toString()}
                      onChangeText={(text) => setFormData({ 
                        ...formData, 
                        coordinates: { 
                          ...formData.coordinates!, 
                          longitude: parseFloat(text) || 0 
                        } 
                      })}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.locationPickerButton}
                  onPress={openGoogleMapsLocationPicker}
                >
                  <Text style={styles.locationPickerButtonText}>🗺️ Choose Location</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Label style={styles.label}>Description</Label>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  style={styles.textarea}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Label style={styles.label}>Opening Hours</Label>
                  <Input
                    value={formData.openingHours}
                    onChangeText={(text) => setFormData({ ...formData, openingHours: text })}
                    style={styles.input}
                  />
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Label style={styles.label}>Entrance Fee</Label>
                  <Input
                    value={formData.entranceFee}
                    onChangeText={(text) => setFormData({ ...formData, entranceFee: text })}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Label style={styles.label}>Rating (0-5)</Label>
                <Input
                  value={formData.rating?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, rating: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  onPress={() => setIsEditModalVisible(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleUpdateSite}
                  style={styles.saveButton}
                >
                  Save Changes
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Enhanced Gallery Modal */}
      <Modal
        visible={isAddGalleryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsAddGalleryModalVisible(false);
          setSelectedImages([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Manage Gallery - {selectedSite?.name}</Text>
              
              <View style={styles.formGroup}>
                <Label style={styles.label}>Add New Image</Label>
                <Input
                  placeholder="Enter image URL"
                  value={newGalleryImage}
                  onChangeText={setNewGalleryImage}
                  style={styles.input}
                />
                <View style={styles.galleryButtonsRow}>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={() => {
                      setImagePickerMode('gallery');
                      setIsImagePickerModalVisible(true);
                    }}
                  >
                    <Text style={styles.imagePickerButtonText}>📱 Pick Image</Text>
                  </TouchableOpacity>
                  <Button
                    onPress={handleAddGalleryImage}
                    style={styles.addImageButton}
                  >
                    Add to Gallery
                  </Button>
                </View>
              </View>

              <View style={styles.galleryHeader}>
                <Text style={styles.galleryTitle}>Gallery Images ({selectedSite?.gallery.length || 0})</Text>
                {selectedImages.length > 0 && (
                  <TouchableOpacity
                    style={styles.bulkRemoveButton}
                    onPress={handleBulkRemoveImages}
                  >
                    <Text style={styles.bulkRemoveText}>Remove Selected ({selectedImages.length})</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.galleryGrid}>
                {selectedSite?.gallery.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.galleryGridItem,
                      selectedImages.includes(image) && styles.selectedGalleryItem
                    ]}
                    onPress={() => toggleImageSelection(image)}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.galleryGridImage}
                      resizeMode="cover"
                    />
                    {selectedImages.includes(image) && (
                      <View style={styles.selectedOverlay}>
                        <Text style={styles.selectedCheck}>✓</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.quickRemoveButton}
                      onPress={() => handleRemoveGalleryImage(image)}
                    >
                      <Text style={styles.quickRemoveText}>×</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button
                  onPress={() => {
                    setIsAddGalleryModalVisible(false);
                    setSelectedImages([]);
                  }}
                  style={styles.closeButton}
                >
                  Close
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={isImagePickerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsImagePickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>
            
            <TouchableOpacity
              style={styles.imageSourceButton}
              onPress={pickImageFromGallery}
            >
              <Text style={styles.imageSourceIcon}>🖼️</Text>
              <View style={styles.imageSourceTextContainer}>
                <Text style={styles.imageSourceTitle}>Photo Gallery</Text>
                <Text style={styles.imageSourceSubtitle}>Choose from your photo library</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageSourceButton}
              onPress={pickImageFromCamera}
            >
              <Text style={styles.imageSourceIcon}>📷</Text>
              <View style={styles.imageSourceTextContainer}>
                <Text style={styles.imageSourceTitle}>Camera</Text>
                <Text style={styles.imageSourceSubtitle}>Take a new photo</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <Button
                onPress={() => setIsImagePickerModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#DBEAFE',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#1E40AF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
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
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  siteCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  siteLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  siteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
    marginRight: 8,
  },
  rating: {
    fontSize: 14,
    color: '#6B7280',
  },
  siteActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1F2937',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  formContainer: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
    marginHorizontal: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  textarea: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 14,
  },
  coordinatesContainer: {
    flexDirection: 'row',
  },
  coordinateInput: {
    flex: 1,
    marginHorizontal: 6,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#1E40AF',
    marginTop: 8,
  },
  analyticsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    margin: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  recentActivityCard: {
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  settingsContainer: {
    padding: 16,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#1E40AF',
  },
  closeButton: {
    backgroundColor: '#1E40AF',
    width: '100%',
  },
  addImageButton: {
    backgroundColor: '#10B981',
    marginTop: 8,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  galleryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginBottom: 8,
  },
  galleryImageUrl: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  removeImageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  removeImageText: {
    fontSize: 12,
    color: '#DC2626',
  },
  // New styles for enhanced features
  imagePickerButtons: {
    marginTop: 8,
  },
  imagePickerButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  locationPickerButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  locationPickerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  bulkRemoveButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  bulkRemoveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  galleryButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryGridItem: {
    width: (Dimensions.get('window').width - 64 - 16) / 3, // Responsive width
    height: 100,
    borderRadius: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGalleryItem: {
    borderColor: '#3B82F6',
  },
  galleryGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickRemoveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  imagePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxHeight: '60%',
  },
  imageSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageSourceIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  imageSourceTextContainer: {
    flex: 1,
  },
  imageSourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  imageSourceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});