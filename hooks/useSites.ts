import { useState, useEffect, useCallback } from 'react';
import { databaseService, authService, syncService, Site } from '../services';
import { computeNeighborsForSite, enrichWithRoadDistance, NearbyRelation } from '../utils/nearby';
import { siteToCoords } from '../utils/geo';
import { routingServiceOSM } from '../services/routingServiceOSM';

export const useSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [computingNearby, setComputingNearby] = useState(false);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allSites = await databaseService.getAllSites();
      setSites(allSites);
      
      // Start computing nearby relations in the background
      computeAllNearbyRelations(allSites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, []);

  const computeAllNearbyRelations = async (allSites: Site[]) => {
    console.log('🔄 Starting nearby relations computation for', allSites.length, 'sites');
    setComputingNearby(true);
    
    try {
      const sitesWithNearby: Site[] = [];
      
      for (const site of allSites) {
        console.log(`🏛️  Computing for site: ${site.name} (${site.id})`);
        
        // Compute candidates by air distance
        const { within, nearby } = computeNeighborsForSite(
          allSites,
          site.id,
          { nearbyKm: 10, withinKm: 2 },
          {
            nearby: site.nearby_overrides,
            within: site.within_overrides
          }
        );

        // Get site coordinates for road distance enrichment
        const siteCoords = siteToCoords(site);
        
        let enrichedWithin: NearbyRelation[] = within;
        let enrichedNearby: NearbyRelation[] = nearby;
        
        if (siteCoords && routingServiceOSM.isAvailable()) {
          console.log(`🛣️  Enriching ${within.length + nearby.length} relations with road distance`);
          
          // Create lookup function for coordinates
          const lookupCoords = (siteId: string | number) => {
            const targetSite = allSites.find(s => s.id === siteId);
            return targetSite ? siteToCoords(targetSite) : null;
          };
          
          // Enrich with road distance using the OSM routing service
          const getDrivingMeters = async (origin: {lat: number; lng: number}, destination: {lat: number; lng: number}) => {
            const distanceKm = await routingServiceOSM.getRoadDistance(
              { latitude: origin.lat, longitude: origin.lng },
              { latitude: destination.lat, longitude: destination.lng }
            );
            return distanceKm ? distanceKm * 1000 : null; // Convert km to meters
          };

          // Enrich within and nearby separately with smaller concurrency
          [enrichedWithin, enrichedNearby] = await Promise.all([
            enrichWithRoadDistance(siteCoords, within, getDrivingMeters, lookupCoords, { concurrency: 2 }),
            enrichWithRoadDistance(siteCoords, nearby, getDrivingMeters, lookupCoords, { concurrency: 2 })
          ]);
        } else {
          if (!siteCoords) {
            console.log(`⚠️  Site ${site.id} has no coordinates, skipping road distance enrichment`);
          }
          if (!routingServiceOSM.isAvailable()) {
            console.log(`⚠️  OSM Routing service not available, skipping road distance enrichment`);
          }
        }
        
        // Add computed fields to site
        const enrichedSite: Site = {
          ...site,
          computedWithin: enrichedWithin,
          computedNearby: enrichedNearby
        };
        
        sitesWithNearby.push(enrichedSite);
      }
      
      console.log('✅ Nearby relations computation completed');
      setSites(sitesWithNearby);
    } catch (err) {
      console.error('❌ Error computing nearby relations:', err);
      // Don't throw, just log the error and continue with sites without computed relations
    } finally {
      setComputingNearby(false);
    }
  };

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

  // Selector to get site by ID
  const getSiteById = useCallback((id: string | number): Site | null => {
    return sites.find(site => String(site.id) === String(id)) || null;
  }, [sites]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  return {
    sites,
    loading,
    error,
    computingNearby,
    loadSites,
    searchSites,
    getSitesByCategory,
    getSiteById
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