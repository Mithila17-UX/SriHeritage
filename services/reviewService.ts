import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  setDoc,
  getDoc,
  increment
} from 'firebase/firestore';
import { firestore } from './firebase';
import { authService } from './auth';

export interface Review {
  id: string;
  siteId: number;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  rating: number;
  comment: string;
  aspectRatings?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  helpful: number;
}

export interface SiteRatingStats {
  siteId: number;
  averageRating: number;
  totalReviews: number;
  totalRatingSum: number;
  lastUpdated: Date;
}

class ReviewService {
  private reviewsCollection = 'reviews';
  private ratingsCollection = 'siteRatings';

  // Add a new review
  async addReview(
    siteId: number, 
    rating: number, 
    comment: string, 
    aspectRatings?: Record<string, number>
  ): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to add a review');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    try {
      const reviewData = {
        siteId,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous User',
        userEmail: currentUser.email || '',
        rating,
        comment: comment.trim(),
        aspectRatings: aspectRatings || {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        helpful: 0
      };

      // Add the review
      const reviewRef = await addDoc(collection(firestore, this.reviewsCollection), reviewData);

      // Update site rating statistics
      await this.updateSiteRatingStats(siteId, rating);

      console.log('✅ Review added successfully:', reviewRef.id);
      return reviewRef.id;
    } catch (error) {
      console.error('❌ Error adding review:', error);
      throw new Error('Failed to add review. Please try again.');
    }
  }

  // Update an existing review
  async updateReview(
    reviewId: string, 
    rating: number, 
    comment: string, 
    aspectRatings?: Record<string, number>
  ): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to update a review');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    try {
      // Get the existing review to check ownership and get old rating
      const reviewRef = doc(firestore, this.reviewsCollection, reviewId);
      const reviewSnap = await getDoc(reviewRef);

      if (!reviewSnap.exists()) {
        throw new Error('Review not found');
      }

      const existingReview = reviewSnap.data();
      if (existingReview.userId !== currentUser.uid) {
        throw new Error('You can only edit your own reviews');
      }

      const oldRating = existingReview.rating;
      const siteId = existingReview.siteId;

      // Update the review
      await updateDoc(reviewRef, {
        rating,
        comment: comment.trim(),
        aspectRatings: aspectRatings || {},
        updatedAt: Timestamp.now()
      });

      // Update site rating statistics (subtract old rating, add new rating)
      await this.updateSiteRatingStats(siteId, rating, oldRating);

      console.log('✅ Review updated successfully:', reviewId);
    } catch (error) {
      console.error('❌ Error updating review:', error);
      throw new Error('Failed to update review. Please try again.');
    }
  }

  // Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to delete a review');
    }

    try {
      // Get the existing review to check ownership and get rating
      const reviewRef = doc(firestore, this.reviewsCollection, reviewId);
      const reviewSnap = await getDoc(reviewRef);

      if (!reviewSnap.exists()) {
        throw new Error('Review not found');
      }

      const existingReview = reviewSnap.data();
      if (existingReview.userId !== currentUser.uid) {
        throw new Error('You can only delete your own reviews');
      }

      const rating = existingReview.rating;
      const siteId = existingReview.siteId;

      // Delete the review
      await deleteDoc(reviewRef);

      // Update site rating statistics (subtract the deleted rating)
      await this.updateSiteRatingStats(siteId, 0, rating);

      console.log('✅ Review deleted successfully:', reviewId);
    } catch (error) {
      console.error('❌ Error deleting review:', error);
      throw new Error('Failed to delete review. Please try again.');
    }
  }

  // Get reviews for a specific site
  async getReviewsForSite(siteId: number, maxResults: number = 20): Promise<Review[]> {
    try {
      // First try with the composite index query (requires Firestore index)
      let reviewsQuery;
      let useSimpleQuery = false;
      
      try {
        reviewsQuery = query(
          collection(firestore, this.reviewsCollection),
          where('siteId', '==', siteId),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
        
        // Test the query with a small limit first
        const testSnapshot = await getDocs(query(
          collection(firestore, this.reviewsCollection),
          where('siteId', '==', siteId),
          orderBy('createdAt', 'desc'),
          limit(1)
        ));
        
        console.log('✅ Composite index query successful');
      } catch (indexError) {
        console.warn('⚠️ Composite index not available, falling back to simple query:', indexError);
        useSimpleQuery = true;
        
        // Fallback: Use simple query without orderBy (will sort manually)
        reviewsQuery = query(
          collection(firestore, this.reviewsCollection),
          where('siteId', '==', siteId),
          limit(maxResults)
        );
      }

      const querySnapshot = await getDocs(reviewsQuery);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          siteId: data.siteId,
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          userEmail: data.userEmail,
          rating: data.rating,
          comment: data.comment,
          aspectRatings: data.aspectRatings || {},
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          helpful: data.helpful || 0
        });
      });

      // If we used simple query, sort manually by creation date
      if (useSimpleQuery) {
        reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.log('📋 Manually sorted reviews by creation date');
      }

      console.log(`📖 Fetched ${reviews.length} reviews for site ${siteId}`);
      return reviews;
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      throw new Error('Failed to fetch reviews. Please try again.');
    }
  }

  // Get user's review for a specific site
  async getUserReviewForSite(siteId: number): Promise<Review | null> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    try {
      const reviewsQuery = query(
        collection(firestore, this.reviewsCollection),
        where('siteId', '==', siteId),
        where('userId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(reviewsQuery);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        siteId: data.siteId,
        userId: data.userId,
        userDisplayName: data.userDisplayName,
        userEmail: data.userEmail,
        rating: data.rating,
        comment: data.comment,
        aspectRatings: data.aspectRatings || {},
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        helpful: data.helpful || 0
      };
    } catch (error) {
      console.error('❌ Error fetching user review:', error);
      return null;
    }
  }

  // Get site rating statistics
  async getSiteRatingStats(siteId: number): Promise<SiteRatingStats | null> {
    try {
      const statsRef = doc(firestore, this.ratingsCollection, siteId.toString());
      const statsSnap = await getDoc(statsRef);

      if (!statsSnap.exists()) {
        // If no stats exist, calculate from existing reviews
        return await this.calculateAndStoreSiteRatingStats(siteId);
      }

      const data = statsSnap.data();
      return {
        siteId: data.siteId,
        averageRating: data.averageRating,
        totalReviews: data.totalReviews,
        totalRatingSum: data.totalRatingSum,
        lastUpdated: data.lastUpdated.toDate()
      };
    } catch (error) {
      console.error('❌ Error fetching site rating stats:', error);
      return null;
    }
  }

  // Update site rating statistics
  private async updateSiteRatingStats(
    siteId: number, 
    newRating: number, 
    oldRating?: number
  ): Promise<void> {
    try {
      const statsRef = doc(firestore, this.ratingsCollection, siteId.toString());
      const statsSnap = await getDoc(statsRef);

      if (!statsSnap.exists()) {
        // Create new stats document
        const stats: SiteRatingStats = {
          siteId,
          averageRating: newRating,
          totalReviews: 1,
          totalRatingSum: newRating,
          lastUpdated: new Date()
        };

        await setDoc(statsRef, {
          ...stats,
          lastUpdated: Timestamp.now()
        });
      } else {
        // Update existing stats
        const currentStats = statsSnap.data();
        let totalReviews = currentStats.totalReviews;
        let totalRatingSum = currentStats.totalRatingSum;

        if (oldRating !== undefined) {
          // Updating existing review
          totalRatingSum = totalRatingSum - oldRating + newRating;
        } else if (newRating === 0 && oldRating !== undefined) {
          // Deleting review
          totalReviews -= 1;
          totalRatingSum -= oldRating;
        } else {
          // Adding new review
          totalReviews += 1;
          totalRatingSum += newRating;
        }

        const averageRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0;

        await updateDoc(statsRef, {
          averageRating,
          totalReviews,
          totalRatingSum,
          lastUpdated: Timestamp.now()
        });
      }

      console.log(`📊 Updated rating stats for site ${siteId}`);
    } catch (error) {
      console.error('❌ Error updating site rating stats:', error);
      throw error;
    }
  }

  // Calculate and store site rating statistics from existing reviews
  private async calculateAndStoreSiteRatingStats(siteId: number): Promise<SiteRatingStats | null> {
    try {
      const reviews = await this.getReviewsForSite(siteId);
      
      if (reviews.length === 0) {
        return null;
      }

      const totalRatingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRatingSum / reviews.length;

      const stats: SiteRatingStats = {
        siteId,
        averageRating,
        totalReviews: reviews.length,
        totalRatingSum,
        lastUpdated: new Date()
      };

      const statsRef = doc(firestore, this.ratingsCollection, siteId.toString());
      await setDoc(statsRef, {
        ...stats,
        lastUpdated: Timestamp.now()
      });

      console.log(`📊 Calculated and stored rating stats for site ${siteId}`);
      return stats;
    } catch (error) {
      console.error('❌ Error calculating site rating stats:', error);
      return null;
    }
  }

  // Subscribe to reviews for a site (real-time updates)
  subscribeToSiteReviews(
    siteId: number, 
    callback: (reviews: Review[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    // Use simple query without orderBy to avoid index requirement
    // We'll sort the results manually
    const reviewsQuery = query(
      collection(firestore, this.reviewsCollection),
      where('siteId', '==', siteId)
    );

    return onSnapshot(
      reviewsQuery,
      (querySnapshot) => {
        const reviews: Review[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reviews.push({
            id: doc.id,
            siteId: data.siteId,
            userId: data.userId,
            userDisplayName: data.userDisplayName,
            userEmail: data.userEmail,
            rating: data.rating,
            comment: data.comment,
            aspectRatings: data.aspectRatings || {},
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            helpful: data.helpful || 0
          });
        });
        
        // Sort manually by creation date (newest first)
        reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        callback(reviews);
      },
      (error) => {
        console.error('❌ Error in reviews subscription:', error);
        onError?.(new Error('Failed to get real-time updates for reviews'));
      }
    );
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      const reviewRef = doc(firestore, this.reviewsCollection, reviewId);
      await updateDoc(reviewRef, {
        helpful: increment(1)
      });
      console.log('✅ Marked review as helpful:', reviewId);
    } catch (error) {
      console.error('❌ Error marking review as helpful:', error);
      throw new Error('Failed to mark review as helpful');
    }
  }
}

// Export singleton instance
export const reviewService = new ReviewService();
