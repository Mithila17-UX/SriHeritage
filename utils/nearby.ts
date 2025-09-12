/**
 * Nearby Sites Computation and Enrichment Utilities
 * 
 * This module provides functionality to compute nearby and within-site relations
 * based on air distance thresholds and admin overrides, then enriches them with
 * road distance using the existing routing service.
 */

import { kmBetween, siteToCoords } from './geo';

export type NearbyRelation = {
  siteId: string | number;
  airDistanceKm: number;      // always present
  roadDistanceKm?: number;    // filled later
};

export interface ComputeNeighborsOptions {
  nearbyKm: number;
  withinKm: number;
}

export interface ComputeNeighborsOverrides {
  nearby?: {
    include?: (string | number)[];
    exclude?: (string | number)[];
  };
  within?: {
    include?: (string | number)[];
    exclude?: (string | number)[];
  };
}

export interface SiteForNeighbors {
  id: string | number;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Compute neighbors for a site based on air distance thresholds and admin overrides
 */
export function computeNeighborsForSite(
  allSites: SiteForNeighbors[],
  currentSiteId: string | number,
  thresholds: ComputeNeighborsOptions = { nearbyKm: 10, withinKm: 2 },
  overrides?: ComputeNeighborsOverrides
): { nearby: NearbyRelation[]; within: NearbyRelation[] } {
  console.log('🔍 Computing neighbors for site:', currentSiteId);
  
  // Find the current site
  const currentSite = allSites.find(site => site.id === currentSiteId);
  if (!currentSite) {
    console.warn('❌ Current site not found:', currentSiteId);
    return { nearby: [], within: [] };
  }

  // Get coordinates for current site
  const currentCoords = siteToCoords(currentSite);
  if (!currentCoords) {
    console.warn('❌ Current site has no valid coordinates:', currentSiteId);
    return { nearby: [], within: [] };
  }

  console.log('📍 Current site coordinates:', currentCoords);

  // Compute air distances to all other sites
  const candidatesWithDistance: (NearbyRelation & { site: SiteForNeighbors })[] = [];
  
  for (const site of allSites) {
    // Skip self
    if (site.id === currentSiteId) continue;
    
    // Get coordinates for candidate site
    const siteCoords = siteToCoords(site);
    if (!siteCoords) {
      console.log(`⚠️  Skipping site ${site.id} - no valid coordinates`);
      continue;
    }
    
    // Calculate air distance
    const airDistanceKm = kmBetween(currentCoords, siteCoords);
    
    candidatesWithDistance.push({
      siteId: site.id,
      airDistanceKm,
      site
    });
  }

  console.log('📊 Found', candidatesWithDistance.length, 'candidates with coordinates');

  // Filter candidates by air distance thresholds
  const withinCandidates = candidatesWithDistance.filter(c => c.airDistanceKm <= thresholds.withinKm);
  const nearbyCandidates = candidatesWithDistance.filter(c => c.airDistanceKm <= thresholds.nearbyKm);

  console.log('📏 Within candidates (≤ ${thresholds.withinKm}km):', withinCandidates.length);
  console.log('📏 Nearby candidates (≤ ${thresholds.nearbyKm}km):', nearbyCandidates.length);

  // Apply overrides for within sites
  let finalWithin = withinCandidates.map(c => ({ siteId: c.siteId, airDistanceKm: c.airDistanceKm }));
  
  if (overrides?.within?.exclude) {
    const excludeSet = new Set(overrides.within.exclude.map(id => String(id)));
    finalWithin = finalWithin.filter(rel => !excludeSet.has(String(rel.siteId)));
    console.log('🚫 Applied within excludes, remaining:', finalWithin.length);
  }
  
  if (overrides?.within?.include) {
    for (const includeId of overrides.within.include) {
      // Check if this ID is not already included and has valid coordinates
      const alreadyIncluded = finalWithin.some(rel => String(rel.siteId) === String(includeId));
      if (!alreadyIncluded) {
        const includeCandidate = candidatesWithDistance.find(c => String(c.siteId) === String(includeId));
        if (includeCandidate) {
          finalWithin.push({ siteId: includeCandidate.siteId, airDistanceKm: includeCandidate.airDistanceKm });
          console.log('✅ Manually included within site:', includeId);
        } else {
          console.warn('⚠️  Cannot include within site (no coords or not found):', includeId);
        }
      }
    }
  }

  // Apply overrides for nearby sites
  let finalNearby = nearbyCandidates.map(c => ({ siteId: c.siteId, airDistanceKm: c.airDistanceKm }));
  
  if (overrides?.nearby?.exclude) {
    const excludeSet = new Set(overrides.nearby.exclude.map(id => String(id)));
    finalNearby = finalNearby.filter(rel => !excludeSet.has(String(rel.siteId)));
    console.log('🚫 Applied nearby excludes, remaining:', finalNearby.length);
  }
  
  if (overrides?.nearby?.include) {
    for (const includeId of overrides.nearby.include) {
      // Check if this ID is not already included and has valid coordinates
      const alreadyIncluded = finalNearby.some(rel => String(rel.siteId) === String(includeId));
      if (!alreadyIncluded) {
        const includeCandidate = candidatesWithDistance.find(c => String(c.siteId) === String(includeId));
        if (includeCandidate) {
          finalNearby.push({ siteId: includeCandidate.siteId, airDistanceKm: includeCandidate.airDistanceKm });
          console.log('✅ Manually included nearby site:', includeId);
        } else {
          console.warn('⚠️  Cannot include nearby site (no coords or not found):', includeId);
        }
      }
    }
  }

  // Sort by air distance (ascending)
  finalWithin.sort((a, b) => a.airDistanceKm - b.airDistanceKm);
  finalNearby.sort((a, b) => a.airDistanceKm - b.airDistanceKm);

  console.log('✅ Final results - Within:', finalWithin.length, 'Nearby:', finalNearby.length);

  return {
    within: finalWithin,
    nearby: finalNearby
  };
}

export interface EnrichWithRoadDistanceOptions {
  concurrency: number;
}

/**
 * Enrich nearby relations with road distance using the existing routing service
 */
export async function enrichWithRoadDistance(
  origin: { lat: number; lng: number },
  relations: NearbyRelation[],
  getDrivingMeters: (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => Promise<number | null>,
  lookupCoordsBySiteId: (id: string | number) => { lat: number; lng: number } | null,
  opts: EnrichWithRoadDistanceOptions = { concurrency: 4 }
): Promise<NearbyRelation[]> {
  console.log('🛣️  Enriching', relations.length, 'relations with road distance');
  
  if (relations.length === 0) {
    return [];
  }

  // Create cache for site→site road distances
  const cacheKey = (originId: string, destId: string) => `${originId}->${destId}`;
  const roadDistanceCache = new Map<string, number>();

  // Process relations in batches for concurrency control
  const results: NearbyRelation[] = [];
  const batchSize = opts.concurrency;
  
  for (let i = 0; i < relations.length; i += batchSize) {
    const batch = relations.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(relations.length / batchSize)}`);
    
    const batchPromises = batch.map(async (relation): Promise<NearbyRelation> => {
      const destCoords = lookupCoordsBySiteId(relation.siteId);
      if (!destCoords) {
        console.warn(`⚠️  No coordinates found for site ${relation.siteId}`);
        return { ...relation }; // Return without roadDistanceKm
      }

      // Check cache first
      const originKey = `${origin.lat},${origin.lng}`;
      const destKey = String(relation.siteId);
      const cacheKeyStr = cacheKey(originKey, destKey);
      
      if (roadDistanceCache.has(cacheKeyStr)) {
        const cachedKm = roadDistanceCache.get(cacheKeyStr)!;
        console.log(`💾 Cache hit for ${relation.siteId}: ${cachedKm.toFixed(1)}km`);
        return { ...relation, roadDistanceKm: cachedKm };
      }

      try {
        console.log(`🛣️  Fetching road distance to site ${relation.siteId}...`);
        const distanceMeters = await getDrivingMeters(origin, destCoords);
        
        if (distanceMeters !== null) {
          const distanceKm = distanceMeters / 1000;
          roadDistanceCache.set(cacheKeyStr, distanceKm);
          console.log(`✅ Road distance to ${relation.siteId}: ${distanceKm.toFixed(1)}km`);
          return { ...relation, roadDistanceKm: distanceKm };
        } else {
          console.warn(`⚠️  Failed to get road distance to site ${relation.siteId}`);
          return { ...relation }; // Return without roadDistanceKm
        }
      } catch (error) {
        console.error(`❌ Error getting road distance to site ${relation.siteId}:`, error);
        return { ...relation }; // Return without roadDistanceKm
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add small delay between batches to avoid overwhelming the API
    if (i + batchSize < relations.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('🏁 Road distance enrichment completed');
  console.log('📊 Cache size:', roadDistanceCache.size, 'entries');
  
  // Sort by road distance if available, fallback to air distance
  results.sort((a, b) => {
    if (a.roadDistanceKm !== undefined && b.roadDistanceKm !== undefined) {
      return a.roadDistanceKm - b.roadDistanceKm;
    }
    if (a.roadDistanceKm !== undefined && b.roadDistanceKm === undefined) {
      return -1; // a has road distance, prioritize it
    }
    if (a.roadDistanceKm === undefined && b.roadDistanceKm !== undefined) {
      return 1; // b has road distance, prioritize it
    }
    // Both don't have road distance, sort by air distance
    return a.airDistanceKm - b.airDistanceKm;
  });

  return results;
}
