import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

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

  const handleCreatePost = () => {
    if (!title || !content) {
      Alert.alert('Error', 'Please fill out the title and description.');
      return;
    }

    const newPost = {
      id: Date.now(),
      author: user?.name || 'Anonymous',
      avatar: user?.name?.charAt(0).toUpperCase() || 'A',
      time: 'Just now',
      title,
      content,
      image,
      likes: 0,
      comments: 0,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    onPostCreated(newPost);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.title}>Create a New Post</Text>
          
          <Input
            placeholder="Post Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          
          <Textarea
            placeholder="Share your experience..."
            value={content}
            onChangeText={setContent}
            style={styles.textarea}
          />

          <Input
            placeholder="Tags (comma-separated)"
            value={tags}
            onChangeText={setTags}
            style={styles.input}
          />

          <TouchableOpacity style={styles.imagePicker}>
            <Text style={styles.imagePickerText}>Add a Photo</Text>
          </TouchableOpacity>

          {image && <Image source={{ uri: image }} style={styles.previewImage} />}

          <View style={styles.buttonContainer}>
            <Button variant="outline" onPress={onCancel} style={styles.cancelButton}>
              <Text>Cancel</Text>
            </Button>
            <Button onPress={handleCreatePost} style={styles.postButton}>
              <Text style={styles.postButtonText}>Create Post</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  input: {
    marginBottom: 12,
  },
  textarea: {
    marginBottom: 12,
    height: 120,
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
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    
  },
  postButton: {
    backgroundColor: '#0EA5E9',
  },
  postButtonText: {
    color: '#FFFFFF',
  }
});