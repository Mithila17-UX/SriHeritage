import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { forumService, ForumPost } from '../../services/forumService';

interface AdminPanelForumTabProps {
  onBack: () => void;
}

export function AdminPanelForumTab({ onBack }: AdminPanelForumTabProps) {
  const [pendingPosts, setPendingPosts] = useState<ForumPost[]>([]);
  const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const loadPendingPosts = async () => {
    setLoading(true);
    try {
      const posts = await forumService.getPendingPosts();
      setPendingPosts(posts);
    } catch (error) {
      console.error('Failed to load pending posts:', error);
      Alert.alert('Error', 'Failed to load pending posts');
    } finally {
      setLoading(false);
    }
  };

  const loadAllPosts = async () => {
    setLoading(true);
    try {
      const result = await forumService.getPosts({ approvedOnly: false });
      setAllPosts(result.posts);
    } catch (error) {
      console.error('Failed to load all posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      await forumService.approvePost(postId);
      Alert.alert('Success', 'Post approved successfully');
      if (activeTab === 'pending') {
        await loadPendingPosts();
      } else {
        await loadAllPosts();
      }
    } catch (error) {
      console.error('Failed to approve post:', error);
      Alert.alert('Error', 'Failed to approve post');
    }
  };

  const handleRejectPost = async (postId: string) => {
    try {
      await forumService.rejectPost(postId);
      Alert.alert('Success', 'Post rejected successfully');
      if (activeTab === 'pending') {
        await loadPendingPosts();
      } else {
        await loadAllPosts();
      }
    } catch (error) {
      console.error('Failed to reject post:', error);
      Alert.alert('Error', 'Failed to reject post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await forumService.deletePost(postId);
              Alert.alert('Success', 'Post deleted successfully');
              if (activeTab === 'pending') {
                await loadPendingPosts();
              } else {
                await loadAllPosts();
              }
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingPosts();
    } else {
      loadAllPosts();
    }
  }, [activeTab]);

  const renderPost = (post: ForumPost) => (
    <Card key={post.id} style={styles.postCard}>
      <CardHeader style={styles.postHeader}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.userAvatar || post.userName?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.userName}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
          <View style={styles.statusContainer}>
            {post.isApproved ? (
              <Badge variant="default" style={styles.approvedBadge}>
                <Text style={styles.badgeText}>Approved</Text>
              </Badge>
            ) : (
              <Badge variant="secondary" style={styles.pendingBadge}>
                <Text style={styles.badgeText}>Pending</Text>
              </Badge>
            )}
          </View>
        </View>
      </CardHeader>
      
      <CardContent style={styles.postContent}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postText} numberOfLines={3}>{post.content}</Text>
        
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </Badge>
            ))}
          </View>
        )}
        
        <View style={styles.postStats}>
          <Text style={styles.statText}>❤️ {post.likes || 0}</Text>
          <Text style={styles.statText}>💬 {post.commentsCount || 0}</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          {!post.isApproved && (
            <>
              <Button 
                onPress={() => handleApprovePost(post.id!)} 
                style={styles.approveButton}
              >
                <Text style={styles.approveButtonText}>Approve</Text>
              </Button>
              <Button 
                onPress={() => handleRejectPost(post.id!)} 
                variant="outline"
                style={styles.rejectButton}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </Button>
            </>
          )}
          <Button 
            onPress={() => handleDeletePost(post.id!)} 
            variant="outline"
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const posts = activeTab === 'pending' ? pendingPosts : allPosts;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forum Management</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingPosts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Posts
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === 'pending' ? 'No pending posts' : 'No posts found'}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'pending' 
              ? 'All posts have been reviewed' 
              : 'Posts will appear here once created'
            }
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.postsContainer} contentContainerStyle={styles.postsContent}>
          {posts.map(renderPost)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#0EA5E9',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0EA5E9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  postsContainer: {
    flex: 1,
  },
  postsContent: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
  },
  postHeader: {
    paddingBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C2410C',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  approvedBadge: {
    backgroundColor: '#10B981',
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  postContent: {
    paddingTop: 0,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  postText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  approveButton: {
    backgroundColor: '#10B981',
    flex: 1,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    borderColor: '#F59E0B',
    flex: 1,
  },
  rejectButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
