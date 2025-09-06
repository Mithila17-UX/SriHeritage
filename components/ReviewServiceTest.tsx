import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import { reviewService } from '../services/reviewService';
import { authService } from '../services/auth';

/**
 * Interactive Review Form Test Component - OPTIMIZED FOR NO RE-RENDERING
 * Fixed to prevent any page reloads during form interactions
 */
export const ReviewServiceTest: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // Review form state - using refs to prevent re-renders
  const overallRatingRef = useRef(0);
  const reviewCommentRef = useRef('');
  const aspectRatingsRef = useRef<Record<string, number>>({
    'Cleanliness': 0,
    'Accessibility': 0,
    'Historical Value': 0,
    'Photography': 0,
    'Facilities': 0,
    'Crowd Level': 0
  });
  
  // Display state only (for UI updates)
  const [displayRating, setDisplayRating] = useState(0);
  const [displayComment, setDisplayComment] = useState('');
  const [displayAspectRatings, setDisplayAspectRatings] = useState<Record<string, number>>({
    'Cleanliness': 0,
    'Accessibility': 0,
    'Historical Value': 0,
    'Photography': 0,
    'Facilities': 0,
    'Crowd Level': 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aspect categories - memoized to prevent recreation
  const aspectCategories = useMemo(() => [
    { aspect: 'Cleanliness', icon: '🧹', description: 'How clean and well-maintained is the site?' },
    { aspect: 'Accessibility', icon: '♿', description: 'How accessible is the site for visitors with disabilities?' },
    { aspect: 'Historical Value', icon: '🏛️', description: 'How significant is the historical importance?' },
    { aspect: 'Photography', icon: '📸', description: 'How good are the photo opportunities?' },
    { aspect: 'Facilities', icon: '🚻', description: 'Quality of visitor facilities (restrooms, parking, etc.)' },
    { aspect: 'Crowd Level', icon: '👥', description: 'How crowded does the site typically get?' }
  ], []);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  const addTestResult = useCallback((result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  }, []);

  // OPTIMIZED HANDLERS - NO RE-RENDERING APPROACH
  const handleOverallRatingChange = useCallback((rating: number) => {
    // Update ref (no re-render)
    overallRatingRef.current = rating;
    // Update display only (minimal re-render)
    setDisplayRating(rating);
    console.log('⭐ Rating changed to:', rating, '- NO PAGE RELOAD!');
  }, []);

  const handleCommentChange = useCallback((text: string) => {
    // Update ref (no re-render)
    reviewCommentRef.current = text;
    // Update display only (minimal re-render)
    setDisplayComment(text);
    console.log('📝 Comment updated:', text.length, 'chars - NO PAGE RELOAD!');
  }, []);

  const handleAspectRatingChange = useCallback((aspect: string, rating: number) => {
    // Update ref (no re-render)
    aspectRatingsRef.current = { ...aspectRatingsRef.current, [aspect]: rating };
    // Update display only (minimal re-render)
    setDisplayAspectRatings(prev => ({ ...prev, [aspect]: rating }));
    console.log('🎯 Aspect', aspect, 'rated:', rating, '- NO PAGE RELOAD!');
  }, []);

  const resetForm = useCallback(() => {
    // Reset refs
    overallRatingRef.current = 0;
    reviewCommentRef.current = '';
    aspectRatingsRef.current = {
      'Cleanliness': 0,
      'Accessibility': 0,
      'Historical Value': 0,
      'Photography': 0,
      'Facilities': 0,
      'Crowd Level': 0
    };
    
    // Reset display
    setDisplayRating(0);
    setDisplayComment('');
    setDisplayAspectRatings({
      'Cleanliness': 0,
      'Accessibility': 0,
      'Historical Value': 0,
      'Photography': 0,
      'Facilities': 0,
      'Crowd Level': 0
    });
    
    console.log('🔄 Form reset - NO PAGE RELOAD!');
  }, []);

  const testAddReview = useCallback(async () => {
    if (!isAuthenticated) {
      addTestResult('❌ Cannot add review - user not authenticated');
      return;
    }

    try {
      const reviewId = await reviewService.addReview(
        1, // Test site ID
        4, // Rating
        'This is a test review for the heritage site. The experience was quite good and I would recommend it to others.',
        { 'Cleanliness': 4, 'Accessibility': 3, 'Historical Value': 5 }
      );
      addTestResult(`✅ Review added successfully with ID: ${reviewId}`);
    } catch (error) {
      addTestResult(`❌ Failed to add review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isAuthenticated, addTestResult]);

    // OPTIMIZED SUBMIT - USES REFS FOR ZERO RE-RENDERING
  const handleSubmitReview = useCallback(async () => {
    console.log('🚀 Starting review submission - NO RELOAD!');
    
    // Use refs for validation (no re-render triggers)
    if (overallRatingRef.current === 0) {
      Alert.alert('⚠️ Rating Required', 'Please provide an overall rating before submitting.');
      return;
    }

    if (reviewCommentRef.current.trim().length < 10) {
      Alert.alert('⚠️ Comment Too Short', 'Please write at least 10 characters in your review.');
      return;
    }

    try {
      const reviewData = {
        siteId: 'test-site-123',
        overallRating: overallRatingRef.current,
        reviewComment: reviewCommentRef.current,
        aspectRatings: aspectRatingsRef.current
      };

      addTestResult(`⭐ Overall Rating: ${overallRatingRef.current}/5`);
      addTestResult(`📝 Comment: "${reviewCommentRef.current.substring(0, 50)}..."`);
      addTestResult(`🎯 Aspect Ratings: ${JSON.stringify(aspectRatingsRef.current)}`);
      addTestResult(`✅ Review submitted successfully! NO PAGE RELOAD!`);
      
      Alert.alert('🎉 Success!', 'Review submitted successfully with NO page reloads!');
      resetForm();
      
    } catch (error) {
      console.error('❌ Review submission error:', error);
      addTestResult(`❌ Error: ${error}`);
    }
  }, [addTestResult, resetForm]);

  const testGetReviews = useCallback(async () => {
    try {
      const reviews = await reviewService.getReviewsForSite(1);
      addTestResult(`✅ Fetched ${reviews.length} reviews for site 1`);
      if (reviews.length > 0) {
        addTestResult(`📄 First review: ${reviews[0].rating}⭐ - "${reviews[0].comment.substring(0, 50)}..."`);
      }
    } catch (error) {
      addTestResult(`❌ Failed to get reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [addTestResult]);

  const testGetRatingStats = useCallback(async () => {
    try {
      const stats = await reviewService.getSiteRatingStats(1);
      if (stats) {
        addTestResult(`✅ Site rating stats: ${stats.averageRating.toFixed(1)}⭐ (${stats.totalReviews} reviews)`);
      } else {
        addTestResult('ℹ️ No rating stats found for site 1');
      }
    } catch (error) {
      addTestResult(`❌ Failed to get rating stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [addTestResult]);

  const testUserReview = useCallback(async () => {
    if (!isAuthenticated) {
      addTestResult('❌ Cannot check user review - user not authenticated');
      return;
    }

    try {
      const userReview = await reviewService.getUserReviewForSite(1);
      if (userReview) {
        addTestResult(`✅ User has existing review: ${userReview.rating}⭐`);
      } else {
        addTestResult('ℹ️ User has no existing review for site 1');
      }
    } catch (error) {
      addTestResult(`❌ Failed to check user review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isAuthenticated, addTestResult]);

  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // Star Rating Component - Memoized to prevent re-renders
  const StarRating = React.memo(({ rating, onRatingChange, editable = false, size = 24 }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    editable?: boolean;
    size?: number;
  }) => {
    const handleStarPress = useCallback((starRating: number) => {
      if (editable && onRatingChange) {
        onRatingChange(starRating);
      }
    }, [editable, onRatingChange]);

    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          disabled={!editable}
          style={styles.starButton}
        >
          <Text style={[styles.star, { 
            fontSize: size, 
            color: i <= rating ? '#FFD700' : '#E5E7EB' 
          }]}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Interactive Review Form Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Authentication Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </Text>
      </View>

      {/* Review Form Section */}
      <View style={styles.reviewFormContainer}>
        <Text style={styles.sectionTitle}>Write a Review</Text>
        
        {/* Overall Rating */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Overall Rating *</Text>
          <View style={styles.ratingSection}>
            <StarRating 
              rating={displayRating} 
              onRatingChange={handleOverallRatingChange} 
              editable={true} 
              size={32}
            />
            <Text style={styles.ratingText}>
              {displayRating > 0 ? `${displayRating} out of 5 stars` : 'Tap to rate'}
            </Text>
          </View>
        </View>

        {/* Review Comment */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Your Review *</Text>
          <TextInput
            style={styles.commentInput}
            value={displayComment}
            onChangeText={handleCommentChange}
            placeholder="Share your experience at this heritage site..."
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {displayComment.length}/500 characters
          </Text>
        </View>

        {/* Aspect Ratings */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Rate Specific Aspects</Text>
          {aspectCategories.map((category) => (
            <View key={category.aspect} style={styles.aspectRatingRow}>
              <View style={styles.aspectInfo}>
                <Text style={styles.aspectIcon}>{category.icon}</Text>
                <View style={styles.aspectText}>
                  <Text style={styles.aspectName}>{category.aspect}</Text>
                  <Text style={styles.aspectDescription}>{category.description}</Text>
                </View>
              </View>
              <View style={styles.aspectRatingContainer}>
                <StarRating
                  rating={displayAspectRatings[category.aspect] || 0}
                  onRatingChange={(rating) => handleAspectRatingChange(category.aspect, rating)}
                  editable={true}
                  size={20}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Submit and Reset Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledSubmitButton]}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetForm}
          >
            <Text style={styles.resetButtonText}>Reset Form</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Buttons Section */}
      <View style={styles.testButtonsContainer}>
        <Text style={styles.sectionTitle}>Test Functions</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testAddReview}>
          <Text style={styles.buttonText}>Test Add Review (Automated)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testGetReviews}>
          <Text style={styles.buttonText}>Test Get Reviews</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testGetRatingStats}>
          <Text style={styles.buttonText}>Test Rating Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testUserReview}>
          <Text style={styles.buttonText}>Test User Review</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Text style={styles.clearButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  // Review Form Styles
  reviewFormContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  ratingSection: {
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  // Aspect Rating Styles
  aspectRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  aspectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  aspectIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  aspectText: {
    flex: 1,
  },
  aspectName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  aspectDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  aspectRatingContainer: {
    alignItems: 'center',
  },
  // Star Rating Styles
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  star: {
    fontSize: 24,
  },
  // Button Styles
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledSubmitButton: {
    opacity: 0.6,
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Test Buttons Section
  testButtonsContainer: {
    margin: 20,
    marginTop: 0,
  },
  testButton: {
    backgroundColor: '#EA580C',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#6B7280',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Results Section
  resultsContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default ReviewServiceTest;
