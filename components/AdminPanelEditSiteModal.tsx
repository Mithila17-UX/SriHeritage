import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { databaseService } from '../services/database';
import { ImagePickerModal } from './ImagePickerModal';
import { ImageUploadService } from '../services/imageUpload';
import { DistanceCalculatorService, AVAILABLE_DISTRICTS } from '../services/distanceCalculator';
import { AdminNearbyEditor, NearbyRef } from './AdminNearbyEditor';

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
  // BEGIN nearby-admin
  subplaces?: NearbyRef[];
  nearby?: NearbyRef[];
  // END nearby-admin
}

interface AdminPanelEditSiteModalProps {
  visible: boolean;
  site: Site | null;
  onClose: () => void;
  onSiteUpdated: (updatedSite: Site) => void;
  // BEGIN nearby-admin
  onNavigateToSite?: (siteId: string) => void;
  // END nearby-admin
}

export function AdminPanelEditSiteModal({ 
  visible, 
  site, 
  onClose, 
  onSiteUpdated,
  // BEGIN nearby-admin
  onNavigateToSite: propOnNavigateToSite
  // END nearby-admin
}: AdminPanelEditSiteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    district: '',
    distance: '',
    rating: '',
    image: '',
    category: '',
    description: '',
    openingHours: '',
    entranceFee: '',
    latitude: '',
    longitude: ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  // BEGIN nearby-admin
  const [subplaces, setSubplaces] = useState<NearbyRef[]>([]);
  const [nearby, setNearby] = useState<NearbyRef[]>([]);
  // END nearby-admin

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        location: site.location || '',
        district: site.district || '',
        distance: site.distance || '',
        rating: site.rating?.toString() || '',
        image: site.image || '',
        category: site.category || '',
        description: site.description || '',
        openingHours: site.openingHours || '',
        entranceFee: site.entranceFee || '',
        latitude: site.coordinates?.latitude?.toString() || '',
        longitude: site.coordinates?.longitude?.toString() || ''
      });
      
      // BEGIN nearby-admin
      // Initialize nearby editors from site data
      setSubplaces(site.subplaces || []);
      setNearby(site.nearby || []);
      // END nearby-admin
    }
  }, [site]);

  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    return ImageUploadService.validateImageUrl(url);
  };

  const handleImageSelected = (imageUrl: string) => {
    console.log('🖼️ Image selected for site edit:', imageUrl);
    setFormData(prev => ({ ...prev, image: imageUrl }));
    setShowImagePicker(false);
  };

  const getFormCompletionPercentage = (): number => {
    const requiredFields = ['name', 'location', 'district'];
    const optionalFields = ['rating', 'image', 'category', 'description', 'openingHours', 'entranceFee', 'latitude', 'longitude'];
    
    let filledRequired = 0;
    let filledOptional = 0;
    
    requiredFields.forEach(field => {
      if (formData[field as keyof typeof formData]?.toString().trim()) {
        filledRequired++;
      }
    });
    
    optionalFields.forEach(field => {
      if (formData[field as keyof typeof formData]?.toString().trim()) {
        filledOptional++;
      }
    });
    
    // Required fields are worth 70%, optional fields are worth 30%
    const requiredPercentage = (filledRequired / requiredFields.length) * 70;
    const optionalPercentage = (filledOptional / optionalFields.length) * 30;
    
    return Math.round(requiredPercentage + optionalPercentage);
  };

  const getRatingStars = (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '⭐'.repeat(fullStars) + 
           (hasHalfStar ? '⭐' : '') + 
           '☆'.repeat(emptyStars);
  };

  const calculateDistance = async () => {
    const { district, latitude, longitude } = formData;
    
    if (!district.trim() || !latitude.trim() || !longitude.trim()) {
      Alert.alert('Missing Information', 'Please enter district name and coordinates to calculate distance.');
      return;
    }
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude values.');
      return;
    }
    
    setIsCalculatingDistance(true);
    try {
      const calculatedDistance = await DistanceCalculatorService.autoCalculateDistance(
        district.trim(),
        lat,
        lon
      );
      
      console.log('📏 Calculated distance:', calculatedDistance);
      
      // Check if calculation was successful
      if (calculatedDistance.includes('Distance from') && !calculatedDistance.includes('km') && !calculatedDistance.includes('m')) {
        // This means the district wasn't found
        Alert.alert(
          'District Not Found', 
          `District "${district}" not found. Please use a valid Sri Lankan district name like: Matale, Kandy, Colombo, Galle, etc.`
        );
      } else {
        setFormData(prev => ({ ...prev, distance: calculatedDistance }));
        Alert.alert('Success', `Distance calculated: ${calculatedDistance}`);
      }
      
    } catch (error) {
      console.error('Error calculating distance:', error);
      Alert.alert('Error', 'Failed to calculate distance. Please try again.');
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const autoCalculateDistance = async () => {
    const { district, latitude, longitude } = formData;
    
    if (!district.trim() || !latitude.trim() || !longitude.trim()) {
      return;
    }
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      return;
    }
    
    setIsCalculatingDistance(true);
    try {
      const calculatedDistance = await DistanceCalculatorService.autoCalculateDistance(
        district.trim(),
        lat,
        lon
      );
      
      console.log('📏 Auto-calculated distance:', calculatedDistance);
      setFormData(prev => ({ ...prev, distance: calculatedDistance }));
      
    } catch (error) {
      console.error('Error auto-calculating distance:', error);
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  // Auto-calculate distance when district or coordinates change
  useEffect(() => {
    const timer = setTimeout(() => {
      autoCalculateDistance();
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(timer);
  }, [formData.district, formData.latitude, formData.longitude]);

  const handleUpdateSite = async () => {
    if (!site) return;

    // Validation
    if (!formData.name.trim() || !formData.location.trim() || !formData.district.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Location, District)');
      return;
    }

    if (formData.image && !validateImageUrl(formData.image)) {
      Alert.alert('Error', 'Please enter a valid image URL from a supported image hosting service');
      return;
    }

    const rating = parseFloat(formData.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      Alert.alert('Error', 'Rating must be a number between 0 and 5');
      return;
    }

    const latitude = parseFloat(formData.latitude);
    const longitude = parseFloat(formData.longitude);
    if (isNaN(latitude) || isNaN(longitude)) {
      Alert.alert('Error', 'Please enter valid coordinates');
      return;
    }

    try {
      setIsUpdating(true);

      const updatedSite: Site = {
        ...site,
        name: formData.name.trim(),
        location: formData.location.trim(),
        district: formData.district.trim(),
        distance: formData.distance.trim(),
        rating: rating,
        image: formData.image.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        openingHours: formData.openingHours.trim(),
        entranceFee: formData.entranceFee.trim(),
        coordinates: {
          latitude: latitude,
          longitude: longitude
        },
        // BEGIN nearby-admin
        subplaces: subplaces,
        nearby: nearby
        // END nearby-admin
      };

      // Update Firestore
      const siteRef = doc(firestore, 'sites', site.id);
      await updateDoc(siteRef, {
        name: updatedSite.name,
        location: updatedSite.location,
        district: updatedSite.district,
        distance: updatedSite.distance,
        rating: updatedSite.rating,
        image: updatedSite.image,
        category: updatedSite.category,
        description: updatedSite.description,
        openingHours: updatedSite.openingHours,
        entranceFee: updatedSite.entranceFee,
        coordinates: updatedSite.coordinates,
        // BEGIN nearby-admin
        subplaces: subplaces,
        nearby: nearby
        // END nearby-admin
      });

      // Update local SQLite (excluding the nearby fields for now, they'll be synced later)
      await databaseService.insertOrUpdateSite({
        id: parseInt(site.id),
        name: updatedSite.name,
        location: updatedSite.location,
        district: updatedSite.district,
        distance: updatedSite.distance,
        rating: updatedSite.rating,
        image: updatedSite.image,
        category: updatedSite.category,
        description: updatedSite.description,
        openingHours: updatedSite.openingHours,
        entranceFee: updatedSite.entranceFee,
        coordinates: updatedSite.coordinates,
        gallery: JSON.stringify(site.gallery || []),
        // Other required fields
        latitude: latitude,
        longitude: longitude,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      console.log('✅ Site updated successfully:', updatedSite.name);
      Alert.alert('Success', 'Site updated successfully!');
      
      onSiteUpdated(updatedSite);
      onClose();

    } catch (error) {
      console.error('❌ Error updating site:', error);
      Alert.alert('Error', 'Failed to update site. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!site) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Heritage Site</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Site Name */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Site Name *</Label>
            <Input
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter site name"
              style={styles.input}
            />
          </View>

          {/* Location */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Location *</Label>
            <Input
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Enter location"
              style={styles.input}
            />
          </View>

          {/* District */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>District *</Label>
            <Input
              value={formData.district}
              onChangeText={(text) => setFormData(prev => ({ ...prev, district: text }))}
              placeholder="e.g., Matale, Kandy, Colombo"
              style={styles.input}
            />
            <Text style={styles.helpText}>
              💡 Valid districts: {AVAILABLE_DISTRICTS.slice(0, 8).join(', ')}, and more...
            </Text>
          </View>

          {/* Distance */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>
              Distance {isCalculatingDistance && '(Calculating...)'}
            </Label>
            <Input
              value={formData.distance}
              onChangeText={(text) => setFormData(prev => ({ ...prev, distance: text }))}
              placeholder="e.g., 2.5 km from city center"
              style={isCalculatingDistance ? {...styles.input, ...styles.inputCalculating} : styles.input}
              disabled={isCalculatingDistance}
            />
            <Text style={styles.helpText}>
              💡 Distance is automatically calculated from district center when coordinates are entered
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Rating (0-5)</Label>
            <Input
              value={formData.rating}
              onChangeText={(text) => setFormData(prev => ({ ...prev, rating: text }))}
              placeholder="Enter rating"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          {/* Main Image */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Main Site Image</Label>
            
            <View style={styles.imageInputContainer}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => setShowImagePicker(true)}
              >
                <Text style={styles.imagePickerButtonText}>📷 Select Image</Text>
              </TouchableOpacity>
              
              <Text style={styles.imageInputSeparator}>or</Text>
              
              <Input
                value={formData.image}
                onChangeText={(text) => setFormData(prev => ({ ...prev, image: text }))}
                placeholder="Enter image URL manually"
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
            
            {formData.image && !validateImageUrl(formData.image) && (
              <Text style={styles.errorText}>
                ❌ Invalid image URL format. Please use URLs from image hosting services or direct image files.
              </Text>
            )}
            
            {formData.image && validateImageUrl(formData.image) && (
              <View style={styles.imagePreviewContainer}>
                <Text style={styles.imagePreviewLabel}>Preview:</Text>
                <Image
                  source={{ uri: formData.image }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Category</Label>
            <Input
              value={formData.category}
              onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
              placeholder="e.g., Temple, Fort, Museum"
              style={styles.input}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Description</Label>
            <Textarea
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter site description"
              style={{...styles.input, ...styles.textArea}}
            />
          </View>

          {/* Opening Hours */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Opening Hours</Label>
            <Input
              value={formData.openingHours}
              onChangeText={(text) => setFormData(prev => ({ ...prev, openingHours: text }))}
              placeholder="e.g., 9:00 AM - 5:00 PM"
              style={styles.input}
            />
          </View>

          {/* Entrance Fee */}
          <View style={styles.formGroup}>
            <Label style={styles.label}>Entrance Fee</Label>
            <Input
              value={formData.entranceFee}
              onChangeText={(text) => setFormData(prev => ({ ...prev, entranceFee: text }))}
              placeholder="e.g., Rs. 100 for locals, Rs. 500 for foreigners"
              style={styles.input}
            />
          </View>

          {/* Coordinates */}
          <View style={styles.coordinatesContainer}>
            <View style={styles.coordinateInput}>
              <Label style={styles.label}>Latitude</Label>
              <Input
                value={formData.latitude}
                onChangeText={(text) => setFormData(prev => ({ ...prev, latitude: text }))}
                placeholder="e.g., 7.2906"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            
            <View style={styles.coordinateInput}>
              <Label style={styles.label}>Longitude</Label>
              <Input
                value={formData.longitude}
                onChangeText={(text) => setFormData(prev => ({ ...prev, longitude: text }))}
                placeholder="e.g., 80.6337"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          {/* BEGIN nearby-admin */}
          {/* Nearby Management Section */}
          <View style={styles.nearbySection}>
            <AdminNearbyEditor
              title="Within This Site"
              value={subplaces}
              onChange={setSubplaces}
              testID="subplaces-editor"
            />
            
            <AdminNearbyEditor
              title="Nearby Attractions"
              value={nearby}
              onChange={setNearby}
              maxDistanceKm={2}
              testID="nearby-editor"
            />
          </View>
          {/* END nearby-admin */}

          {/* Manual Calculate Button */}
          {formData.district && formData.latitude && formData.longitude && (
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

          {/* Update Button */}
          <View style={styles.buttonSection}>
            {/* BEGIN nearby-admin */}
            {/* Preview Nearby Button */}
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => {
                // Navigate to SiteInformationPage for preview
                if (propOnNavigateToSite) {
                  propOnNavigateToSite(site.id);
                } else {
                  Alert.alert('Preview', 'Navigate to site information page to preview nearby functionality.');
                }
              }}
            >
              <Text style={styles.previewButtonText}>
                👁️ Preview Nearby Tab
              </Text>
            </TouchableOpacity>
            {/* END nearby-admin */}
            
            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
              onPress={handleUpdateSite}
              disabled={isUpdating}
            >
              <Text style={styles.updateButtonText}>
                {isUpdating ? '🔄 Updating...' : '✅ Update Site'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Image Picker Modal */}
        <ImagePickerModal
          visible={showImagePicker}
          onCancel={() => setShowImagePicker(false)}
          onImageSelected={handleImageSelected}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputCalculating: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageInputContainer: {
    gap: 12,
  },
  imagePickerButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    color: '#6B7280',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  coordinateInput: {
    flex: 1,
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
  updateButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // BEGIN nearby-admin
  nearbySection: {
    marginTop: 16,
    marginBottom: 16,
    gap: 16,
  },
  buttonSection: {
    gap: 12,
    marginTop: 20,
  },
  previewButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // END nearby-admin
});