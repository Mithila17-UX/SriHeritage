import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ImagePickerModal } from './ImagePickerModal';

interface CreatePostScreenProps {
  onPostCreated: (post: any) => void;
  onCancel: () => void;
  user: { name: string; email: string } | null;
}

export function CreatePostScreen({ onPostCreated, onCancel, user }: CreatePostScreenProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill out the title and description.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPost = {
        title: title.trim(),
        content: content.trim(),
        image: image,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      await onPostCreated(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelected = (imageUri: string) => {
    setImage(imageUri);
    setShowImagePicker(false);
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create a New Post</Text>
            <TouchableOpacity 
              onPress={handleCreatePost} 
              style={[styles.postButton, isSubmitting && styles.postButtonDisabled]}
              disabled={isSubmitting}
            >
              <Text style={styles.postButtonText}>
                {isSubmitting ? 'Creating...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Input
            placeholder="Post Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            maxLength={100}
          />
          
          <Textarea
            placeholder="Share your experience, thoughts, or questions about Sri Lankan heritage..."
            value={content}
            onChangeText={setContent}
            style={styles.textarea}
            maxLength={2000}
          />

          <Input
            placeholder="Tags (comma-separated, e.g., Sigiriya, Culture, Photography)"
            value={tags}
            onChangeText={setTags}
            style={styles.input}
            maxLength={200}
          />

          <View style={styles.imageSection}>
            <Text style={styles.imageSectionTitle}>Add a Photo (Optional)</Text>
            <TouchableOpacity 
              style={styles.imagePicker} 
              onPress={() => setShowImagePicker(true)}
            >
              <Text style={styles.imagePickerText}>📷 Choose Photo</Text>
            </TouchableOpacity>

            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                >
                  <Text style={styles.removeImageButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>
              {content.length}/2000 characters
            </Text>
          </View>
        </CardContent>
      </Card>

      {showImagePicker && (
        <ImagePickerModal
          onImageSelected={handleImageSelected}
          onCancel={() => setShowImagePicker(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  postButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  postButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    marginBottom: 12,
  },
  textarea: {
    marginBottom: 12,
    height: 120,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginBottom: 16,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  imagePicker: {
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePickerText: {
    color: '#0284C7',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  characterCount: {
    alignItems: 'flex-end',
  },
  characterCountText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});