import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

interface CommunityScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export function CommunityScreen({ onNext, onSkip }: CommunityScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <Progress value={75} style={styles.progress} />
              <TouchableOpacity onPress={onSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Feature Illustration */}
            <View style={styles.featureContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>👥</Text>
              </View>
              
              {/* Forum Post Mock */}
              <View style={styles.postMock}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>SJ</Text>
                  </View>
                  <View style={styles.postInfo}>
                    <View style={styles.postMeta}>
                      <Text style={styles.authorName}>Sarah</Text>
                      <Text style={styles.postTime}>2h ago</Text>
                    </View>
                    <Text style={styles.postContent}>
                      Just visited Sigiriya! The climb was challenging but the views were absolutely worth it. Don't forget to bring water! 🏔️
                    </Text>
                  </View>
                </View>
                
                <View style={styles.postActions}>
                  <View style={styles.actionButton}>
                    <Text style={styles.actionIcon}>❤️</Text>
                    <Text style={styles.actionCount}>12</Text>
                  </View>
                  <View style={styles.actionButton}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionCount}>5</Text>
                  </View>
                  <View style={styles.actionButton}>
                    <Text style={styles.actionIcon}>📤</Text>
                    <Text style={styles.actionText}>Share</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>Join Our Community</Text>
              <Text style={styles.description}>
                Connect with fellow heritage enthusiasts, share your experiences, and discover hidden gems together.
              </Text>

              <View style={styles.features}>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>💬</Text>
                  <Text style={styles.featureTitle}>Share Stories</Text>
                  <Text style={styles.featureDescription}>Post about your visits and experiences</Text>
                </View>
                
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>🤝</Text>
                  <Text style={styles.featureTitle}>Get Advice</Text>
                  <Text style={styles.featureDescription}>Ask questions and get travel tips</Text>
                </View>
                
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>📸</Text>
                  <Text style={styles.featureTitle}>Share Photos</Text>
                  <Text style={styles.featureDescription}>Showcase beautiful heritage sites</Text>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.nextButton} onPress={onNext}>
              <Text style={styles.nextButtonText}>Continue</Text>
              <Text style={styles.nextButtonIcon}>→</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7', // amber-100 to red-100 approximation
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  cardContent: {
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progress: {
    flex: 1,
    marginRight: 16,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  featureContainer: {
    backgroundColor: '#F3E8FF', // purple-50 to pink-100 approximation
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#9333EA', // purple-500
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  postMock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDD6FE', // purple-100
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 12,
    color: '#7C3AED', // purple-700
    fontWeight: '600',
  },
  postInfo: {
    flex: 1,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginRight: 8,
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
  postContent: {
    fontSize: 12,
    color: '#374151', // gray-700
    lineHeight: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', // gray-100
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 12,
  },
  actionCount: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280', // gray-500
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  features: {
    width: '100%',
  },
  feature: {
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280', // gray-500
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C', // orange-600
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    width: '100%',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});