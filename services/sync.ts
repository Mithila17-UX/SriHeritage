import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from './firebase';
import { authService } from './auth';
import { databaseService } from './database';

export interface ForumPost {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: string;
  siteId?: number;
  siteName?: string;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumComment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

class SyncService {
  private isOnline = true;
  private syncInProgress = false;

  // Check network connectivity (simplified for demo)
  async checkConnectivity(): Promise<boolean> {
    // In a real app, you'd use @react-native-community/netinfo
    // For now, we'll assume online unless explicitly set otherwise
    return this.isOnline;
  }

  setOnlineStatus(online: boolean): void {
    this.isOnline = online;
  }

  // Sync user favorites to Firestore
  async syncFavoritesToFirestore(userId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      console.log('Offline - skipping favorites sync');
      return;
    }

    try {
      const localFavorites = await databaseService.getUserFavoriteSiteIds(userId);
      const userRef = doc(firestore, 'users', userId);
      
      await setDoc(userRef, {
        favoriteSites: localFavorites,
        favoritesLastSynced: new Date().toISOString()
      }, { merge: true });

      await AsyncStorage.setItem('favoritesLastSynced', new Date().toISOString());
      console.log('Favorites synced to Firestore');
    } catch (error) {
      console.error('Failed to sync favorites to Firestore:', error);
      throw error;
    }
  }

  // Sync user visited sites to Firestore
  async syncVisitedToFirestore(userId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      console.log('Offline - skipping visited sites sync');
      return;
    }

