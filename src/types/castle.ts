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
  setParams: (params: Partial<CastleParams>) => void;
  setViewMode: (mode: ViewMode) => void;
  resetParams: () => void;
  randomizeSeed: () => void;
}
