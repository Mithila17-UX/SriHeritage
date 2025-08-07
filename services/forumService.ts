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
  Timestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from './firebase';
import { authService } from './auth';

export interface ForumPost {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  title: string;
  content: string;
  category: string;
  siteId?: number;
  siteName?: string;
  imageUrl?: string | null;
  tags?: string[];
  likes: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  isApproved?: boolean;
}

export interface ForumComment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface ForumStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  activeUsers: number;
}

class ForumService {
  private readonly POSTS_COLLECTION = 'forum_posts';
  private readonly COMMENTS_COLLECTION = 'comments';
  private readonly STATS_COLLECTION = 'forum_stats';

  // Helper to check if we should use fallback queries
  private shouldUseFallback(): boolean {
    // You can set this to true temporarily while indexes are building
    return true; // Temporarily enabled while indexes are building
  }

  // Helper function to clean data for Firebase
  private cleanDataForFirebase(data: any): any {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    });
    return cleaned;
  }

  // Create a new forum post
  async createPost(postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'commentsCount' | 'userId' | 'userName' | 'userAvatar'>): Promise<string> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const now = new Date().toISOString();
      const post: Omit<ForumPost, 'id'> = {
        ...postData,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userAvatar: user.photoURL || null,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        isApproved: true // Auto-approve for now, can be changed for admin moderation
      };

      // Clean the data to remove undefined values
      const cleanedPost = this.cleanDataForFirebase(post);

      const docRef = await addDoc(collection(firestore, this.POSTS_COLLECTION), cleanedPost);
      console.log('✅ Forum post created:', docRef.id);
      
      // Update forum stats
      await this.updateForumStats('posts', 1);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to create forum post:', error);
      throw error;
    }
  }

  // Get forum posts with pagination and filtering
  async getPosts(options: {
    category?: string;
    siteId?: number;
    userId?: string;
    limit?: number;
    lastDoc?: QueryDocumentSnapshot;
    approvedOnly?: boolean;
  } = {}): Promise<{ posts: ForumPost[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      // Use fallback if indexes are still building
      if (this.shouldUseFallback()) {
        return this.getPostsFallback(options);
      }

      let q = query(
        collection(firestore, this.POSTS_COLLECTION),
        where('isDeleted', '==', false)
      );

      // Add filters - but limit to avoid complex composite indexes
      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      if (options.siteId) {
        q = query(q, where('siteId', '==', options.siteId));
      }

      // For "My Posts" filter, we'll handle it differently to avoid complex indexes
      if (options.userId) {
        q = query(q, where('userId', '==', options.userId));
      }

      if (options.approvedOnly !== false) {
        q = query(q, where('isApproved', '==', true));
      }

      // Add ordering and pagination
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      if (options.lastDoc) {
        q = query(q, startAfter(options.lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const posts: ForumPost[] = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as ForumPost);
      });

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return { posts, lastDoc };
    } catch (error) {
      console.error('❌ Failed to get forum posts:', error);
      
      // Fallback: Try a simpler query without complex filters
      return this.getPostsFallback(options);
    }
  }

  // Fallback method for when indexes are building
  private async getPostsFallback(options: {
    category?: string;
    siteId?: number;
    userId?: string;
    limit?: number;
    lastDoc?: QueryDocumentSnapshot;
    approvedOnly?: boolean;
  } = {}): Promise<{ posts: ForumPost[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      console.log('🔄 Using simple fallback query (no indexes required)...');
      
      // Use the simplest possible query - just get all posts
      const fallbackQuery = query(
        collection(firestore, this.POSTS_COLLECTION)
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackPosts: ForumPost[] = [];

      fallbackSnapshot.forEach((doc) => {
        const post = {
          id: doc.id,
          ...doc.data()
        } as ForumPost;
        
        // Apply all filters in memory
        if (post.isDeleted) return;
        if (options.userId && post.userId !== options.userId) return;
        if (options.approvedOnly !== false && !post.isApproved) return;
        if (options.category && post.category !== options.category) return;
        if (options.siteId && post.siteId !== options.siteId) return;
        
        fallbackPosts.push(post);
      });

      // Sort by createdAt in memory
      fallbackPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Apply limit in memory
      const limitedPosts = options.limit ? fallbackPosts.slice(0, options.limit) : fallbackPosts;
      
      return { 
        posts: limitedPosts, 
        lastDoc: fallbackSnapshot.docs[fallbackSnapshot.docs.length - 1] 
      };
    } catch (fallbackError) {
      console.error('❌ Simple fallback query also failed:', fallbackError);
      throw fallbackError;
    }
  }

  // Get a single forum post
  async getPost(postId: string): Promise<ForumPost | null> {
    try {
      const docRef = doc(firestore, this.POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && !docSnap.data().isDeleted) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as ForumPost;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get forum post:', error);
      throw error;
    }
  }

  // Update a forum post
  async updatePost(postId: string, updates: Partial<ForumPost>): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(firestore, this.POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }

      const postData = docSnap.data() as ForumPost;
      
      // Only allow users to update their own posts (unless admin)
      if (postData.userId !== user.uid) {
        throw new Error('Unauthorized to update this post');
      }

      // Clean the updates to remove undefined values
      const cleanedUpdates = this.cleanDataForFirebase({
        ...updates,
        updatedAt: new Date().toISOString()
      });

      await updateDoc(docRef, cleanedUpdates);

      console.log('✅ Forum post updated:', postId);
    } catch (error) {
      console.error('❌ Failed to update forum post:', error);
      throw error;
    }
  }

  // Delete a forum post (soft delete)
  async deletePost(postId: string): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(firestore, this.POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }

      const postData = docSnap.data() as ForumPost;
      
      // Only allow users to delete their own posts (unless admin)
      if (postData.userId !== user.uid) {
        throw new Error('Unauthorized to delete this post');
      }

      await updateDoc(docRef, {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      });

      // Update forum stats
      await this.updateForumStats('posts', -1);
      await this.updateForumStats('comments', -postData.commentsCount);

      console.log('✅ Forum post deleted:', postId);
    } catch (error) {
      console.error('❌ Failed to delete forum post:', error);
      throw error;
    }
  }

  // Like/unlike a forum post
  async toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(firestore, this.POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }

      const postData = docSnap.data() as ForumPost;
      const likedBy = postData.likedBy || [];
      const isLiked = likedBy.includes(user.uid);

              if (isLiked) {
          // Unlike
          const unlikeUpdates = this.cleanDataForFirebase({
            likes: Math.max(postData.likes - 1, 0),
            likedBy: likedBy.filter(id => id !== user.uid),
            updatedAt: new Date().toISOString()
          });
          await updateDoc(docRef, unlikeUpdates);
          
          await this.updateForumStats('likes', -1);
          return { liked: false, likesCount: Math.max(postData.likes - 1, 0) };
        } else {
          // Like
          const likeUpdates = this.cleanDataForFirebase({
            likes: postData.likes + 1,
            likedBy: [...likedBy, user.uid],
            updatedAt: new Date().toISOString()
          });
          await updateDoc(docRef, likeUpdates);
          
          await this.updateForumStats('likes', 1);
          return { liked: true, likesCount: postData.likes + 1 };
        }
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
      throw error;
    }
  }

  // Create a comment
  async createComment(postId: string, content: string): Promise<string> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const now = new Date().toISOString();
      const comment: Omit<ForumComment, 'id'> = {
        postId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userAvatar: user.photoURL || null,
        content,
        likes: 0,
        likedBy: [],
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      };

      // Clean the data to remove undefined values
      const cleanedComment = this.cleanDataForFirebase(comment);

      const docRef = await addDoc(collection(firestore, this.POSTS_COLLECTION, postId, this.COMMENTS_COLLECTION), cleanedComment);

      // Update post comments count
      const postRef = doc(firestore, this.POSTS_COLLECTION, postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data() as ForumPost;
        await updateDoc(postRef, {
          commentsCount: (postData.commentsCount || 0) + 1,
          updatedAt: new Date().toISOString()
        });
      }

      // Update forum stats
      await this.updateForumStats('comments', 1);

      console.log('✅ Forum comment created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to create forum comment:', error);
      throw error;
    }
  }

  // Get comments for a post
  async getComments(postId: string): Promise<ForumComment[]> {
    try {
      // First try with the optimized query
      let q = query(
        collection(firestore, this.POSTS_COLLECTION, postId, this.COMMENTS_COLLECTION),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const comments: ForumComment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out deleted comments in memory instead of in query
        if (!data.isDeleted) {
          comments.push({
            id: doc.id,
            ...data
          } as ForumComment);
        }
      });

      return comments;
    } catch (error) {
      console.error('❌ Failed to get forum comments:', error);
      // If the query fails, try a simpler approach
      try {
        const q = query(
          collection(firestore, this.POSTS_COLLECTION, postId, this.COMMENTS_COLLECTION)
        );
        
        const querySnapshot = await getDocs(q);
        const comments: ForumComment[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter out deleted comments and sort in memory
          if (!data.isDeleted) {
            comments.push({
              id: doc.id,
              ...data
            } as ForumComment);
          }
        });

        // Sort by createdAt in memory
        comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        return comments;
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  // Update a comment
  async updateComment(postId: string, commentId: string, content: string): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(firestore, this.POSTS_COLLECTION, postId, this.COMMENTS_COLLECTION, commentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = docSnap.data() as ForumComment;
      
      // Only allow users to update their own comments
      if (commentData.userId !== user.uid) {
        throw new Error('Unauthorized to update this comment');
      }

      // Clean the updates to remove undefined values
      const cleanedUpdates = this.cleanDataForFirebase({
        content,
        updatedAt: new Date().toISOString()
      });

      await updateDoc(docRef, cleanedUpdates);

      console.log('✅ Forum comment updated:', commentId);
    } catch (error) {
      console.error('❌ Failed to update forum comment:', error);
      throw error;
    }
  }

  // Delete a comment
  async deleteComment(postId: string, commentId: string): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(firestore, this.POSTS_COLLECTION, postId, this.COMMENTS_COLLECTION, commentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = docSnap.data() as ForumComment;
      
      // Only allow users to delete their own comments
      if (commentData.userId !== user.uid) {
        throw new Error('Unauthorized to delete this comment');
      }

      await updateDoc(docRef, {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      });

      // Update post comments count
      const postRef = doc(firestore, this.POSTS_COLLECTION, postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data() as ForumPost;
        await updateDoc(postRef, {
          commentsCount: Math.max((postData.commentsCount || 0) - 1, 0),
          updatedAt: new Date().toISOString()
        });
      }

      // Update forum stats
      await this.updateForumStats('comments', -1);

      console.log('✅ Forum comment deleted:', commentId);
    } catch (error) {
      console.error('❌ Failed to delete forum comment:', error);
      throw error;
    }
  }

  // Get forum statistics
  async getForumStats(): Promise<ForumStats> {
    try {
      const statsRef = doc(firestore, this.STATS_COLLECTION, 'overall');
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        return statsSnap.data() as ForumStats;
      }

      // Return default stats if none exist
      return {
        totalPosts: 0,
        totalComments: 0,
        totalLikes: 0,
        activeUsers: 0
      };
    } catch (error) {
      console.error('❌ Failed to get forum stats:', error);
      throw error;
    }
  }

  // Update forum statistics
  private async updateForumStats(type: 'posts' | 'comments' | 'likes', increment: number): Promise<void> {
    try {
      const statsRef = doc(firestore, this.STATS_COLLECTION, 'overall');
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        const currentStats = statsSnap.data() as ForumStats;
        await updateDoc(statsRef, {
          [`total${type.charAt(0).toUpperCase() + type.slice(1)}`]: Math.max((currentStats[`total${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof ForumStats] as number || 0) + increment, 0)
        });
      } else {
        // Create initial stats
        const initialStats: ForumStats = {
          totalPosts: type === 'posts' ? Math.max(increment, 0) : 0,
          totalComments: type === 'comments' ? Math.max(increment, 0) : 0,
          totalLikes: type === 'likes' ? Math.max(increment, 0) : 0,
          activeUsers: 0
        };
        await setDoc(statsRef, initialStats);
      }
    } catch (error) {
      console.error('❌ Failed to update forum stats:', error);
      // Don't throw error for stats updates as they're not critical
    }
  }

  // Admin functions for managing posts
  async approvePost(postId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.POSTS_COLLECTION, postId);
      await updateDoc(docRef, {
        isApproved: true,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Post approved:', postId);
    } catch (error) {
      console.error('❌ Failed to approve post:', error);
      throw error;
    }
  }

  async rejectPost(postId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.POSTS_COLLECTION, postId);
      await updateDoc(docRef, {
        isApproved: false,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Post rejected:', postId);
    } catch (error) {
      console.error('❌ Failed to reject post:', error);
      throw error;
    }
  }

  // Get pending posts for admin approval
  async getPendingPosts(): Promise<ForumPost[]> {
    try {
      const q = query(
        collection(firestore, this.POSTS_COLLECTION),
        where('isApproved', '==', false),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );

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
      console.error('❌ Failed to get pending posts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const forumService = new ForumService();