    try {
      const localVisited = await databaseService.getUserVisitedSiteIds(userId);
      const userRef = doc(firestore, 'users', userId);
      
      await setDoc(userRef, {
        visitedSites: localVisited,
        visitedLastSynced: new Date().toISOString()
      }, { merge: true });

      await AsyncStorage.setItem('visitedLastSynced', new Date().toISOString());
      console.log('Visited sites synced to Firestore');
    } catch (error) {
      console.error('Failed to sync visited sites to Firestore:', error);
      throw error;
    }
  }

  // Sync favorites from Firestore to local database
  async syncFavoritesFromFirestore(userId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      console.log('Offline - skipping favorites sync from Firestore');
      return;
    }

    try {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const remoteFavorites = userData.favoriteSites || [];
        
        if (remoteFavorites.length > 0) {
          await databaseService.bulkAddFavorites(userId, remoteFavorites);
          console.log('Favorites synced from Firestore');
        }
      }
    } catch (error) {
      console.error('Failed to sync favorites from Firestore:', error);
      throw error;
    }
  }

  // Sync visited sites from Firestore to local database
  async syncVisitedFromFirestore(userId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      console.log('Offline - skipping visited sites sync from Firestore');
      return;
    }

    try {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const remoteVisited = userData.visitedSites || [];
        
        if (remoteVisited.length > 0) {
          await databaseService.bulkAddVisited(userId, remoteVisited);
          console.log('Visited sites synced from Firestore');
        }
      }
    } catch (error) {
      console.error('Failed to sync visited sites from Firestore:', error);
      throw error;
    }
  }

  // Full sync - both directions
  async performFullSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    const userId = authService.getCurrentUserId();
    if (!userId) {
      console.log('No user logged in - skipping sync');
      return;
    }

    if (!await this.checkConnectivity()) {
      console.log('Offline - skipping full sync');
      return;
    }

    this.syncInProgress = true;

    try {
      // First sync from Firestore to local (in case user logged in from another device)
      await this.syncFavoritesFromFirestore(userId);
      await this.syncVisitedFromFirestore(userId);

      // Then sync local changes to Firestore
      await this.syncFavoritesToFirestore(userId);
      await this.syncVisitedToFirestore(userId);

      await AsyncStorage.setItem('lastFullSync', new Date().toISOString());
      console.log('Full sync completed');
    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Forum Posts Operations
  async createForumPost(post: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot create forum post while offline');
    }

    try {
      const now = new Date().toISOString();
      const postData: Omit<ForumPost, 'id'> = {
        ...post,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(firestore, 'forums'), postData);
      console.log('Forum post created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create forum post:', error);
      throw error;
    }
  }

  async getForumPosts(category?: string, siteId?: number): Promise<ForumPost[]> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot fetch forum posts while offline');
    }

    try {
      let q = query(
        collection(firestore, 'forums'),
        orderBy('createdAt', 'desc')
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      if (siteId) {
        q = query(q, where('siteId', '==', siteId));
      }

      const querySnapshot = await getDocs(q);
      const posts: ForumPost[] = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as ForumPost);
      });

      return posts;
    } catch (error) {
      console.error('Failed to get forum posts:', error);
      throw error;
    }
  }

  async getForumPost(postId: string): Promise<ForumPost | null> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot fetch forum post while offline');
    }

    try {
      const docRef = doc(firestore, 'forums', postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as ForumPost;
      }

      return null;
    } catch (error) {
      console.error('Failed to get forum post:', error);
      throw error;
    }
  }

  async updateForumPost(postId: string, updates: Partial<ForumPost>): Promise<void> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot update forum post while offline');
    }

    try {
      const docRef = doc(firestore, 'forums', postId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      console.log('Forum post updated:', postId);
    } catch (error) {
      console.error('Failed to update forum post:', error);
      throw error;
    }
  }

  async deleteForumPost(postId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot delete forum post while offline');
    }

    try {
      // Delete all comments first
      const commentsQuery = query(
        collection(firestore, 'forums', postId, 'comments')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the post
      const docRef = doc(firestore, 'forums', postId);
      await deleteDoc(docRef);

      console.log('Forum post deleted:', postId);
    } catch (error) {
      console.error('Failed to delete forum post:', error);
      throw error;
    }
  }

  async likeForumPost(postId: string, userId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot like forum post while offline');
    }

    try {
      const docRef = doc(firestore, 'forums', postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const postData = docSnap.data() as ForumPost;
        const likedBy = postData.likedBy || [];
        
        if (!likedBy.includes(userId)) {
          await updateDoc(docRef, {
            likes: (postData.likes || 0) + 1,
            likedBy: [...likedBy, userId],
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Failed to like forum post:', error);
      throw error;
    }
  }

  async unlikeForumPost(postId: string, userId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot unlike forum post while offline');
    }

    try {
      const docRef = doc(firestore, 'forums', postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const postData = docSnap.data() as ForumPost;
        const likedBy = postData.likedBy || [];
        
        if (likedBy.includes(userId)) {
          await updateDoc(docRef, {
            likes: Math.max((postData.likes || 0) - 1, 0),
            likedBy: likedBy.filter(id => id !== userId),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Failed to unlike forum post:', error);
      throw error;
    }
  }

  // Forum Comments Operations
  async createForumComment(postId: string, comment: Omit<ForumComment, 'id' | 'postId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot create forum comment while offline');
    }

    try {
      const now = new Date().toISOString();
      const commentData: Omit<ForumComment, 'id'> = {
        ...comment,
        postId,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(firestore, 'forums', postId, 'comments'), commentData);

      // Update comments count on the post
      const postRef = doc(firestore, 'forums', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          commentsCount: (postData.commentsCount || 0) + 1
        });
      }

      console.log('Forum comment created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create forum comment:', error);
      throw error;
    }
  }

  async getForumComments(postId: string): Promise<ForumComment[]> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot fetch forum comments while offline');
    }

    try {
      const q = query(
        collection(firestore, 'forums', postId, 'comments'),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const comments: ForumComment[] = [];

      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data()
        } as ForumComment);
      });

      return comments;
    } catch (error) {
      console.error('Failed to get forum comments:', error);
      throw error;
    }
  }

  async deleteForumComment(postId: string, commentId: string): Promise<void> {
    if (!await this.checkConnectivity()) {
      throw new Error('Cannot delete forum comment while offline');
    }

    try {
      const docRef = doc(firestore, 'forums', postId, 'comments', commentId);
      await deleteDoc(docRef);

      // Update comments count on the post
      const postRef = doc(firestore, 'forums', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
          commentsCount: Math.max((postData.commentsCount || 0) - 1, 0)
        });
      }

      console.log('Forum comment deleted:', commentId);
    } catch (error) {
      console.error('Failed to delete forum comment:', error);
      throw error;
    }
  }

  // Auto-sync on app state changes
  async schedulePeriodicSync(): Promise<void> {
    const lastSync = await AsyncStorage.getItem('lastFullSync');
    if (!lastSync) {
      // First time - perform initial sync
      await this.performFullSync();
      return;
    }

    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const hoursSinceLastSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);

    // Sync if it's been more than 6 hours
    if (hoursSinceLastSync > 6) {
      await this.performFullSync();
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();