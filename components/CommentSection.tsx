import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  onEditComment: (id: string, text: string) => void;
  onDeleteComment: (id: string) => void;
}

export function CommentSection({ comments, onAddComment, onEditComment, onDeleteComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleSaveEdit = () => {
    if (editingCommentId && editingText.trim()) {
      onEditComment(editingCommentId, editingText);
      setEditingCommentId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteComment(commentId) }
      ]
    );
  };

  const renderComment = (item: Comment) => (
    <View key={item.id} style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthorSection}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>{item.avatar}</Text>
          </View>
          <Text style={styles.commentAuthor}>{item.author}</Text>
        </View>
        <Text style={styles.commentTime}>{item.time}</Text>
      </View>
      {editingCommentId === item.id ? (
        <View style={styles.editContainer}>
          <Input 
            value={editingText} 
            onChangeText={setEditingText} 
            style={styles.editInput}
            multiline
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
          <Text style={styles.commentText}>{item.text}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={styles.actionButton}>
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
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
        />
        <TouchableOpacity onPress={handleAddComment} style={styles.postButton}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
      
      {comments.length > 0 && (
        <View style={styles.commentsList}>
          {comments.map(renderComment)}
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
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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