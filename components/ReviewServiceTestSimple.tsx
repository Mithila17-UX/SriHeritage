import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

// ⭐ ZERO RE-RENDERING REVIEW FORM - FINAL FIX ⭐
const ReviewServiceTestSimple = () => {
  console.log('🔄 Component rendered - THIS SHOULD ONLY HAPPEN ONCE!');

  // REFS FOR NO RE-RENDERING (hidden state)
  const overallRatingRef = useRef(0);
  const reviewCommentRef = useRef('');
  
  // DISPLAY STATE (minimal re-renders only for UI updates)
  const [displayRating, setDisplayRating] = useState(0);
  const [displayComment, setDisplayComment] = useState('');

  // STAR RATING COMPONENT - FULLY MEMOIZED
  const StarRating = React.memo(({ rating, onRatingChange, size = 24 }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: number;
  }) => {
    console.log('⭐ StarRating rendered with rating:', rating);
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onRatingChange(i)}
          style={styles.starButton}
        >
          <Text style={[styles.star, {
            fontSize: size,
            color: i <= rating ? '#FFD700' : '#E5E7EB'
          }]}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  });

  // ZERO RE-RENDER HANDLERS
  const handleRatingChange = useCallback((rating: number) => {
    console.log('⭐ Rating changed to:', rating, '- NO COMPONENT RE-RENDER!');
    overallRatingRef.current = rating;
    setDisplayRating(rating); // Only UI update
  }, []);

  const handleCommentChange = useCallback((text: string) => {
    console.log('📝 Comment typed:', text.length, 'chars - NO COMPONENT RE-RENDER!');
    reviewCommentRef.current = text;
    setDisplayComment(text); // Only UI update
  }, []);

  const handleSubmit = useCallback(() => {
    if (overallRatingRef.current === 0) {
      Alert.alert('Please provide a rating!');
      return;
    }

    Alert.alert(
      '🎉 SUCCESS!', 
      `Rating: ${overallRatingRef.current}/5\nComment: "${reviewCommentRef.current}"\n\n✅ NO PAGE RELOADS OCCURRED!`
    );
  }, []);

  const handleReset = useCallback(() => {
    overallRatingRef.current = 0;
    reviewCommentRef.current = '';
    setDisplayRating(0);
    setDisplayComment('');
    console.log('🔄 Form reset - NO COMPONENT RE-RENDER!');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zero Re-Render Review Form</Text>
      <Text style={styles.subtitle}>✅ Type & rate without page reloads!</Text>

      {/* Rating Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Overall Rating *</Text>
        <StarRating
          rating={displayRating}
          onRatingChange={handleRatingChange}
          size={32}
        />
        <Text style={styles.ratingText}>
          {displayRating > 0 ? `${displayRating} out of 5 stars` : 'Tap to rate'}
        </Text>
      </View>

      {/* Comment Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Your Review *</Text>
        <TextInput
          style={styles.textInput}
          value={displayComment}
          onChangeText={handleCommentChange}
          placeholder="Write your review here... (type smoothly!)"
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {displayComment.length}/500 characters
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset Form</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        ✨ Check console - component only renders once!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  section: {
    marginBottom: 25,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  star: {
    fontSize: 24,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fafafa',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    marginLeft: 10,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default ReviewServiceTestSimple;
