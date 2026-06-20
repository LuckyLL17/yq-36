export type HeraldryBaseColor = 'crimson' | 'azure' | 'sable' | 'or' | 'argent' | 'gules' | 'purpure' | 'vert';
export type HeraldryBorderStyle = 'none' | 'simple' | 'double' | 'indented' | 'wavy' | 'lozengy';
export type HeraldryCenterPattern = 'lion' | 'eagle' | 'cross' | 'fleur_de_lis' | 'dragon' | 'sword' | 'crown' | 'star';
export type HeraldryColorScheme = 'classic' | 'royal' | 'warlike' | 'nature' | 'holy' | 'mystic';

export interface HeraldryConfig {
  baseColor: HeraldryBaseColor;
  borderStyle: HeraldryBorderStyle;
  centerPattern: HeraldryCenterPattern;
  colorScheme: HeraldryColorScheme;
  applied: boolean;
}

export const HERALDRY_BASE_COLORS: Record<HeraldryBaseColor, string> = {
  crimson: '#DC143C',
  azure: '#1E3A8A',
  sable: '#1C1C1C',
  or: '#FFD700',
  argent: '#E8E8E8',
  gules: '#CC0000',
  purpure: '#6B21A8',
  vert: '#166534',
};

export const HERALDRY_COLOR_SCHEMES: Record<HeraldryColorScheme, { primary: string; secondary: string; accent: string }> = {
  classic: { primary: '#DC143C', secondary: '#FFD700', accent: '#1C1C1C' },
  royal: { primary: '#1E3A8A', secondary: '#FFD700', accent: '#6B21A8' },
  warlike: { primary: '#CC0000', secondary: '#1C1C1C', accent: '#8B4513' },
  nature: { primary: '#166534', secondary: '#FFD700', accent: '#8B4513' },
  holy: { primary: '#E8E8E8', secondary: '#1E3A8A', accent: '#FFD700' },
  mystic: { primary: '#6B21A8', secondary: '#FFD700', accent: '#1C1C1C' },
};

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
