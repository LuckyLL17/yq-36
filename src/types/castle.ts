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
export type TowerType = 'basic' | 'square_fort' | 'polygon_tower' | 'spiral_stair' | 'gatehouse';
export type CrenellationStyle = 'simple' | 'decorated' | 'machicolated' | 'cross_shaped';
export type WallStyle = 'medieval' | 'roman' | 'norman' | 'gothic' | 'crusader' | 'renaissance';
export type TerrainType = 'plain' | 'hills' | 'mountain';
export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'foggy';
export type NPCType = 'farmer' | 'soldier' | 'noble';
export type BuildingType = 'main_keep' | 'great_hall' | 'chapel' | 'stable' | 'barracks';

export const BUILDING_TYPE_INFO: Record<BuildingType, { name: string; icon: string; description: string; widthRatio: number; depthRatio: number; heightRatio: number }> = {
  main_keep: {
    name: '主堡',
    icon: '🏰',
    description: '城堡的核心防御建筑，领主居所，最高大坚固',
    widthRatio: 1.3,
    depthRatio: 1.3,
    heightRatio: 1.6,
  },
  great_hall: {
    name: '大厅',
    icon: '🏛️',
    description: '宴会与议事的主要场所，宽敞高大',
    widthRatio: 1.5,
    depthRatio: 1.0,
    heightRatio: 1.2,
  },
  chapel: {
    name: '教堂',
    icon: '⛪',
    description: '宗教礼拜场所，有尖顶装饰',
    widthRatio: 0.8,
    depthRatio: 1.2,
    heightRatio: 1.4,
  },
  stable: {
    name: '马厩',
    icon: '🐴',
    description: '饲养战马和牲畜的建筑，较低矮宽敞',
    widthRatio: 1.2,
    depthRatio: 0.9,
    heightRatio: 0.7,
  },
  barracks: {
    name: '兵营',
    icon: '⚔️',
    description: '士兵驻扎和训练的场所，规整坚固',
    widthRatio: 1.4,
    depthRatio: 0.8,
    heightRatio: 0.9,
  },
};

export const TOWER_TYPE_INFO: Record<TowerType, { name: string; icon: string; description: string }> = {
  basic: {
    name: '基础塔楼',
    icon: '🗼',
    description: '根据城墙风格自动选择塔楼形状',
  },
  square_fort: {
    name: '方形堡垒',
    icon: '🏯',
    description: '坚固的方形塔楼，厚重城垛，适合防御',
  },
  polygon_tower: {
    name: '多边形塔楼',
    icon: '⬡',
    description: '六边形或八边形塔楼，视野广阔，装饰华丽',
  },
  spiral_stair: {
    name: '螺旋楼梯塔',
    icon: '🌀',
    description: '外部带螺旋楼梯的独特塔楼',
  },
  gatehouse: {
    name: '门楼式塔楼',
    icon: '🚪',
    description: '集成拱门通道的门楼塔楼，威严庄重',
  },
};

export interface TowerSpecificParams {
  squareFort: {
    crenellationHeight: number;
    buttressCount: number;
    windowRows: number;
  };
  polygonTower: {
    sides: number;
    pinnacleCount: number;
    turretHeight: number;
  };
  spiralStair: {
    stairWidth: number;
    stairTurns: number;
    centralColumnRadius: number;
  };
  gatehouse: {
    archWidth: number;
    archHeight: number;
    towerSpacing: number;
    portcullisHeight: number;
    gatehouseDepth: number;
    hasBattlements: boolean;
    hasMurderHoles: boolean;
    hasBarbican: boolean;
  };
}

export interface MoatSegment {
  id: string;
  startIndex: number;
  endIndex: number;
  waterLevel: number;
  hasDrawbridge: boolean;
  drawbridgeAngle: number;
  hasPortcullis: boolean;
  portcullisHeight: number;
}

export const DEFAULT_TOWER_PARAMS: TowerSpecificParams = {
  squareFort: {
    crenellationHeight: 1.5,
    buttressCount: 4,
    windowRows: 3,
  },
  polygonTower: {
    sides: 8,
    pinnacleCount: 8,
    turretHeight: 2,
  },
  spiralStair: {
    stairWidth: 1.2,
    stairTurns: 4,
    centralColumnRadius: 0.8,
  },
  gatehouse: {
    archWidth: 5,
    archHeight: 6,
    towerSpacing: 8,
    portcullisHeight: 5,
    gatehouseDepth: 6,
    hasBattlements: true,
    hasMurderHoles: true,
    hasBarbican: false,
  },
};

