import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageUploadResult {
  url: string;
  path: string;
}

class StorageService {
  // Upload image to Firebase Storage
  async uploadImage(
    uri: string, 
    path: string, 
    options?: {
      resize?: { width: number; height: number };
      compress?: number;
    }
  ): Promise<ImageUploadResult> {
    try {
      let processedUri = uri;
      
      // Process image if options provided
      if (options?.resize || options?.compress) {
        const manipulateOptions: ImageManipulator.ImageManipulatorOptions = {};
        
        if (options.resize) {
          manipulateOptions.resize = options.resize;
        }
        
        if (options.compress) {
          manipulateOptions.compress = options.compress;
        }
        
        const result = await ImageManipulator.manipulateAsync(
          uri,
          [],
          {
            ...manipulateOptions,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        
        processedUri = result.uri;
      }
      
      // Convert URI to blob for React Native
      console.log('Processing image URI:', processedUri);
      
      const response = await fetch(processedUri);
      const blob = await response.blob();
      
      console.log('Image blob created, size:', blob.size);
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path: path
      };
      
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }
  
  // Upload main site image
  async uploadSiteMainImage(siteId: string, imageUri: string): Promise<string> {
    const timestamp = Date.now();
    const path = `sites/${siteId}/main_${timestamp}.jpg`;
    
    const result = await this.uploadImage(imageUri, path, {
      resize: { width: 800, height: 600 },
      compress: 0.8
    });
    
    return result.url;
  }
  
  // Upload gallery image
  async uploadSiteGalleryImage(siteId: string, imageUri: string): Promise<string> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const path = `site_galleries/${siteId}/image_${timestamp}_${randomId}.jpg`;
    
    const result = await this.uploadImage(imageUri, path, {
      resize: { width: 1024, height: 768 },
      compress: 0.8
    });
    
    return result.url;
  }
  
  // Upload multiple gallery images
  async uploadMultipleGalleryImages(siteId: string, imageUris: string[]): Promise<string[]> {
    const uploadPromises = imageUris.map(uri => 
      this.uploadSiteGalleryImage(siteId, uri)
    );
    
    return await Promise.all(uploadPromises);
  }
  
  // Delete image from storage
  async deleteImage(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }
  
  // Extract path from Firebase Storage URL
  extractPathFromUrl(url: string): string | null {
    try {
      const decodedUrl = decodeURIComponent(url);
      const match = decodedUrl.match(/\/o\/(.+?)\?/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }
  
  // Delete image by URL
  async deleteImageByUrl(url: string): Promise<void> {
    const path = this.extractPathFromUrl(url);
    if (path) {
      await this.deleteImage(path);
    }
  }
}

export const storageService = new StorageService();