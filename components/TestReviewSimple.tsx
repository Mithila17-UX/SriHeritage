import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import ReviewServiceTestSimple from './ReviewServiceTestSimple';

// Simple wrapper to test if ReviewServiceTestSimple re-renders properly
const TestReviewSimple: React.FC = () => {
  console.log('🧪 TestReviewSimple component rendered');
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Review Component Test
      </Text>
      <Text style={styles.subheader}>
        Check console to verify only one initial render
      </Text>
      
      {/* This should only render once */}
      <ReviewServiceTestSimple />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  subheader: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  }
});

export default TestReviewSimple;