export interface MoatWaterParams {
  globalWaterLevel: number;
  waveHeight: number;
  flowSpeed: number;
  isAnimated: boolean;
}

export const DEFAULT_MOAT_WATER_PARAMS: MoatWaterParams = {
  globalWaterLevel: 0.8,
  waveHeight: 0.1,
  flowSpeed: 1,
  isAnimated: true,
};

export const NPC_TYPE_INFO: Record<NPCType, { name: string; icon: string; description: string; color: string }> = {
  farmer: {
    name: '农民',
    icon: '👨‍🌾',
    description: '穿布衣，在庭院走动',
    color: '#8B7355',
  },
  soldier: {
    name: '士兵',
    icon: '⚔️',
    description: '穿盔甲，在城墙巡逻',
    color: '#4A5568',
  },
  noble: {
    name: '贵族',
    icon: '👑',
    description: '穿华丽服装，在主建筑附近活动',
    color: '#9F7AEA',
  },
};

export const WEATHER_PRESETS: Record<WeatherType, { name: string; icon: string; description: string }> = {
  sunny: {
    name: '晴天',
    icon: '☀️',
    description: '阳光明媚，天空湛蓝',
  },
  rainy: {
    name: '雨天',
    icon: '🌧️',
    description: '细雨绵绵，润物无声',
  },
  snowy: {
    name: '雪天',
    icon: '❄️',
    description: '银装素裹，白雪皑皑',
  },
  foggy: {
    name: '雾天',
    icon: '🌫️',
    description: '云雾缭绕，如梦如幻',
  },
};

export const WALL_STYLE_PRESETS: Record<WallStyle, {
  name: string;
  icon: string;
  description: string;
  stoneColor: string;
  stoneColorDark: string;
  stoneColorLight: string;
  mortarColor: string;
  roughness: number;
  crenellationStyle: CrenellationStyle;
  towerShape: TowerShape;
}> = {
  medieval: {
    name: '中世纪',
    icon: '🏰',
    description: '经典中世纪风格，灰褐色石材，坚固厚重',
    stoneColor: '#8b7355',
    stoneColorDark: '#6b5b4f',
    stoneColorLight: '#9a8b7a',
    mortarColor: '#5a4a3a',
    roughness: 0.85,
    crenellationStyle: 'decorated',
    towerShape: 'round',
  },
  roman: {
    name: '罗马',
    icon: '🏛️',
    description: '古罗马风格，浅色凝灰岩，规整砌筑',
    stoneColor: '#c9b896',
    stoneColorDark: '#a89878',
    stoneColorLight: '#dcc8a6',
    mortarColor: '#8b7b5b',
    roughness: 0.6,
    crenellationStyle: 'simple',
    towerShape: 'square',
  },
  norman: {
    name: '诺曼',
    icon: '⚔️',
    description: '诺曼式风格，厚重方形石塔，气势雄伟',
    stoneColor: '#7a6b5a',
    stoneColorDark: '#5a4d3f',
    stoneColorLight: '#8b7d6b',
    mortarColor: '#4a3d2f',
    roughness: 0.9,
    crenellationStyle: 'simple',
    towerShape: 'square',
  },
  gothic: {
    name: '哥特',
    icon: '⛪',
    description: '哥特式风格，高耸尖塔，精致装饰',
    stoneColor: '#9a8a7a',
    stoneColorDark: '#7a6a5a',
    stoneColorLight: '#aaa090',
    mortarColor: '#6a5a4a',
    roughness: 0.7,
    crenellationStyle: 'cross_shaped',
    towerShape: 'polygonal',
  },
  crusader: {
    name: '十字军',
    icon: '✝️',
    description: '十字军风格，坚固D形塔楼，军事要塞感',
    stoneColor: '#a08060',
    stoneColorDark: '#806040',
    stoneColorLight: '#b09070',
    mortarColor: '#604020',
    roughness: 0.8,
    crenellationStyle: 'machicolated',
    towerShape: 'd_shaped',
  },
  renaissance: {
    name: '文艺复兴',
    icon: '🎨',
    description: '文艺复兴风格，典雅精致，装饰性强',
    stoneColor: '#b8a88a',
    stoneColorDark: '#98886a',
    stoneColorLight: '#d0c0a0',
    mortarColor: '#78684a',
    roughness: 0.5,
    crenellationStyle: 'decorated',
    towerShape: 'polygonal',
  },
};

