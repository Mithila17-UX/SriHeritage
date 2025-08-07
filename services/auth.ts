import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface SignupData {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      console.log('🔥 Firebase auth state changed:', user ? user.email : 'null');
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
      
      if (user) {
        this.storeUserLocally(user);
        this.updateLastLoginTime(user.uid);
      } else {
        this.clearUserLocally();
      }
    });
  }

  // Auth state management
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    console.log('📝 Registering auth state listener, total listeners:', this.authStateListeners.length + 1);
    this.authStateListeners.push(callback);
    
    // Immediately call with current user if available
    if (this.currentUser) {
      console.log('👤 Immediately calling new listener with current user:', this.currentUser.email);
      callback(this.currentUser);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  private notifyAuthStateListeners(user: User | null): void {
    console.log('🔔 Notifying auth state listeners:', {
      user: user ? user.email : 'null',
      listenerCount: this.authStateListeners.length
    });
    this.authStateListeners.forEach(callback => callback(user));
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  // Sign up new user
  async signUp(data: SignupData): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );

      // Update display name if provided
      if (data.displayName) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName
        });
      }

      // Create user profile in Firestore
      await this.createUserProfile(userCredential.user, data.displayName);

      console.log('User signed up successfully:', userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in existing user
  async signIn(data: LoginData): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );

      console.log('User signed in successfully:', userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateProfile(this.currentUser, updates);
      
      // Update Firestore profile
      const userRef = doc(firestore, 'users', this.currentUser.uid);
      await setDoc(userRef, updates, { merge: true });

      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Create user profile in Firestore
  private async createUserProfile(user: User, displayName?: string): Promise<void> {
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName || user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, userProfile);

      console.log('User profile created in Firestore');
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }

  // Update last login time
  private async updateLastLoginTime(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', uid);
      await setDoc(userRef, { 
        lastLoginAt: new Date().toISOString() 
      }, { merge: true });
    } catch (error) {
      console.error('Failed to update last login time:', error);
      // Don't throw error for this non-critical operation
    }
  }

  // Get user profile from Firestore
  async getUserProfile(uid?: string): Promise<UserProfile | null> {
    const userId = uid || this.currentUser?.uid;
    if (!userId) return null;

    try {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // Store user info locally
  private async storeUserLocally(user: User): Promise<void> {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store user locally:', error);
    }
  }

  // Clear local user data
  private async clearUserLocally(): Promise<void> {
    try {
      await AsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Failed to clear user locally:', error);
    }
  }

  // Get locally stored user
  async getLocalUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get local user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Handle authentication errors
  private handleAuthError(error: any): Error {
    let message = 'An authentication error occurred';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No user found with this email address';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }
}

// Export singleton instance
export const authService = new AuthService();