import { getDistance, getRhumbLineBearing, computeDestinationPoint } from 'geolib';
import { Coordinate, AnalysisResult, TerrainPoint } from '../types';
import { fetchElevations as defaultFetchElevations } from './elevationService';

/**
 * Calculates adaptive sampling interval based on total distance
 * to balance precision and performance.
 */
const getAdaptiveInterval = (distance: number): number => {
  if (distance < 5000) return 30;    // High precision for short links (<5km)
  if (distance < 20000) return 100;  // Standard (5-20km)
  if (distance < 100000) return 500; // Regional (20-100km)
  return 1000;                       // Long range (>100km)
};

/**
 * Calculates LoS for a pair of coordinates, accounting for Earth's curvature and atmospheric refraction.
 */
export const runLoSAnalysis = async (
  id: string,
  pointA: Coordinate,
  pointB: Coordinate,
  fetchElevations = defaultFetchElevations,
  options: { kFactor?: number; earthRadius?: number } = {}
): Promise<AnalysisResult> => {
  const { kFactor = 1.333, earthRadius = 6371000 } = options;

  // 1. Calculate Geodesic Distance
  const totalDistance = getDistance(
    { latitude: pointA.lat, longitude: pointA.lng },
    { latitude: pointB.lat, longitude: pointB.lng }
  );

  // 2. Adaptive Sampling
  const interval = getAdaptiveInterval(totalDistance);
  const numSamples = Math.max(2, Math.min(Math.ceil(totalDistance / interval), 400)); // Cap at 400 points for UI stability
  
  const sampledCoords: Coordinate[] = [];
  const bearing = getRhumbLineBearing(
    { latitude: pointA.lat, longitude: pointA.lng },
    { latitude: pointB.lat, longitude: pointB.lng }
  );

  for (let i = 0; i <= numSamples; i++) {
    const d = (i / numSamples) * totalDistance;
    const dest = computeDestinationPoint(
      { latitude: pointA.lat, longitude: pointA.lng },
      d,
      bearing
    );
    sampledCoords.push({ lat: dest.latitude, lng: dest.longitude });
  }

  // 3. Fetch Elevation
  const elevations = await fetchElevations(sampledCoords);
  
  if (!elevations || elevations.length === 0) {
    throw new Error("No elevation data returned from provider.");
  }

  const startAlt = elevations[0];
  const endAlt = elevations[elevations.length - 1];

  // 4. Calculate LoS
  let isBlocked = false;
  let maxObstructionHeight = 0;
  let maxObstructionPoint: Coordinate | undefined;

  const profile: TerrainPoint[] = sampledCoords.map((coord, i) => {
    const d = (i / numSamples) * totalDistance;
    const groundAlt = elevations[i];
    
    // accounting for earth curvature/refraction
    const flatLosHeight = startAlt + (endAlt - startAlt) * (d / totalDistance);
    const curvatureCorrection = (d * (totalDistance - d)) / (2 * kFactor * earthRadius);
    const losHeight = flatLosHeight - curvatureCorrection;
    
    const obstructionValue = groundAlt - losHeight;
    const obstructed = obstructionValue > 0.05; // 5cm threshold for numerical noise

    if (obstructed) {
      isBlocked = true;
      if (obstructionValue > maxObstructionHeight) {
        maxObstructionHeight = obstructionValue;
        maxObstructionPoint = { ...coord, alt: groundAlt };
      }
    }

    return {
      ...coord,
      alt: groundAlt,
      distance: d,
      losHeight,
      isObstructed: obstructed
    };
  });

  return {
    id,
    nameA: pointA.name,
    nameB: pointB.name,
    pointA: { ...pointA, alt: startAlt },
    pointB: { ...pointB, alt: endAlt },
    distance: totalDistance,
    status: isBlocked ? 'Blocked' : 'Clear',
    maxObstructionHeight,
    maxObstructionPoint,
    profile,
    settings: { kFactor, earthRadius }
  };
};