export const TERRAIN_PRESETS: Record<TerrainType, { name: string; icon: string; description: string; amplitude: number; frequency: number; noiseScale: number }> = {
  plain: {
    name: '平原',
    icon: '🏞️',
    description: '平坦开阔，起伏微小',
    amplitude: 0.8,
    frequency: 1.2,
    noiseScale: 0.03,
  },
  hills: {
    name: '丘陵',
    icon: '⛰️',
    description: '温和起伏，错落有致',
    amplitude: 4.0,
    frequency: 2.0,
    noiseScale: 0.04,
  },
  mountain: {
    name: '山地',
    icon: '🏔️',
    description: '陡峭险峻，峰峦叠嶂',
    amplitude: 10.0,
    frequency: 3.0,
    noiseScale: 0.05,
  },
};

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
  towerType: TowerType;
  towerSpecificParams: TowerSpecificParams;
  crenellationStyle: CrenellationStyle;
  wallStyle: WallStyle;
  terrainType: TerrainType;
  terrainAmplitude: number;
  terrainFrequency: number;
  terrainScale: number;
  weather: WeatherType;
  timeOfDay: number;
  residentMode: boolean;
  residentCount: number;
  farmerRatio: number;
  soldierRatio: number;
  nobleRatio: number;
  moatSegments: MoatSegment[];
  moatWaterParams: MoatWaterParams;
  hasPortcullis: boolean;
  portcullisPosition: number;
  drawbridgeAngle: number;
  hasDrawbridge: boolean;
  hasGatehouse: boolean;
  hasBarLatch: boolean;
  barLatchPosition: number;
  buildingTypeDistribution: Record<BuildingType, number>;
  gateAnimationSync: boolean;
}

export interface CastleMeshData {
  walls: THREE.BufferGeometry[];
  towers: THREE.BufferGeometry[];
  gate: THREE.BufferGeometry;
  gatehouse: THREE.BufferGeometry | null;
  barLatch: THREE.BufferGeometry | null;
  moat: THREE.BufferGeometry | null;
  moatSegments: THREE.BufferGeometry[];
  water: THREE.BufferGeometry | null;
  waterSegments: THREE.BufferGeometry[];
  drawbridge: THREE.BufferGeometry | null;
  portcullis: THREE.BufferGeometry | null;
  buildings: THREE.BufferGeometry[];
  buildingTypes: BuildingType[];
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
  selectedNPCId: string | null;
  selectedNPCType: NPCType | null;
  setParams: (params: Partial<CastleParams>) => void;
  setViewMode: (mode: ViewMode) => void;
  setCastleGeometries: (geometries: CastleMeshData | null) => void;
  setSelectedEraId: (id: string | null) => void;
  applyEraStyle: (year: number) => void;
  applyTerrainType: (type: TerrainType) => void;
  applyWallStyle: (style: WallStyle) => void;
  applyWeather: (type: WeatherType) => void;
  setTimeOfDay: (time: number) => void;
  resetParams: () => void;
  randomizeSeed: () => void;
  addRoom: (room: Room) => boolean;
  updateRoom: (id: string, updates: Partial<Room>) => boolean;
  deleteRoom: (id: string) => void;
  selectRoom: (id: string | null) => void;
  moveRoom: (id: string, x: number, y: number) => boolean;
  clearAllRooms: () => void;
  toggleResidentMode: () => void;
  selectNPC: (id: string | null, type?: NPCType | null) => void;
  applyTowerType: (type: TowerType) => void;
  updateTowerSpecificParams: (type: keyof TowerSpecificParams, updates: Partial<TowerSpecificParams[keyof TowerSpecificParams]>) => void;
  setDrawbridgeAngle: (angle: number) => void;
  setPortcullisPosition: (position: number) => void;
  updateMoatSegment: (segmentId: string, updates: Partial<MoatSegment>) => void;
  addMoatSegment: (segment: Omit<MoatSegment, 'id'>) => void;
  removeMoatSegment: (segmentId: string) => void;
  setBarLatchPosition: (position: number) => void;
  setBuildingTypeDistribution: (type: BuildingType, count: number) => void;
  toggleGateAnimationSync: () => void;
  openGateSequence: () => void;
  closeGateSequence: () => void;
}
