import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, FlatList, Dimensions } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImagePickerModal } from './ImagePickerModal';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { databaseService } from '../services/database';
import { adminLogsService } from '../services/adminLogs';
import { ImageUploadService } from '../services/imageUpload';

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

interface AdminPanelGalleryModalProps {
  visible: boolean;
  site: Site | null;
  onClose: () => void;
  onGalleryUpdated?: (updatedSite: Site) => void;
}

export function AdminPanelGalleryModal({ 
  visible, 
  site, 
  onClose, 
  onGalleryUpdated 
}: AdminPanelGalleryModalProps) {
  const [newGalleryImage, setNewGalleryImage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [localGallery, setLocalGallery] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (site) {
      setLocalGallery(site.gallery || []);
      setSelectedImages([]);
    }
  }, [site]);

  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const isValid = ImageUploadService.validateImageUrl(url);
    console.log('🔍 Gallery URL validation:', url.substring(0, 100) + '...', 'Valid:', isValid);
    return isValid;
  };

  const handleAddGalleryImage = async () => {
    if (!site || !newGalleryImage.trim()) {
      Alert.alert('Error', 'Please enter an image URL');
      return;
    }

    if (!validateImageUrl(newGalleryImage)) {
      Alert.alert('Error', 'Please enter a valid image URL from a supported image hosting service (Unsplash, ImgBB, etc.) or a direct image file URL');
      return;
    }

    try {
      setIsUploading(true);
      
      const imageUrl = newGalleryImage.trim();
      
      // Update Firestore
      const siteRef = doc(firestore, 'sites', site.id);
      await updateDoc(siteRef, {
        gallery: arrayUnion(imageUrl)
      });
      
      // Update local state
      const updatedGallery = [...localGallery, imageUrl];
      setLocalGallery(updatedGallery);
      
      // Update local SQLite
      await updateSQLiteGallery(site.id, updatedGallery);
      
      // Log admin action
      await adminLogsService.logAction('edit', {
        siteId: site.id,
        siteName: site.name,
        description: `Added image to gallery`
      });
      
      // Notify parent component
      const updatedSite = { ...site, gallery: updatedGallery };
      onGalleryUpdated?.(updatedSite);
      
      setNewGalleryImage('');
      Alert.alert('Success', 'Image added to gallery!');
      
    } catch (error) {
      console.error('Error adding gallery image:', error);
      Alert.alert('Error', 'Failed to add image to gallery');
    } finally {
      setIsUploading(false);
    }
  };



  const handleRemoveGalleryImage = async (imageUrl: string) => {
    if (!site) return;

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image from the gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update Firestore
              const siteRef = doc(firestore, 'sites', site.id);
              await updateDoc(siteRef, {
                gallery: arrayRemove(imageUrl)
              });
              
              // Update local state
              const updatedGallery = localGallery.filter(img => img !== imageUrl);
              setLocalGallery(updatedGallery);
              
              // Update local SQLite
              await updateSQLiteGallery(site.id, updatedGallery);
              
              // Image URLs are external, no need to delete from storage
              
              // Notify parent component
              const updatedSite = { ...site, gallery: updatedGallery };
              onGalleryUpdated?.(updatedSite);
              
              Alert.alert('Success', 'Image removed from gallery!');
              
            } catch (error) {
              console.error('Error removing gallery image:', error);
              Alert.alert('Error', 'Failed to remove image from gallery');
            }
          }
        }
      ]
    );
  };

  const handleBulkRemoveImages = async () => {
    if (!site || selectedImages.length === 0) return;

    Alert.alert(
      'Remove Selected Images',
      `Are you sure you want to remove ${selectedImages.length} selected image(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update Firestore - remove all selected images
              const siteRef = doc(firestore, 'sites', site.id);
              await updateDoc(siteRef, {
                gallery: arrayRemove(...selectedImages)
              });
              
              // Update local state
              const updatedGallery = localGallery.filter(img => !selectedImages.includes(img));
              setLocalGallery(updatedGallery);
              
              // Update local SQLite
              await updateSQLiteGallery(site.id, updatedGallery);
              
              // Image URLs are external, no need to delete from storage
              
              // Notify parent component
              const updatedSite = { ...site, gallery: updatedGallery };
              onGalleryUpdated?.(updatedSite);
              
              setSelectedImages([]);
              Alert.alert('Success', `${selectedImages.length} image(s) removed from gallery!`);
              
            } catch (error) {
              console.error('Error removing gallery images:', error);
              Alert.alert('Error', 'Failed to remove images from gallery');
            }
          }
        }
      ]
    );
  };

  const updateSQLiteGallery = async (siteId: string, gallery: string[]) => {
    try {
      // Get existing site data and update gallery
      const existingSite = await databaseService.getSiteById(parseInt(siteId));
      if (existingSite) {
        await databaseService.insertOrUpdateSite({
          ...existingSite,
          gallery: JSON.stringify(gallery)
        });
      }
    } catch (error) {
      console.error('Error updating SQLite gallery:', error);
    }
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl)
        ? prev.filter(img => img !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleImageSelected = (imageUrl: string) => {
    setNewGalleryImage(imageUrl);
  };



  if (!site) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setSelectedImages([]);
        onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Manage Gallery - {site.name}</Text>
            
            <View style={styles.formGroup}>
              <Label style={styles.label}>Add New Image</Label>
              
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
                  value={newGalleryImage}
                  onChangeText={setNewGalleryImage}
                  style={
                    (!validateImageUrl(newGalleryImage) && newGalleryImage) 
                      ? {...styles.input, ...styles.inputError} 
                      : styles.input
                  }
                />
              </View>
              
              <Text style={styles.helpText}>
                💡 Use the button above to pick/capture/search images, or enter a URL manually
              </Text>
              
              {newGalleryImage && !validateImageUrl(newGalleryImage) && (
                <Text style={styles.errorText}>
                  ❌ Invalid image URL format. Please use URLs from image hosting services or direct image files.
                </Text>
              )}
              
              {newGalleryImage && validateImageUrl(newGalleryImage) && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.imagePreviewLabel}>Preview:</Text>
                  <Image
                    source={{ uri: newGalleryImage }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                    onError={() => Alert.alert('Error', 'Failed to load image from URL')}
                  />
                </View>
              )}
              
              <View style={styles.galleryButtonsRow}>
                <Button
                  onPress={handleAddGalleryImage}
                  disabled={isUploading || !validateImageUrl(newGalleryImage)}
                  style={styles.addImageButton}
                >
                  {isUploading ? 'Adding...' : 'Add to Gallery'}
                </Button>
              </View>
            </View>

            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Gallery Images ({localGallery.length})</Text>
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
              {localGallery.map((image, index) => (
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

            {localGallery.length === 0 && (
              <View style={styles.emptyGallery}>
                <Text style={styles.emptyGalleryText}>No images in gallery</Text>
                <Text style={styles.emptyGallerySubtext}>Add your first image to get started</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                onPress={() => {
                  setSelectedImages([]);
                  onClose();
                }}
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>

      <ImagePickerModal
        visible={showImagePicker}
        onCancel={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  formGroup: {
    marginBottom: 16,
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
    height: 120,
    borderRadius: 8,
  },
  galleryButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addImageButton: {
    backgroundColor: '#10B981',
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryGridItem: {
    width: (Dimensions.get('window').width - 64 - 16) / 3,
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
  emptyGallery: {
    alignItems: 'center',
    padding: 40,
  },
  emptyGalleryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyGallerySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: '#1E40AF',
    width: '100%',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
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
});