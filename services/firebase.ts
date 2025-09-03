import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdXUZNOdmC4JGerYedKse4--i4Xw-mKlU",
  authDomain: "sriheritage-b77b3.firebaseapp.com",
  projectId: "sriheritage-b77b3",
  storageBucket: "sriheritage-b77b3.firebasestorage.app",
  messagingSenderId: "900546875634",
  appId: "1:900546875634:web:74f3b5565c9e681f61406b",
  measurementId: "G-YCQS4637D2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
let auth: Auth;
try {
  auth = initializeAuth(app);
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Interface for Firestore site data
export interface FirestoreSite {
  id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  image_url?: string;
  historical_period?: string;
  significance?: string;
  visiting_hours?: string;
  entry_fee?: string;
  district?: string;
  distance?: string;
  rating?: number;
  image?: string;
  openingHours?: string;
  entranceFee?: string;
  gallery?: string[] | string; // Allow both array and string formats
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Function to fetch sites directly from Firestore
export const getSitesFromFirestore = async (): Promise<FirestoreSite[]> => {
  try {
    console.log('🔄 Fetching sites directly from Firestore...');
    
    // Wait for auth state to be ready
    await new Promise((resolve) => {
      if (auth.currentUser) {
        resolve(auth.currentUser);
      } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        });
        // Timeout after 5 seconds if no auth
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      }
    });
    
    if (!auth.currentUser) {
      console.log('🔒 Firebase: User not authenticated after waiting');
      throw new Error('User not authenticated');
    }
    
    console.log('👤 Firebase: User authenticated:', auth.currentUser.email);
    
    const sitesCollection = collection(firestore, 'sites');
    const sitesSnapshot = await getDocs(sitesCollection);
    
    console.log('📊 Firestore query completed, found:', sitesSnapshot.size, 'documents');
    
    const firestoreSites: FirestoreSite[] = [];
    
    sitesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Processing Firestore document:', doc.id, data);
      
      // Handle ID more robustly
      let siteId: number;
      if (!isNaN(parseInt(doc.id))) {
        siteId = parseInt(doc.id);
      } else {
        // If doc.id is not a number, generate a hash-based ID
        siteId = Math.abs(doc.id.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0));
      }
      
      const siteData: FirestoreSite = {
        id: siteId,
        name: data.name || '',
        description: data.description || '',
        location: data.location || '',
        latitude: data.coordinates?.latitude || data.latitude || 0,
        longitude: data.coordinates?.longitude || data.longitude || 0,
        category: data.category || '',
        image_url: data.image || data.image_url || '',
        historical_period: data.historical_period || '',
        significance: data.significance || '',
        visiting_hours: data.openingHours || data.visiting_hours || '',
        entry_fee: data.entranceFee || data.entry_fee || '',
        district: data.district || '',
        distance: data.distance || '',
        rating: data.rating || 4.5,
        image: data.image || data.image_url || '',
        openingHours: data.openingHours || data.visiting_hours || '',
        entranceFee: data.entranceFee || data.entry_fee || '',
        gallery: data.gallery ? (Array.isArray(data.gallery) ? data.gallery : (typeof data.gallery === 'string' ? (() => {
          try {
            return JSON.parse(data.gallery);
          } catch {
            return [];
          }
        })() : [])) : [],
        coordinates: {
          latitude: data.coordinates?.latitude || data.latitude || 0,
          longitude: data.coordinates?.longitude || data.longitude || 0
        }
      };
      
      console.log('✅ Processed site data:', {
        id: siteData.id,
        name: siteData.name,
        gallery: siteData.gallery,
        galleryType: typeof siteData.gallery,
        isGalleryArray: Array.isArray(siteData.gallery),
        galleryLength: Array.isArray(siteData.gallery) ? siteData.gallery.length : 'N/A'
      });
      firestoreSites.push(siteData);
    });

    console.log('📊 Total sites fetched from Firestore:', firestoreSites.length);
    return firestoreSites;
  } catch (error) {
    console.error('❌ Failed to fetch sites from Firestore:', error);
    throw error;
  }
};

export { auth, firestore, storage };
export default app;