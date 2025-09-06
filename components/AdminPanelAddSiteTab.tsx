import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader } from './ui/card';
import { ImagePickerModal } from './ImagePickerModal';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { databaseService } from '../services/database';
import { adminLogsService } from '../services/adminLogs';
import { ImageUploadService } from '../services/imageUpload';
import { DistanceCalculatorService } from '../services/distanceCalculator';
import { AdminNearbyEditor, NearbyRef } from './AdminNearbyEditor';

interface SiteFormData {
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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  // BEGIN nearby-admin
  subplaces: NearbyRef[];
  nearby: NearbyRef[];
  // END nearby-admin
}

interface AdminPanelAddSiteTabProps {
  onSiteAdded?: () => void;
}

export function AdminPanelAddSiteTab({ onSiteAdded }: AdminPanelAddSiteTabProps) {
  const [formData, setFormData] = useState<SiteFormData>({
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
    coordinates: { latitude: 0, longitude: 0 },
    // BEGIN nearby-admin
    subplaces: [],
    nearby: []
    // END nearby-admin
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Optional field
    return ImageUploadService.validateImageUrl(url) || !url.trim();
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    // Required fields
    if (!formData.name.trim()) errors.push('Site name is required');
    if (!formData.location.trim()) errors.push('Location is required');
    if (!formData.coordinates.latitude || !formData.coordinates.longitude) {
      errors.push('Coordinates are required');
    }
    
    // Rating validation
    if (formData.rating < 0 || formData.rating > 5) {
      errors.push('Rating must be between 0 and 5');
    }
    
    // Image URL validation
    if (formData.image && !validateImageUrl(formData.image)) {
      errors.push('Main image must be a valid URL ending in .jpg, .jpeg, .png, or .webp');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return false;
    }
    
    return true;
  };

  const handleAddSite = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create site document first to get ID
      const siteData = {
        ...formData,
        gallery: [],
        // BEGIN nearby-admin
        subplaces: formData.subplaces,
        nearby: formData.nearby,
        // END nearby-admin
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(firestore, 'sites'), siteData);
      const siteId = docRef.id;
      
      // Image URL is already validated and included in siteData
      // No upload needed - using direct URL
      
      // Add to local SQLite
      try {
        await databaseService.insertOrUpdateSite({
          id: parseInt(siteId.replace(/[^0-9]/g, '')) || Date.now(),
          name: formData.name,
          location: formData.location,
          district: formData.district,
          distance: formData.distance,
          rating: formData.rating,
          image: formData.image,
          image_url: formData.image, // For compatibility
          category: formData.category,
          description: formData.description,
          openingHours: formData.openingHours,
          visiting_hours: formData.openingHours, // For compatibility
          entranceFee: formData.entranceFee,
          entry_fee: formData.entranceFee, // For compatibility
          gallery: JSON.stringify([]),
          coordinates: formData.coordinates,
          latitude: formData.coordinates.latitude,
          longitude: formData.coordinates.longitude,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (sqliteError) {
        console.error('Error saving to SQLite:', sqliteError);
        // Don't show error to user as Firestore save succeeded
      }
      
      // Log admin action
      await adminLogsService.logSiteAdded(siteId, formData.name);
      
      Alert.alert('Success', 'Heritage site added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            clearForm();
            onSiteAdded?.();
          }
        }
      ]);
      
    } catch (error) {
      console.error('Error adding site:', error);
      Alert.alert('Error', 'Failed to add site. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const clearForm = () => {
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
      coordinates: { latitude: 0, longitude: 0 },
      // BEGIN nearby-admin
      subplaces: [],
      nearby: []
      // END nearby-admin
    });
  };

  const handleImageSelected = (imageUrl: string) => {
    setFormData({ ...formData, image: imageUrl });
  };

  const calculateDistance = async () => {
    const { district, coordinates } = formData;
    
    if (!district.trim() || coordinates.latitude === 0 || coordinates.longitude === 0) {
      return;
    }
    
    setIsCalculatingDistance(true);
    try {
      const calculatedDistance = await DistanceCalculatorService.autoCalculateDistance(
        district,
        coordinates.latitude,
        coordinates.longitude
      );
      
      console.log('📏 Calculated distance for new site:', calculatedDistance);
      setFormData(prev => ({ ...prev, distance: calculatedDistance }));
      
    } catch (error) {
      console.error('Error calculating distance:', error);
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  // Auto-calculate distance when district or coordinates change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateDistance();
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(timer);
  }, [formData.district, formData.coordinates.latitude, formData.coordinates.longitude]);

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



  return (
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
              <Label style={styles.label}>
                Distance {isCalculatingDistance && '(Calculating...)'}
              </Label>
              <Input
                placeholder="Will auto-calculate from district center"
                value={formData.distance}
                onChangeText={(text) => setFormData({ ...formData, distance: text })}
                style={isCalculatingDistance ? {...styles.input, ...styles.inputCalculating} : styles.input}
                disabled={isCalculatingDistance}
              />
              <Text style={styles.helpText}>
                💡 Auto-calculated from district center when coordinates are set
              </Text>
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
            
            {/* Manual Calculate Button */}
            {formData.district && (formData.coordinates.latitude !== 0 || formData.coordinates.longitude !== 0) && (
              <TouchableOpacity
                style={styles.calculateButton}
                onPress={calculateDistance}
                disabled={isCalculatingDistance}
              >
                <Text style={styles.calculateButtonText}>
                  {isCalculatingDistance ? '📏 Calculating...' : '📏 Recalculate Distance'}
                </Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.helpText}>
              💡 Distance will auto-calculate when district and coordinates are entered
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
            
            <View style={styles.imageInputContainer}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => setShowImagePicker(true)}
              >
                <Text style={styles.imagePickerButtonText}>📷 Select Image</Text>
              </TouchableOpacity>
              
              <Text style={styles.imageInputSeparator}>or</Text>
              
              <Input
                placeholder="Enter image URL manually"
                value={formData.image}
                onChangeText={(text) => setFormData({ ...formData, image: text })}
                style={
                  (!validateImageUrl(formData.image) && formData.image) 
                    ? {...styles.input, ...styles.inputError} 
                    : styles.input
                }
              />
            </View>
            
            <Text style={styles.helpText}>
              💡 Use the button above to pick/capture/search images, or enter a URL manually
            </Text>
            
            {formData.image && validateImageUrl(formData.image) && (
              <View style={styles.imagePreviewContainer}>
                <Text style={styles.imagePreviewLabel}>Preview:</Text>
                <Image
                  source={{ uri: formData.image }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                  onError={() => Alert.alert('Error', 'Failed to load image from URL')}
                />
              </View>
            )}
            
            {formData.image && !validateImageUrl(formData.image) && (
              <Text style={styles.errorText}>
                ❌ Invalid image URL format
              </Text>
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

          {/* BEGIN nearby-admin */}
          {/* Nearby Management Section */}
          <View style={styles.nearbySection}>
            <AdminNearbyEditor
              title="Within This Site"
              value={formData.subplaces}
              onChange={(subplaces) => setFormData({ ...formData, subplaces })}
              testID="subplaces-editor"
            />
            
            <AdminNearbyEditor
              title="Nearby Attractions"
              value={formData.nearby}
              onChange={(nearby) => setFormData({ ...formData, nearby })}
              maxDistanceKm={2}
              testID="nearby-editor"
            />
          </View>
          {/* END nearby-admin */}

          <Button
            onPress={handleAddSite}
            disabled={isSubmitting}
            style={isSubmitting ? {...styles.submitButton, ...styles.submitButtonDisabled} : styles.submitButton}
          >
            {isSubmitting ? 'Adding Site...' : 'Add Heritage Site'}
          </Button>
        </CardContent>
      </Card>

      <ImagePickerModal
        visible={showImagePicker}
        onCancel={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
  },
  formCard: {
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
    marginBottom: 16,
    marginTop: 8,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  imageInputContainer: {
    gap: 12,
  },
  imagePickerButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  imagePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageInputSeparator: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  imagePreviewContainer: {
    marginTop: 12,
    gap: 8,
  },
  imagePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
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
  inputCalculating: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  calculateButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // BEGIN nearby-admin
  nearbySection: {
    marginTop: 16,
    marginBottom: 16,
    gap: 16,
  },
  // END nearby-admin
});