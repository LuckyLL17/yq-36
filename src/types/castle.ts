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

export type ViewMode = 'solid' | 'wireframe' | 'uv' | 'interior';

export type RoomType = 'hall' | 'bedroom' | 'kitchen' | 'armory' | 'church' | 'dungeon' | 'library' | 'garden';

export interface Room {
  id: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  name?: string;
}

export interface Corridor {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  path: { x: number; y: number }[];
}

export interface InteriorLayout {
  rooms: Room[];
  corridors: Corridor[];
  selectedRoomId: string | null;
}

export interface RoomTemplate {
  type: RoomType;
  name: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  color: string;
}

export interface CastleState {
  params: CastleParams;
  viewMode: ViewMode;
  castleGeometries: CastleMeshData | null;
  selectedEraId: string | null;
  interiorLayout: InteriorLayout;
  setParams: (params: Partial<CastleParams>) => void;
  setViewMode: (mode: ViewMode) => void;
  setCastleGeometries: (geometries: CastleMeshData | null) => void;
  setSelectedEraId: (id: string | null) => void;
  applyEraStyle: (year: number) => void;
  resetParams: () => void;
  randomizeSeed: () => void;
  addRoom: (room: Room) => boolean;
  updateRoom: (id: string, updates: Partial<Room>) => boolean;
  deleteRoom: (id: string) => void;
  selectRoom: (id: string | null) => void;
  moveRoom: (id: string, x: number, y: number) => boolean;
  clearAllRooms: () => void;
}
