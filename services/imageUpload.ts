import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// API Keys - Load from environment variables or fallback to defaults
const IMGBB_API_KEY = 'b8ad0ab3924dec749aa71927506f9713';
const UNSPLASH_ACCESS_KEY = '7BsQLbBYHejj6qBMLIe4o-2oLzz4efAabAzCl6hEGVg'; // Your Unsplash API key

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface UnsplashImage {
  id: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
  };
}

export class ImageUploadService {
  /**
   * Upload image to ImgBB from device or camera
   */
  static async pickAndUploadImage(): Promise<ImageUploadResult> {
    try {
      console.log('🔍 Requesting media library permissions...');
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📱 Permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ Permission denied');
        return {
          success: false,
          error: 'Permission to access media library is required'
        };
      }

      console.log('📷 Launching image picker...');
      
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false, // We'll compress and convert separately
      });

      console.log('📷 Image picker result:', result.canceled ? 'cancelled' : 'selected');

      if (result.canceled) {
        return {
          success: false,
          error: 'Image selection was cancelled'
        };
      }

      const imageUri = result.assets[0].uri;
      console.log('🖼️ Selected image URI:', imageUri);
      
      return await this.uploadImageToImgBB(imageUri);

    } catch (error) {
      console.error('❌ Error picking image:', error);
      return {
        success: false,
        error: `Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Take photo with camera and upload to ImgBB
   */
  static async takeAndUploadPhoto(): Promise<ImageUploadResult> {
    try {
      console.log('📸 Requesting camera permissions...');
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Camera permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ Camera permission denied');
        return {
          success: false,
          error: 'Permission to access camera is required'
        };
      }

      console.log('📸 Launching camera...');
      
      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false,
      });

      console.log('📸 Camera result:', result.canceled ? 'cancelled' : 'captured');

      if (result.canceled) {
        return {
          success: false,
          error: 'Photo capture was cancelled'
        };
      }

      const imageUri = result.assets[0].uri;
      console.log('📸 Captured image URI:', imageUri);
      
      return await this.uploadImageToImgBB(imageUri);

    } catch (error) {
      console.error('❌ Error taking photo:', error);
      return {
        success: false,
        error: `Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Upload image URI to ImgBB
   */
  private static async uploadImageToImgBB(imageUri: string): Promise<ImageUploadResult> {
    try {
      console.log('🔄 Starting image processing...');
      
      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }, // Resize to max 1200px width
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      console.log('✅ Image processed successfully');

      if (!manipulatedImage.base64) {
        console.log('❌ No base64 data from image processing');
        return {
          success: false,
          error: 'Failed to process image'
        };
      }

      console.log('☁️ Uploading to ImgBB...');

      // Upload to ImgBB
      const formData = new FormData();
      formData.append('image', manipulatedImage.base64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📡 ImgBB response status:', response.status);

      const data = await response.json();
      console.log('📡 ImgBB response data:', data);

      if (data.success && data.data?.url) {
        console.log('✅ Image uploaded successfully:', data.data.url);
        return {
          success: true,
          url: data.data.url
        };
      } else {
        console.log('❌ ImgBB upload failed:', data);
        return {
          success: false,
          error: data.error?.message || 'Failed to upload image'
        };
      }

    } catch (error) {
      console.error('❌ Error uploading to ImgBB:', error);
      return {
        success: false,
        error: `Failed to upload image to server: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search images on Unsplash
   */
  static async searchUnsplashImages(query: string, page: number = 1): Promise<{
    success: boolean;
    images?: UnsplashImage[];
    error?: string;
  }> {
    try {
      if (!query.trim()) {
        console.log('❌ Empty search query');
        return {
          success: false,
          error: 'Search query is required'
        };
      }

      console.log('🔍 Searching Unsplash for:', query);
      console.log('🔑 Using access key:', UNSPLASH_ACCESS_KEY.substring(0, 10) + '...');

      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20&orientation=landscape`;
      console.log('🌐 Request URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      });

      console.log('📡 Unsplash response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Unsplash error response:', errorText);
        return {
          success: false,
          error: `Failed to search images: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log('✅ Unsplash search results:', data.results?.length || 0, 'images found');

      return {
        success: true,
        images: data.results || []
      };

    } catch (error) {
      console.error('❌ Error searching Unsplash:', error);
      return {
        success: false,
        error: `Failed to search images: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate image URL format
   */
  static validateImageUrl(url: string): boolean {
    if (!url.trim()) return false;
    
    try {
      console.log('🔍 Validating URL:', url);
      const urlObj = new URL(url);
      console.log('🔍 URL hostname:', urlObj.hostname);
      
      // Check for common image hosting domains that don't need file extensions
      const imageHostingDomains = [
        'images.unsplash.com',
        'unsplash.com',
        'i.ibb.co',
        'ibb.co',
        'imgur.com',
        'i.imgur.com',
        'cdn.pixabay.com',
        'images.pexels.com',
        'firebasestorage.googleapis.com',
        'cloudinary.com',
        'res.cloudinary.com'
      ];
      
      // If it's from a known image hosting service, consider it valid
      const isFromImageHost = imageHostingDomains.some(domain => urlObj.hostname.includes(domain));
      console.log('🔍 Is from image hosting service:', isFromImageHost);
      
      if (isFromImageHost) {
        console.log('✅ URL validated as image hosting service');
        return true;
      }
      
      // For other URLs, check for image file extensions
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
      const lowercaseUrl = url.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      
      // Check if URL path ends with image extension or contains it
      const hasValidExtension = validExtensions.some(ext => 
        pathname.endsWith(ext) || 
        lowercaseUrl.includes(ext) ||
        lowercaseUrl.includes('fm=jpg') || // Unsplash format parameter
        lowercaseUrl.includes('format=jpg') ||
        lowercaseUrl.includes('format=jpeg') ||
        lowercaseUrl.includes('format=png') ||
        lowercaseUrl.includes('format=webp')
      );
      
      console.log('🔍 Has valid extension or format:', hasValidExtension);
      
      const result = hasValidExtension;
      console.log('🔍 Final validation result:', result);
      return result;
    } catch (error) {
      console.log('❌ URL validation error:', error);
      return false;
    }
  }

  /**
   * Test if image URL is accessible
   */
  static async testImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch {
      return false;
    }
  }
}