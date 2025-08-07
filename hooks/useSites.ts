import { useState, useEffect, useCallback } from 'react';
import { databaseService, authService, syncService, Site } from '../services';

export const useSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allSites = await databaseService.getAllSites();
      setSites(allSites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSites = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await databaseService.searchSites(query);
      setSites(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search sites');
    } finally {
      setLoading(false);
    }
  }, []);

  const getSitesByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const categorySites = await databaseService.getSitesByCategory(category);
      setSites(categorySites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sites by category');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  return {
    sites,
    loading,
    error,
    loadSites,
    searchSites,
    getSitesByCategory
  };
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    const userId = authService.getCurrentUserId();
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const favoriteSites = await databaseService.getFavoriteSites(userId);
      setFavorites(favoriteSites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  const addFavorite = useCallback(async (siteId: number) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await databaseService.addFavoriteSite(userId, siteId);
      await loadFavorites();
      
      // Sync to Firestore in background
      syncService.syncFavoritesToFirestore(userId).catch(console.error);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add favorite');
    }
  }, [loadFavorites]);

  const removeFavorite = useCallback(async (siteId: number) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await databaseService.removeFavoriteSite(userId, siteId);
      await loadFavorites();
      
      // Sync to Firestore in background
      syncService.syncFavoritesToFirestore(userId).catch(console.error);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to remove favorite');
    }
  }, [loadFavorites]);

  const isFavorite = useCallback(async (siteId: number): Promise<boolean> => {
    const userId = authService.getCurrentUserId();
    if (!userId) return false;

    try {
      return await databaseService.isSiteFavorited(userId, siteId);
    } catch (err) {
      console.error('Failed to check favorite status:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    loadFavorites,
    addFavorite,
    removeFavorite,
    isFavorite
  };
};

export const useVisited = () => {
  const [visited, setVisited] = useState<(Site & { visited_at: string; notes?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVisited = useCallback(async () => {
    const userId = authService.getCurrentUserId();
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const visitedSites = await databaseService.getVisitedSites(userId);
      setVisited(visitedSites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visited sites');
    } finally {
      setLoading(false);
    }
  }, []);

  const addVisited = useCallback(async (siteId: number, notes?: string) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await databaseService.addVisitedSite(userId, siteId, notes);
      await loadVisited();
      
      // Sync to Firestore in background
      syncService.syncVisitedToFirestore(userId).catch(console.error);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add visited site');
    }
  }, [loadVisited]);

  const removeVisited = useCallback(async (siteId: number) => {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await databaseService.removeVisitedSite(userId, siteId);
      await loadVisited();
      
      // Sync to Firestore in background
      syncService.syncVisitedToFirestore(userId).catch(console.error);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to remove visited site');
    }
  }, [loadVisited]);

  const isVisited = useCallback(async (siteId: number): Promise<boolean> => {
    const userId = authService.getCurrentUserId();
    if (!userId) return false;

    try {
      return await databaseService.isSiteVisited(userId, siteId);
    } catch (err) {
      console.error('Failed to check visited status:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    loadVisited();
  }, [loadVisited]);

  return {
    visited,
    loading,
    error,
    loadVisited,
    addVisited,
    removeVisited,
    isVisited
  };
};