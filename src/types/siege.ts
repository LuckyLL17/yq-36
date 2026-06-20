export type WeaponType = 'catapult' | 'trebuchet' | 'siege_tower' | 'battering_ram' | 'ballista';

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  range: number;
  damage: number;
  attackSpeed: number;
  description: string;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  catapult: {
    type: 'catapult',
    name: '投石车',
    range: 35,
    damage: 25,
    attackSpeed: 3,
    description: '中程抛射武器，对城墙造成范围伤害',
  },
  trebuchet: {
    type: 'trebuchet',
    name: '配重投石机',
    range: 50,
    damage: 40,
    attackSpeed: 5,
    description: '远程重型抛射武器，威力巨大但装填缓慢',
  },
  siege_tower: {
    type: 'siege_tower',
    name: '攻城塔',
    range: 5,
    damage: 0,
    attackSpeed: 0,
    description: '移动掩体，可接近城墙让步兵登城',
  },
  battering_ram: {
    type: 'battering_ram',
    name: '攻城锤',
    range: 3,
    damage: 35,
    attackSpeed: 2,
    description: '近距离攻城武器，对城门造成巨大伤害',
  },
  ballista: {
    type: 'ballista',
    name: '弩炮',
    range: 45,
    damage: 15,
    attackSpeed: 2,
    description: '精准远程武器，射速快但伤害较低',
  },
};

export interface PlacedWeapon {
  id: string;
  type: WeaponType;
  position: [number, number, number];
  rotation: number;
  cooldown: number;
  isAttacking: boolean;
  health: number;
  maxHealth: number;
}

export interface WallSegment {
  id: string;
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  centerPosition: [number, number, number];
  normal: [number, number, number];
  health: number;
  maxHealth: number;
  thickness: number;
  height: number;
}

export interface WeakPoint {
  position: [number, number, number];
  severity: number;
  wallSegmentId: string;
  description: string;
}

export interface DefensePosition {
  position: [number, number, number];
  coverage: number;
  wallSegmentId: string;
  description: string;
}

export interface Projectile {
  id: string;
  weaponId: string;
  startPosition: [number, number, number];
  targetPosition: [number, number, number];
  progress: number;
  speed: number;
  damage: number;
  type: WeaponType;
}

export interface ImpactEffect {
  id: string;
  position: [number, number, number];
  progress: number;
  damage: number;
}

export interface SiegeState {
  siegeMode: boolean;
  placementMode: boolean;
  selectedWeaponType: WeaponType;
  weapons: PlacedWeapon[];
  wallSegments: WallSegment[];
  weakPoints: WeakPoint[];
  defensePositions: DefensePosition[];
  projectiles: Projectile[];
  impacts: ImpactEffect[];
  selectedWeaponId: string | null;
  showAnalysis: boolean;

  setSiegeMode: (mode: boolean) => void;
  setPlacementMode: (mode: boolean) => void;
  setSelectedWeaponType: (type: WeaponType) => void;
  addWeapon: (weapon: Omit<PlacedWeapon, 'id' | 'cooldown' | 'isAttacking' | 'health' | 'maxHealth'>) => void;
  removeWeapon: (id: string) => void;
  selectWeapon: (id: string | null) => void;
  attackWithWeapon: (id: string, targetPosition: [number, number, number]) => void;
  updateWallSegments: (segments: WallSegment[]) => void;
  analyzeDefense: () => void;
  setShowAnalysis: (show: boolean) => void;
  updateProjectiles: (delta: number) => void;
  clearWeapons: () => void;
}
