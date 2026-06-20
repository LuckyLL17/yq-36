export type TowerShape = 'square' | 'round' | 'polygonal' | 'd_shaped';
export type CrenellationStyle = 'simple' | 'decorated' | 'machicolated' | 'cross_shaped';

export interface CastleParams {
  plotWidth: number;
  plotDepth: number;
  wallHeight: number;
  wallThickness: number;
  towerCount: number;
  towerHeight: number;
  towerRadius: number;
  hasMoat: boolean;
  moatWidth: number;
  moatDepth: number;
  gateWidth: number;
  gateHeight: number;
  buildingCount: number;
  buildingHeight: number;
  seed: number;
  eraYear: number;
  towerShape: TowerShape;
  crenellationStyle: CrenellationStyle;
}

export interface CastleMeshData {
  walls: THREE.BufferGeometry[];
  towers: THREE.BufferGeometry[];
  gate: THREE.BufferGeometry;
  moat: THREE.BufferGeometry | null;
  buildings: THREE.BufferGeometry[];
  ground: THREE.BufferGeometry;
}

export type ViewMode = 'solid' | 'wireframe' | 'uv';

export interface CastleState {
  params: CastleParams;
  viewMode: ViewMode;
  castleGeometries: CastleMeshData | null;
  selectedEraId: string | null;
  setParams: (params: Partial<CastleParams>) => void;
  setViewMode: (mode: ViewMode) => void;
  setCastleGeometries: (geometries: CastleMeshData | null) => void;
  setSelectedEraId: (id: string | null) => void;
  applyEraStyle: (year: number) => void;
  resetParams: () => void;
  randomizeSeed: () => void;
}
