import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
let auth;
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

export { auth, firestore, storage };
export default app;