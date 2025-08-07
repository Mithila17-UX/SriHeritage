import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { forumService, ForumComment } from '../services/forumService';
import { authService } from '../services/auth';

interface CommentSectionProps {
  postId: string;
  onAddComment: (text: string) => void;
  onEditComment: (id: string, text: string) => void;
  onDeleteComment: (id: string) => void;
}

export function CommentSection({ postId, onAddComment, onEditComment, onDeleteComment }: CommentSectionProps) {
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const forumComments = await forumService.getComments(postId);
      setComments(forumComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
      // Reload comments to show the new one
      await loadComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment: ForumComment) => {
    setEditingCommentId(comment.id!);
    setEditingText(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editingText.trim()) return;
    
    try {
      await onEditComment(editingCommentId, editingText);
      setEditingCommentId(null);
      setEditingText('');
      // Reload comments to show the updated one
      await loadComments();
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await onDeleteComment(commentId);
              // Reload comments to reflect the deletion
              await loadComments();
            } catch (error) {
              console.error('Failed to delete comment:', error);
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const canEditComment = (comment: ForumComment) => {
    const userId = authService.getCurrentUserId();
    return comment.userId === userId;
  };

  const renderComment = (item: ForumComment) => (
    <View key={item.id} style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthorSection}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {item.userAvatar || item.userName?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          <Text style={styles.commentAuthor}>{item.userName}</Text>
        </View>
        <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
      {editingCommentId === item.id ? (
        <View style={styles.editContainer}>
          <Input 
            value={editingText} 
            onChangeText={setEditingText} 
            style={styles.editInput}
            multiline
            maxLength={500}
          />
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={handleSaveEdit} style={[styles.editButton, styles.saveButton]}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEdit} style={[styles.editButton, styles.cancelButton]}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.commentText}>{item.content}</Text>
          {canEditComment(item) && (
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteComment(item.id!)} style={styles.actionButton}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addCommentContainer}>
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          style={styles.input}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          onPress={handleAddComment} 
          style={[styles.postButton, submitting && styles.postButtonDisabled]}
          disabled={submitting || !newComment.trim()}
        >
          <Text style={styles.postButtonText}>
            {submitting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6B7280" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : comments.length > 0 ? (
        <View style={styles.commentsList}>
          {comments.map(renderComment)}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to comment!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
  },
  postButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentsList: {
    gap: 12,
  },
  commentContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C2410C',
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
  },
  commentTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  commentText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteText: {
    color: '#EF4444',
  },
  editContainer: {
    gap: 8,
  },
  editInput: {
    minHeight: 60,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: '#0EA5E9',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
});