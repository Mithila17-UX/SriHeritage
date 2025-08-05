import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageUploadService, UnsplashImage } from '../services/imageUpload';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string) => void;
  title?: string;
}

type TabType = 'device' | 'search' | 'url';

export function ImagePickerModal({ 
  visible, 
  onClose, 
  onImageSelected, 
  title = 'Select Image' 
}: ImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('device');
  const [isUploading, setIsUploading] = useState(false);
  
  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // URL tab state
  const [manualUrl, setManualUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);

  // Debug modal state
  console.log('🎭 ImagePickerModal rendered - visible:', visible, 'activeTab:', activeTab);

  const handleDeviceImagePick = async () => {
    console.log('🎯 Device image pick started');
    setIsUploading(true);
    try {
      const result = await ImageUploadService.pickAndUploadImage();
      console.log('📱 Device pick result:', result);
      
      if (result.success && result.url) {
        console.log('✅ Image uploaded successfully:', result.url);
        onImageSelected(result.url);
        onClose();
      } else {
        console.log('❌ Device pick failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Device pick exception:', error);
      Alert.alert('Error', 'An unexpected error occurred while picking the image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    console.log('📸 Camera capture started');
    setIsUploading(true);
    try {
      const result = await ImageUploadService.takeAndUploadPhoto();
      console.log('📸 Camera result:', result);
      
      if (result.success && result.url) {
        console.log('✅ Photo uploaded successfully:', result.url);
        onImageSelected(result.url);
        onClose();
      } else {
        console.log('❌ Camera capture failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('❌ Camera capture exception:', error);
      Alert.alert('Error', 'An unexpected error occurred while taking the photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    console.log('🔍 Starting search for:', searchQuery);
    setIsSearching(true);
    try {
      const result = await ImageUploadService.searchUnsplashImages(searchQuery);
      console.log('🔍 Search result:', result);
      
      if (result.success && result.images) {
        setSearchResults(result.images);
        console.log('✅ Found', result.images.length, 'images');
        
        if (result.images.length === 0) {
          Alert.alert('No Results', 'No images found for your search term. Try different keywords.');
        }
      } else {
        console.log('❌ Search failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to search images');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Search exception:', error);
      Alert.alert('Error', 'An unexpected error occurred while searching');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUnsplashImageSelect = (image: UnsplashImage) => {
    const imageUrl = image.urls.regular; // Use regular size for good quality
    console.log('🖼️ Selected Unsplash image:', imageUrl);
    onImageSelected(imageUrl);
    onClose();
  };

  const handleUrlValidation = async (url: string) => {
    setManualUrl(url);
    setUrlPreview(null);

    if (!url.trim()) return;

    if (!ImageUploadService.validateImageUrl(url)) {
      return; // Invalid format, don't test
    }

    setIsValidatingUrl(true);
    try {
      const isValid = await ImageUploadService.testImageUrl(url);
      if (isValid) {
        setUrlPreview(url);
      }
    } catch (error) {
      console.log('URL validation failed:', error);
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleManualUrlSubmit = () => {
    if (!manualUrl.trim()) {
      Alert.alert('Error', 'Please enter an image URL');
      return;
    }

    if (!ImageUploadService.validateImageUrl(manualUrl)) {
      Alert.alert('Error', 'Please enter a valid image URL ending in .jpg, .jpeg, .png, or .webp');
      return;
    }

    onImageSelected(manualUrl);
    onClose();
    Alert.alert('Success', 'Image URL added successfully!');
  };

  const resetModal = () => {
    setActiveTab('device');
    setSearchQuery('');
    setSearchResults([]);
    setManualUrl('');
    setUrlPreview(null);
    setIsUploading(false);
    setIsSearching(false);
    setIsValidatingUrl(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderDeviceTab = () => {
    console.log('🎨 Rendering Device Tab');
    return (
      <ScrollView style={styles.tabScrollView} contentContainerStyle={styles.tabContent}>
        <Text style={styles.tabDescription}>
          📷 Choose or take a photo from your device
        </Text>
        
        
        <View style={styles.deviceButtons}>
          <TouchableOpacity
            style={[styles.deviceButton, styles.galleryButton]}
            onPress={() => {
              console.log('🎯 Gallery button pressed!');
              handleDeviceImagePick();
            }}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            <Text style={styles.deviceButtonIcon}>🖼️</Text>
            <Text style={styles.deviceButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deviceButton, styles.cameraButton]}
            onPress={() => {
              console.log('📸 Camera button pressed!');
              handleCameraCapture();
            }}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            <Text style={styles.deviceButtonIcon}>📸</Text>
            <Text style={styles.deviceButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        )}

        <Text style={styles.infoText}>
          💡 Images will be automatically compressed and uploaded to a free hosting service
        </Text>
      </ScrollView>
    );
  };

  const renderSearchTab = () => {
    console.log('🎨 Rendering Search Tab');
    return (
      <View style={styles.tabContainer}>
        <View style={styles.searchHeader}>
          <Text style={styles.tabDescription}>
            🔍 Search for high-quality images online
          </Text>
          
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search for images (e.g., temple, ancient ruins)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              onSubmitEditing={() => {
                console.log('🔍 Search submitted via keyboard!');
                handleSearch();
              }}
            />
            <TouchableOpacity
              onPress={() => {
                console.log('🔍 Search button pressed!');
                handleSearch();
              }}
              disabled={isSearching || !searchQuery.trim()}
              style={[styles.searchButton, (isSearching || !searchQuery.trim()) && styles.disabledButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.searchButtonText}>
                {isSearching ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>

          {isSearching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.searchingText}>Searching images...</Text>
            </View>
          )}
        </View>

        {searchResults.length > 0 && (
          <ScrollView 
            style={styles.searchResultsContainer}
            contentContainerStyle={styles.searchResultsContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.searchResultsGrid}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    console.log('🖼️ Search result image pressed!');
                    handleUnsplashImageSelect(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.urls.thumb }}
                    style={styles.searchResultImage}
                    resizeMode="cover"
                  />
                  <View style={styles.searchResultOverlay}>
                    <Text style={styles.searchResultText} numberOfLines={2}>
                      {item.alt_description || item.description || 'Image'}
                    </Text>
                    <Text style={styles.photographerText}>by {item.user.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.infoText}>
              💡 Images are provided by Unsplash and are free to use
            </Text>
          </ScrollView>
        )}

        {searchResults.length === 0 && !isSearching && searchQuery && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>🔍 No images found</Text>
            <Text style={styles.noResultsSubtext}>Try different search terms</Text>
          </View>
        )}
      </View>
    );
  };

  const renderUrlTab = () => {
    console.log('🎨 Rendering URL Tab');
    return (
      <ScrollView style={styles.tabScrollView} contentContainerStyle={styles.tabContent}>
        <Text style={styles.tabDescription}>
          🔗 Enter a direct link to any public image
        </Text>
        
        
        <View style={styles.urlContainer}>
          <Label style={styles.urlLabel}>Image URL</Label>
          <Input
            placeholder="https://example.com/image.jpg"
            value={manualUrl}
            onChangeText={handleUrlValidation}
            style={[
              styles.urlInput,
              manualUrl && !ImageUploadService.validateImageUrl(manualUrl) && styles.urlInputError
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {manualUrl && !ImageUploadService.validateImageUrl(manualUrl) && (
            <Text style={styles.urlErrorText}>
              ❌ URL must end with .jpg, .jpeg, .png, or .webp
            </Text>
          )}

          {isValidatingUrl && (
            <View style={styles.validatingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.validatingText}>Validating URL...</Text>
            </View>
          )}

          {urlPreview && (
            <View style={styles.urlPreviewContainer}>
              <Text style={styles.urlPreviewLabel}>Preview:</Text>
              <Image
                source={{ uri: urlPreview }}
                style={styles.urlPreviewImage}
                resizeMode="cover"
                onError={() => {
                  setUrlPreview(null);
                  Alert.alert('Error', 'Failed to load image from URL');
                }}
              />
            </View>
          )}

          <TouchableOpacity
            onPress={() => {
              console.log('🔗 URL submit button pressed!');
              handleManualUrlSubmit();
            }}
            disabled={!manualUrl.trim() || !ImageUploadService.validateImageUrl(manualUrl)}
            style={[styles.urlSubmitButton, (!manualUrl.trim() || !ImageUploadService.validateImageUrl(manualUrl)) && styles.disabledButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.urlSubmitButtonText}>Use This URL</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          💡 Make sure the URL is publicly accessible and points directly to an image file
        </Text>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'device' && styles.activeTab]}
              onPress={() => {
                console.log('📱 Device tab pressed');
                setActiveTab('device');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'device' && styles.activeTabText]}>
                📷 Device
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.activeTab]}
              onPress={() => {
                console.log('🔍 Search tab pressed');
                setActiveTab('search');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                🔍 Search
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'url' && styles.activeTab]}
              onPress={() => {
                console.log('🔗 URL tab pressed');
                setActiveTab('url');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'url' && styles.activeTabText]}>
                🔗 URL
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            {activeTab === 'device' && renderDeviceTab()}
            {activeTab === 'search' && renderSearchTab()}
            {activeTab === 'url' && renderUrlTab()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const modalWidth = width * 0.9;
const imageSize = (modalWidth - 60) / 2;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: modalWidth,
    height: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabScrollView: {
    flex: 1,
  },
  searchHeader: {
    paddingBottom: 12,
  },
  searchFooter: {
    paddingTop: 12,
  },
  searchResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  tabContent: {
    padding: 20,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  deviceButtons: {
    gap: 12,
    marginBottom: 20,
  },
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  galleryButton: {
    backgroundColor: '#3B82F6',
  },
  cameraButton: {
    backgroundColor: '#10B981',
  },
  deviceButtonIcon: {
    fontSize: 24,
  },
  deviceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  searchingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  searchResults: {
    gap: 8,
  },
  searchResultItem: {
    width: '48%',
    height: 120,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  searchResultImage: {
    width: '100%',
    height: '100%',
  },
  searchResultOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  searchResultText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  photographerText: {
    color: '#D1D5DB',
    fontSize: 10,
    marginTop: 2,
  },
  urlContainer: {
    gap: 12,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  urlInput: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  urlInputError: {
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  urlErrorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validatingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  urlPreviewContainer: {
    gap: 8,
  },
  urlPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  urlPreviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  urlSubmitButton: {
    backgroundColor: '#10B981',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  infoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchResultsContent: {
    padding: 16,
    paddingBottom: 40,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});