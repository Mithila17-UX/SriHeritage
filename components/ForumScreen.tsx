import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CreatePostScreen } from './CreatePostScreen';
import { CommentSection } from './CommentSection';
import { forumService, ForumPost } from '../services/forumService';
import { authService } from '../services/auth';

interface ForumScreenProps {
  user: { name: string; email: string } | null;
}

export function ForumScreen({ user }: ForumScreenProps) {
  const [filter, setFilter] = useState<'all' | 'my-posts' | 'popular'>('all');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (refresh = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const options: any = {
        limit: 10,
        approvedOnly: true
      };

      if (filter === 'my-posts' && user) {
        options.userId = authService.getCurrentUserId();
      }

      if (!refresh && lastDoc) {
        options.lastDoc = lastDoc;
      }

      const result = await forumService.getPosts(options);
      
      if (refresh) {
        setForumPosts(result.posts);
      } else {
        setForumPosts(prev => [...prev, ...result.posts]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.posts.length === 10);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, user, lastDoc, loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLastDoc(null);
    setHasMore(true);
    loadPosts(true);
  }, [loadPosts]);

  const handlePostCreated = async (newPost: any) => {
    try {
      const postId = await forumService.createPost({
        title: newPost.title,
        content: newPost.content,
        category: 'general',
        tags: newPost.tags || [],
        imageUrl: newPost.image || undefined
      });
      
      // Refresh posts to show the new post
      onRefresh();
      setIsCreatingPost(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await forumService.toggleLike(postId);
      
      // Update the post in the local state
      setForumPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes: result.likesCount,
                likedBy: result.liked 
                  ? [...(post.likedBy || []), authService.getCurrentUserId() || '']
                  : (post.likedBy || []).filter(id => id !== authService.getCurrentUserId())
              }
            : post
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to like post';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleShare = async (post: ForumPost) => {
    try {
      await Share.share({
        message: `Check out this post from the Sri Heritage App forum: "${post.title}" by ${post.userName}`,
        url: 'https://sriheritage.app',
        title: post.title,
      });
    } catch (error) {
      Alert.alert('Error', 'There was an issue sharing this post.');
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    try {
      await forumService.createComment(postId, text);
      
      // Update the post's comment count
      setForumPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
            : post
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleEditComment = async (postId: string, commentId: string, text: string) => {
    try {
      await forumService.updateComment(postId, commentId, text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit comment';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await forumService.deleteComment(postId, commentId);
      
      // Update the post's comment count
      setForumPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: Math.max((post.commentsCount || 0) - 1, 0) }
            : post
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment';
      Alert.alert('Error', errorMessage);
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
              setForumPosts(prev => prev.filter(post => post.id !== postId));
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete post';
              Alert.alert('Error', errorMessage);
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

  const isLikedByUser = (post: ForumPost) => {
    const userId = authService.getCurrentUserId();
    return post.likedBy?.includes(userId || '') || false;
  };

  const canEditPost = (post: ForumPost) => {
    const userId = authService.getCurrentUserId();
    return post.userId === userId;
  };

  useEffect(() => {
    onRefresh();
  }, [filter]);

  if (isCreatingPost) {
    return (
      <CreatePostScreen
        user={user}
        onPostCreated={handlePostCreated}
        onCancel={() => setIsCreatingPost(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Community Forum</Text>
            <Text style={styles.headerSubtitle}>Share your heritage experiences</Text>
          </View>
          <TouchableOpacity style={styles.newPostButton} onPress={() => setIsCreatingPost(true)}>
            <Text style={styles.newPostIcon}>➕</Text>
            <Text style={styles.newPostText}>New Post</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'my-posts', label: 'My Posts' },
            { key: 'popular', label: 'Popular' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filter === tab.key && styles.activeFilterTab
              ]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                filter === tab.key && styles.activeFilterTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>🔽</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Posts */}
      <ScrollView 
        style={styles.postsContainer} 
        contentContainerStyle={styles.postsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollEndDrag={() => {
          if (hasMore && !loading) {
            loadPosts();
          }
        }}
      >
        {forumPosts.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share your experience!</Text>
          </View>
        ) : (
          forumPosts.map((post) => (
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
                  {canEditPost(post) && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeletePost(post.id!)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </CardHeader>
              
              <CardContent style={styles.postContent}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postText}>{post.content}</Text>
                
                {post.imageUrl && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: post.imageUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                {post.tags && post.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </Badge>
                    ))}
                  </View>
                )}
                
                <View style={styles.actionsContainer}>
                  <View style={styles.leftActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id!)}>
                      <Ionicons 
                        name={isLikedByUser(post) ? "heart" : "heart-outline"} 
                        size={20} 
                        color={isLikedByUser(post) ? "#EF4444" : "#EF4444"} 
                      />
                      <Text style={styles.actionText}>{post.likes || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setSelectedPostId(selectedPostId === post.id ? null : (post.id || null))}>
                      <Text style={styles.commentIcon}>💬</Text>
                      <Text style={styles.actionText}>{post.commentsCount || 0}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(post)}>
                    <Text style={styles.shareIcon}>📤</Text>
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>

                {selectedPostId === post.id && (
                  <CommentSection
                    postId={post.id!}
                    onAddComment={(text) => handleAddComment(post.id!, text)}
                    onEditComment={(commentId, text) => handleEditComment(post.id!, commentId, text)}
                    onDeleteComment={(commentId) => handleDeleteComment(post.id!, commentId)}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#0EA5E9',
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0F2FE',
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newPostIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  newPostText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  activeFilterTab: {
    backgroundColor: '#EA580C',
  },
  filterTabText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  filterIcon: {
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    paddingBottom: 16,
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
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
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
  imageContainer: {
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 192,
    borderRadius: 8,
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
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  commentIcon: {
    fontSize: 16,
  },
  shareIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});