import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, Alert } from 'react-native';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CreatePostScreen } from './CreatePostScreen';
import { CommentSection } from './CommentSection';

interface ForumScreenProps {
  user: { name: string; email: string } | null;
}

const forumPostsData = [
  {
    id: 1,
    author: 'Samantha Perera',
    avatar: 'SP',
    time: '2h ago',
    title: 'Amazing visit to Sigiriya!',
    content: 'Just completed the climb to the top of Sigiriya Rock Fortress. The frescoes are absolutely breathtaking and the view from the top is unforgettable. Highly recommend going early morning to avoid crowds.',
    image: 'https://images.unsplash.com/photo-1571715268652-3c2247e38d3e?w=400&h=200&fit=crop',
    likes: 24,
    comments: 8,
    tags: ['Sigiriya', 'Ancient Sites', 'Photography'],
    liked: false,
    postComments: [
      {
        id: '1',
        author: 'John Doe',
        avatar: 'JD',
        text: 'Amazing photos! I visited last year and had a similar experience.',
        time: '1h ago',
      },
      {
        id: '2',
        author: 'Jane Smith',
        avatar: 'JS',
        text: 'Thanks for the tip about going early morning!',
        time: '30m ago',
      }
    ]
  },
  {
    id: 2,
    author: 'Rajesh Fernando',
    avatar: 'RF',
    time: '5h ago',
    title: 'Traditional mask making workshop',
    content: 'Attended a traditional mask making workshop in Ambalangoda today. Learning about the cultural significance of each mask and the intricate craftsmanship involved was fascinating.',
    likes: 18,
    comments: 12,
    tags: ['Traditional Arts', 'Masks', 'Culture'],
    liked: false,
    postComments: [
      {
        id: '3',
        author: 'Mike Wilson',
        avatar: 'MW',
        text: 'This looks incredible! Where exactly was this workshop held?',
        time: '2h ago',
      }
    ]
  },
  {
    id: 3,
    author: 'Nisha Silva',
    avatar: 'NS',
    time: '1d ago',
    title: 'Kandy Esala Perahera experience',
    content: 'The Kandy Esala Perahera was absolutely magical! The procession of elephants, dancers, and drummers through the streets was a spiritual and cultural feast for the senses.',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=200&fit=crop',
    likes: 42,
    comments: 15,
    tags: ['Festivals', 'Kandy', 'Culture'],
    liked: true,
    postComments: [
      {
        id: '4',
        author: 'Sarah Brown',
        avatar: 'SB',
        text: 'I was there too! The cultural performances were breathtaking.',
        time: '12h ago',
      },
      {
        id: '5',
        author: 'David Lee',
        avatar: 'DL',
        text: 'Planning to attend next year. Any tips for getting good spots?',
        time: '8h ago',
      }
    ]
  }
];

export function ForumScreen({ user }: ForumScreenProps) {
  const [filter, setFilter] = useState<'all' | 'my-posts' | 'popular'>('all');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [forumPosts, setForumPosts] = useState(forumPostsData);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const handlePostCreated = (newPost: any) => {
    setForumPosts([{ ...newPost, liked: false, postComments: [] }, ...forumPosts]);
    setIsCreatingPost(false);
  };

  const handleLike = (postId: number) => {
    setForumPosts(
      forumPosts.map((post) =>
        post.id === postId
          ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const handleShare = async (post: any) => {
    try {
      await Share.share({
        message: `Check out this post from the Sri Heritage App forum: "${post.title}" by ${post.author}`,
        url: 'https://sriheritage.app',
        title: post.title,
      });
    } catch (error) {
      Alert.alert('Error', 'There was an issue sharing this post.');
    }
  };
  
  const handleAddComment = (postId: number, text: string) => {
    const newComment = {
      id: Date.now().toString(),
      author: user?.name || 'Anonymous',
      avatar: user?.name?.charAt(0).toUpperCase() || 'A',
      text,
      time: 'Just now',
    };
    
    setForumPosts(
      forumPosts.map((post) =>
        post.id === postId
          ? { 
              ...post, 
              postComments: [...(post.postComments || []), newComment],
              comments: post.comments + 1
            }
          : post
      )
    );
  };

  const handleEditComment = (postId: number, commentId: string, text: string) => {
    setForumPosts(
      forumPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              postComments: (post.postComments || []).map((comment) =>
                comment.id === commentId ? { ...comment, text } : comment
              )
            }
          : post
      )
    );
  };

  const handleDeleteComment = (postId: number, commentId: string) => {
    setForumPosts(
      forumPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              postComments: (post.postComments || []).filter((comment) => comment.id !== commentId),
              comments: Math.max(0, post.comments - 1)
            }
          : post
      )
    );
  };

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

      {/* Posts */}
      <ScrollView style={styles.postsContainer} contentContainerStyle={styles.postsContent}>
        {forumPosts.map((post) => (
          <Card key={post.id} style={styles.postCard}>
            <CardHeader style={styles.postHeader}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.avatar}</Text>
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{post.author}</Text>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
              </View>
            </CardHeader>
            
            <CardContent style={styles.postContent}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postText}>{post.content}</Text>
              
              {post.image && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: post.image }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <View style={styles.tagsContainer}>
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </Badge>
                ))}
              </View>
              
              <View style={styles.actionsContainer}>
                <View style={styles.leftActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                    <Text style={[styles.heartIcon, post.liked && styles.likedHeartIcon]}>❤️</Text>
                    <Text style={styles.actionText}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}>
                    <Text style={styles.commentIcon}>💬</Text>
                    <Text style={styles.actionText}>{post.comments}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(post)}>
                  <Text style={styles.shareIcon}>📤</Text>
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>

              {selectedPostId === post.id && (
                <CommentSection
                  comments={post.postComments || []}
                  onAddComment={(text) => handleAddComment(post.id, text)}
                  onEditComment={(commentId, text) => handleEditComment(post.id, commentId, text)}
                  onDeleteComment={(commentId) => handleDeleteComment(post.id, commentId)}
                />
              )}
            </CardContent>
          </Card>
        ))}
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
  heartIcon: {
    fontSize: 16,
  },
  likedHeartIcon: {
    color: '#EF4444',
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
});