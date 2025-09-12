import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';

interface AspectRating {
  aspect: string;
  rating: number;
  icon: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  aspectRatings?: Record<string, number>;
}

interface ReviewFormModalProps {
  visible: boolean;
  userExistingReview: Review | null;
  isSubmittingReview: boolean;
  initialRating: number;
  initialComment: string;
  initialAspectRatings: Record<string, number>;
  onClose: () => void;
  onSubmit: (rating: number, comment: string, aspectRatings: Record<string, number>) => Promise<void>;
  onDelete?: () => void;
}

const aspectCategories = [
  { aspect: 'Cleanliness', icon: '🧹', description: 'How clean and well-maintained is the site?' },
  { aspect: 'Accessibility', icon: '♿', description: 'How accessible is the site for visitors with disabilities?' },
  { aspect: 'Historical Value', icon: '🏛️', description: 'How significant is the historical importance?' },
  { aspect: 'Photography', icon: '📸', description: 'How good are the photo opportunities?' },
  { aspect: 'Facilities', icon: '🚻', description: 'Quality of visitor facilities (restrooms, parking, etc.)' },
  { aspect: 'Crowd Level', icon: '👥', description: 'How crowded does the site typically get?' }
];

// Star Rating Component with proper filled/unfilled visualization
const StarRating = React.memo(({ rating, onRatingChange, editable = false, size = 20 }: {
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
    const isFilled = i <= rating;
    stars.push(
      <TouchableOpacity
        key={i}
        onPress={() => handleStarPress(i)}
        disabled={!editable}
        style={styles.starButton}
        activeOpacity={editable ? 0.7 : 1}
      >
        <Text style={[
          styles.star, 
          { 
            fontSize: size, 
            color: isFilled ? '#FFD700' : '#E5E7EB',
            textShadowColor: isFilled ? 'rgba(255, 215, 0, 0.5)' : 'transparent',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: isFilled ? 2 : 0
          }
        ]}>
          {isFilled ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    );
  }
  return <View style={styles.starContainer}>{stars}</View>;
});

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  visible,
  userExistingReview,
  isSubmittingReview,
  initialRating,
  initialComment,
  initialAspectRatings,
  onClose,
  onSubmit,
  onDelete
}) => {
  // Local state completely isolated from parent
  const [localRating, setLocalRating] = useState(initialRating);
  const [localComment, setLocalComment] = useState(initialComment);
  const [localAspectRatings, setLocalAspectRatings] = useState(initialAspectRatings);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (visible) {
      setLocalRating(initialRating);
      setLocalComment(initialComment);
      setLocalAspectRatings(initialAspectRatings);
    }
  }, [visible, initialRating, initialComment, initialAspectRatings]);

  const handleSubmit = useCallback(async () => {
    if (localRating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating for this site.');
      return;
    }
    if (localComment.trim().length < 10) {
      Alert.alert('Comment Required', 'Please provide a comment with at least 10 characters.');
      return;
    }

    try {
      await onSubmit(localRating, localComment, localAspectRatings);
    } catch (error) {
      // Error handling is done in parent
    }
  }, [localRating, localComment, localAspectRatings, onSubmit]);

  const handleCancel = useCallback(() => {
    // Reset to initial values
    setLocalRating(initialRating);
    setLocalComment(initialComment);
    setLocalAspectRatings(initialAspectRatings);
    onClose();
  }, [initialRating, initialComment, initialAspectRatings, onClose]);

  const handleTextChange = useCallback((text: string) => {
    setLocalComment(text);
  }, []);

  const handleRatingChange = useCallback((rating: number) => {
    setLocalRating(rating);
  }, []);

  const handleAspectRatingChange = useCallback((aspect: string, rating: number) => {
    setLocalAspectRatings(prev => ({ ...prev, [aspect]: rating }));
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {userExistingReview ? 'Edit Review' : 'Write a Review'}
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, isSubmittingReview && styles.disabledSubmitButton]}
            onPress={handleSubmit}
            disabled={isSubmittingReview}
          >
            <Text style={styles.submitButtonText}>
              {isSubmittingReview ? 'Saving...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating *</Text>
            <View style={styles.ratingSection}>
              <StarRating 
                rating={localRating} 
                onRatingChange={handleRatingChange} 
                editable={true} 
                size={32}
              />
              <Text style={styles.ratingText}>
                {localRating > 0 ? `${localRating} out of 5 stars` : 'Tap to rate'}
              </Text>
            </View>
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review *</Text>
            <TextInput
              style={styles.textInput}
              value={localComment}
              onChangeText={handleTextChange}
              placeholder="Share your experience at this heritage site..."
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
              autoCorrect={false}
              blurOnSubmit={false}
            />
            <Text style={styles.characterCount}>
              {localComment.length}/500 characters
            </Text>
          </View>

          {/* Aspect Ratings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Specific Aspects</Text>
            <Text style={styles.aspectSubtitle}>Optional - Rate different aspects of your visit</Text>
            {aspectCategories.map((category) => (
              <View key={category.aspect} style={styles.aspectRow}>
                <View style={styles.aspectInfo}>
                  <Text style={styles.aspectIcon}>{category.icon}</Text>
                  <View style={styles.aspectText}>
                    <Text style={styles.aspectName}>{category.aspect}</Text>
                    <Text style={styles.aspectDescription}>{category.description}</Text>
                  </View>
                </View>
                <View style={styles.aspectRatingContainer}>
                  <StarRating
                    rating={localAspectRatings[category.aspect] || 0}
                    onRatingChange={(rating) => handleAspectRatingChange(category.aspect, rating)}
                    editable={true}
                    size={18}
                  />
                  {localAspectRatings[category.aspect] > 0 && (
                    <Text style={styles.aspectRatingText}>
                      {localAspectRatings[category.aspect]}/5
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Delete button for existing reviews */}
          {userExistingReview && onDelete && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDelete}
              >
                <Text style={styles.deleteButtonText}>Delete Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  submitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EA580C',
    borderRadius: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledSubmitButton: {
    opacity: 0.6,
    backgroundColor: '#D1D5DB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  aspectSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  ratingSection: {
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  aspectRow: {
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
    gap: 4,
  },
  aspectRatingText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignSelf: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
    borderRadius: 4,
  },
  star: {
    fontSize: 20,
  },
});
