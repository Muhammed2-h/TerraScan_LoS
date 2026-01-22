
export interface Coordinate {
  lat: number;
  lng: number;
  alt?: number;
  name?: string;
}

export interface TerrainPoint extends Coordinate {
  distance: number;
  losHeight: number;
  isObstructed: boolean;
}

export interface AnalysisResult {
  id: string;
  nameA?: string;
  nameB?: string;
  pointA: Coordinate;
  pointB: Coordinate;
  distance: number;
  status: 'Clear' | 'Blocked' | 'Error';
  errorMessage?: string;
  maxObstructionHeight: number;
  maxObstructionPoint?: Coordinate;
  profile: TerrainPoint[];
  settings?: {
    kFactor: number;
    earthRadius: number;
  };
}

export enum InputMode {
  MANUAL = 'MANUAL',
  BATCH = 'BATCH'
}

export interface AppState {
  pointA: Coordinate;
  targets: Coordinate[];
  lockA: boolean;
  lockB: boolean;
  results: AnalysisResult[];
  isAnalyzing: boolean;
  kFactor: number;
  earthRadius: number;
}
