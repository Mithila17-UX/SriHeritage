import { useState, useEffect, useCallback } from 'react';
import { syncService, authService, ForumPost, ForumComment } from '../services';

export const useForum = (category?: string, siteId?: number) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const forumPosts = await syncService.getForumPosts(category, siteId);
      setPosts(forumPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  }, [category, siteId]);

  const createPost = useCallback(async (postData: {
    title: string;
    content: string;
    category: string;
    siteId?: number;
    siteName?: string;
  }) => {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const postId = await syncService.createForumPost({
        ...postData,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userAvatar: user.photoURL || undefined,
        likes: 0,
        likedBy: [],
        commentsCount: 0
      });
      
      await loadPosts();
      return postId;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create post');
    }
  }, [loadPosts]);

  const likePost = useCallback(async (postId: string) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await syncService.likeForumPost(postId, userId);
      await loadPosts();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to like post');
    }
  }, [loadPosts]);

  const unlikePost = useCallback(async (postId: string) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await syncService.unlikeForumPost(postId, userId);
      await loadPosts();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to unlike post');
    }
  }, [loadPosts]);

  const deletePost = useCallback(async (postId: string) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await syncService.deleteForumPost(postId);
      await loadPosts();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete post');
    }
  }, [loadPosts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    loading,
    error,
    loadPosts,
    createPost,
    likePost,
    unlikePost,
    deletePost
  };
};

export const useForumComments = (postId: string) => {
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const forumComments = await syncService.getForumComments(postId);
      setComments(forumComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const createComment = useCallback(async (content: string) => {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const commentId = await syncService.createForumComment(postId, {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userAvatar: user.photoURL || undefined,
        content,
        likes: 0,
        likedBy: []
      });
      
      await loadComments();
      return commentId;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create comment');
    }
  }, [postId, loadComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await syncService.deleteForumComment(postId, commentId);
      await loadComments();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete comment');
    }
  }, [postId, loadComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    loadComments,
    createComment,
    deleteComment
  };
};

export const useForumPost = (postId: string) => {
  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const forumPost = await syncService.getForumPost(postId);
      setPost(forumPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  return {
    post,
    loading,
    error,
    loadPost
  };
};