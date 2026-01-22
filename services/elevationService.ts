import { Coordinate } from '../types';

const CACHE_PREFIX = 'terrascan_elev_v2_';
const PRECISION = 5;

const getCacheKey = (lat: number, lng: number): string => {
  return `${CACHE_PREFIX}${lat.toFixed(PRECISION)}_${lng.toFixed(PRECISION)}`;
};

/**
 * Optimized elevation fetcher with aggressive caching and batch deduplication.
 */
export const fetchElevations = async (points: Coordinate[]): Promise<number[]> => {
  if (!points.length) return [];

  const results: number[] = new Array(points.length);
  const toFetchIndices: number[] = [];
  const toFetchPoints: Coordinate[] = [];
  const cacheMap = new Map<string, number>();

  // 1. Check local cache
  points.forEach((p, i) => {
    const key = getCacheKey(p.lat, p.lng);
    const cached = localStorage.getItem(key);
    if (cached !== null) {
      results[i] = parseFloat(cached);
    } else {
      toFetchIndices.push(i);
      toFetchPoints.push(p);
    }
  });

  // 2. Fetch missing data with deduplication
  if (toFetchPoints.length > 0) {
    const uniquePoints = Array.from(new Set(toFetchPoints.map(p => `${p.lat.toFixed(PRECISION)},${p.lng.toFixed(PRECISION)}`)))
      .map(str => {
        const [lat, lng] = str.split(',').map(Number);
        return { latitude: lat, longitude: lng };
      });

    try {
      const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ locations: uniquePoints }),
      });

      if (!response.ok) throw new Error(`Elevation API status ${response.status}`);

      const data = await response.json();
      data.results.forEach((r: any) => {
        const key = `${r.latitude.toFixed(PRECISION)},${r.longitude.toFixed(PRECISION)}`;
        cacheMap.set(key, r.elevation);
        localStorage.setItem(`${CACHE_PREFIX}${key.replace(',', '_')}`, r.elevation.toString());
      });

      toFetchIndices.forEach((origIdx, fetchIdx) => {
        const p = toFetchPoints[fetchIdx];
        const key = `${p.lat.toFixed(PRECISION)},${p.lng.toFixed(PRECISION)}`;
        results[origIdx] = cacheMap.get(key) || 0;
      });

    } catch (error) {
      console.error('API fetch failed:', error);
      throw new Error("Failed to fetch elevation data. The public API might be overloaded or down.");
    }
  }

  return results;
};
