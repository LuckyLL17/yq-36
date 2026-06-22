import { create } from 'zustand';
import { CastleParams, CastleState, ViewMode, Room, Corridor, TerrainType, TERRAIN_PRESETS, WeatherType, WEATHER_PRESETS, WallStyle, WALL_STYLE_PRESETS, TowerType, TOWER_TYPE_INFO, DEFAULT_TOWER_PARAMS, DEFAULT_MOAT_WATER_PARAMS, MoatSegment, TowerSpecificParams, BuildingType, UVMappingMode, MaterialParams, DEFAULT_MATERIAL_PARAMS, PanelGroupId } from '@/types/castle';
import { getInterpolatedStyle } from '@/data/historicalEras';

function generateDefaultMoatSegments(): MoatSegment[] {
  return [
    { id: 'seg_1', startIndex: 0, endIndex: 1, waterLevel: 0.8, hasDrawbridge: true, drawbridgeAngle: 0, hasPortcullis: true, portcullisHeight: 0 },
    { id: 'seg_2', startIndex: 1, endIndex: 2, waterLevel: 0.8, hasDrawbridge: false, drawbridgeAngle: 0, hasPortcullis: false, portcullisHeight: 0 },
    { id: 'seg_3', startIndex: 2, endIndex: 3, waterLevel: 0.8, hasDrawbridge: false, drawbridgeAngle: 0, hasPortcullis: false, portcullisHeight: 0 },
    { id: 'seg_4', startIndex: 3, endIndex: 0, waterLevel: 0.8, hasDrawbridge: false, drawbridgeAngle: 0, hasPortcullis: false, portcullisHeight: 0 },
  ];
}

const baseParams: CastleParams = {
  plotWidth: 40,
  plotDepth: 30,
  wallHeight: 8,
  wallThickness: 2,
  towerCount: 5,
  towerHeight: 12,
  towerRadius: 3,
  hasMoat: true,
  moatWidth: 4,
  moatDepth: 3,
  gateWidth: 5,
  gateHeight: 6,
  buildingCount: 6,
  buildingHeight: 6,
  seed: 12345,
  eraYear: 1200,
  towerShape: 'round',
  towerType: 'basic',
  towerSpecificParams: { ...DEFAULT_TOWER_PARAMS },
  crenellationStyle: 'decorated',
  wallStyle: 'medieval',
  terrainType: 'plain',
  terrainAmplitude: TERRAIN_PRESETS.plain.amplitude,
  terrainFrequency: TERRAIN_PRESETS.plain.frequency,
  terrainScale: TERRAIN_PRESETS.plain.noiseScale,
  weather: 'sunny',
  timeOfDay: 12,
  residentMode: false,
  residentCount: 12,
  farmerRatio: 0.5,
  soldierRatio: 0.3,
  nobleRatio: 0.2,
  moatSegments: generateDefaultMoatSegments(),
  moatWaterParams: { ...DEFAULT_MOAT_WATER_PARAMS },
  hasPortcullis: true,
  portcullisPosition: 0,
  drawbridgeAngle: 0,
  hasDrawbridge: true,
  hasGatehouse: true,
  hasBarLatch: true,
  barLatchPosition: 0,
  buildingTypeDistribution: {
    main_keep: 1,
    great_hall: 1,
    chapel: 1,
    stable: 1,
    barracks: 2,
  },
  gateAnimationSync: false,
  materialParams: { ...DEFAULT_MATERIAL_PARAMS },
};

function buildDefaultParams(): CastleParams {
  const style = getInterpolatedStyle(baseParams.eraYear);
  return {
    ...baseParams,
    wallHeight: baseParams.wallHeight * style.wallHeightMultiplier,
    wallThickness: baseParams.wallThickness * style.wallThicknessMultiplier,
    towerHeight: baseParams.towerHeight * style.towerHeightMultiplier,
    towerRadius: baseParams.towerRadius * style.towerRadiusMultiplier,
    hasMoat: style.hasMoat,
    buildingCount: Math.round(baseParams.buildingCount * style.buildingCountMultiplier),
    towerShape: style.towerShape,
    crenellationStyle: style.crenellationStyle,
    towerSpecificParams: { ...DEFAULT_TOWER_PARAMS },
    moatSegments: generateDefaultMoatSegments(),
    moatWaterParams: { ...DEFAULT_MOAT_WATER_PARAMS },
    materialParams: { ...DEFAULT_MATERIAL_PARAMS },
  };
}

const defaultParams: CastleParams = buildDefaultParams();

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getRoomCenter(room: Room) {
  return { x: room.x + room.width / 2, y: room.y + room.height / 2 };
}

function roomsOverlap(a: Room, b: Room): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function hasOverlapWithOthers(room: Room, others: Room[], excludeId?: string): boolean {
  for (const other of others) {
    if (excludeId && other.id === excludeId) continue;
    if (roomsOverlap(room, other)) return true;
  }
  return false;
}

function clampRoomToBounds(room: Room, plotWidth: number, plotDepth: number, wallThickness: number): Room {
  const innerWidth = plotWidth - wallThickness * 2;
  const innerHeight = plotDepth - wallThickness * 2;
  return {
    ...room,
    x: Math.max(0, Math.min(innerWidth - room.width, room.x)),
    y: Math.max(0, Math.min(innerHeight - room.height, room.y)),
  };
}

interface Edge {
  from: number;
  to: number;
  weight: number;
}

function generateCorridors(rooms: Room[]): Corridor[] {
  const corridors: Corridor[] = [];
  if (rooms.length < 2) return corridors;

  const n = rooms.length;
  const centers = rooms.map(getRoomCenter);
  const edges: Edge[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = Math.abs(centers[i].x - centers[j].x);
      const dy = Math.abs(centers[i].y - centers[j].y);
      edges.push({ from: i, to: j, weight: dx + dy });
    }
  }

  edges.sort((a, b) => a.weight - b.weight);

  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a: number, b: number): boolean {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
    return true;
  }

  const mstEdges: Edge[] = [];
  for (const edge of edges) {
    if (union(edge.from, edge.to)) {
      mstEdges.push(edge);
      if (mstEdges.length === n - 1) break;
    }
  }

  for (const edge of mstEdges) {
    const roomA = rooms[edge.from];
    const roomB = rooms[edge.to];
    const centerA = centers[edge.from];
    const centerB = centers[edge.to];

    const midX = (centerA.x + centerB.x) / 2;
    const path = [
      { x: centerA.x, y: centerA.y },
      { x: midX, y: centerA.y },
      { x: midX, y: centerB.y },
      { x: centerB.x, y: centerB.y },
    ];

    corridors.push({
      id: generateId(),
      fromRoomId: roomA.id,
      toRoomId: roomB.id,
      path,
    });
  }

  return corridors;
}

const RANDOMIZABLE_PARAMS: Record<string, { min: number; max: number; step?: number }> = {
  plotWidth: { min: 20, max: 80, step: 1 },
  plotDepth: { min: 15, max: 60, step: 1 },
  wallHeight: { min: 4, max: 20, step: 0.5 },
  wallThickness: { min: 1, max: 5, step: 0.5 },
  towerCount: { min: 4, max: 12, step: 1 },
  towerHeight: { min: 8, max: 25, step: 1 },
  towerRadius: { min: 2, max: 6, step: 0.5 },
  moatWidth: { min: 2, max: 10, step: 0.5 },
  moatDepth: { min: 1, max: 8, step: 0.5 },
  gateWidth: { min: 2, max: 10, step: 0.5 },
  gateHeight: { min: 3, max: 12, step: 0.5 },
  buildingHeight: { min: 3, max: 15, step: 0.5 },
  terrainAmplitude: { min: 0, max: 15, step: 0.2 },
  terrainFrequency: { min: 0.5, max: 6, step: 0.1 },
  terrainScale: { min: 0.01, max: 0.1, step: 0.005 },
  timeOfDay: { min: 0, max: 24, step: 0.1 },
  residentCount: { min: 3, max: 50, step: 1 },
  farmerRatio: { min: 0, max: 1, step: 0.05 },
  soldierRatio: { min: 0, max: 1, step: 0.05 },
  nobleRatio: { min: 0, max: 1, step: 0.05 },
  'moatWaterParams.globalWaterLevel': { min: 0, max: 1, step: 0.05 },
  'moatWaterParams.waveHeight': { min: 0, max: 0.5, step: 0.02 },
  'moatWaterParams.flowSpeed': { min: 0, max: 3, step: 0.1 },
  drawbridgeAngle: { min: 0, max: 90, step: 1 },
  portcullisPosition: { min: 0, max: 1, step: 0.02 },
  barLatchPosition: { min: 0, max: 1, step: 0.02 },
  'materialParams.agingLevel': { min: 0, max: 1, step: 0.05 },
  'materialParams.mossCoverage': { min: 0, max: 1, step: 0.05 },
  'materialParams.stoneCrackLevel': { min: 0, max: 1, step: 0.05 },
  'materialParams.stoneStainLevel': { min: 0, max: 1, step: 0.05 },
  'materialParams.woodGrainLevel': { min: 0, max: 1, step: 0.05 },
  'materialParams.woodRingLevel': { min: 0, max: 1, step: 0.05 },
  'materialParams.waterRippleLevel': { min: 0, max: 1, step: 0.05 },
  'materialParams.waterClarity': { min: 0, max: 1, step: 0.05 },
  'towerSpecificParams.squareFort.crenellationHeight': { min: 0.5, max: 3, step: 0.1 },
  'towerSpecificParams.squareFort.buttressCount': { min: 0, max: 8, step: 1 },
  'towerSpecificParams.squareFort.windowRows': { min: 1, max: 6, step: 1 },
  'towerSpecificParams.polygonTower.sides': { min: 5, max: 12, step: 1 },
  'towerSpecificParams.polygonTower.pinnacleCount': { min: 0, max: 12, step: 1 },
  'towerSpecificParams.polygonTower.turretHeight': { min: 0.5, max: 5, step: 0.5 },
  'towerSpecificParams.spiralStair.stairWidth': { min: 0.5, max: 2.5, step: 0.1 },
  'towerSpecificParams.spiralStair.stairTurns': { min: 2, max: 8, step: 1 },
  'towerSpecificParams.spiralStair.centralColumnRadius': { min: 0.3, max: 1.5, step: 0.1 },
  'towerSpecificParams.gatehouse.archWidth': { min: 3, max: 10, step: 0.5 },
  'towerSpecificParams.gatehouse.archHeight': { min: 3, max: 10, step: 0.5 },
  'towerSpecificParams.gatehouse.towerSpacing': { min: 5, max: 15, step: 0.5 },
  'towerSpecificParams.gatehouse.gatehouseDepth': { min: 3, max: 12, step: 0.5 },
};

const RANDOMIZABLE_ENUMS = {
  terrainType: Object.keys(TERRAIN_PRESETS) as TerrainType[],
  weather: Object.keys(WEATHER_PRESETS) as WeatherType[],
  wallStyle: Object.keys(WALL_STYLE_PRESETS) as WallStyle[],
  towerType: Object.keys(TOWER_TYPE_INFO) as TowerType[],
};

function randomInRange(min: number, max: number, step: number = 1): number {
  const range = max - min;
  const steps = Math.floor(range / step);
  const randomStep = Math.floor(Math.random() * (steps + 1));
  return Math.round((min + randomStep * step) * 1000) / 1000;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

export const useCastleStore = create<CastleState>((set, get) => ({
  params: defaultParams,
  viewMode: 'solid',
  castleGeometries: null,
  selectedEraId: null,
  interiorLayout: {
    rooms: [],
    corridors: [],
    selectedRoomId: null,
  },
  selectedNPCId: null,
  selectedNPCType: null,
  uvMappingMode: 'auto' as UVMappingMode,
  showSeams: false,
  lockedParams: new Set<string>(),
  panelGroups: {
    terrain: true,
    weather: true,
    wallStyle: true,
    plot: true,
    walls: true,
    towers: true,
    gates: true,
    moat: true,
    buildings: true,
    residents: true,
    materials: true,
    seed: true,
  },
  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setCastleGeometries: (geometries) => set({ castleGeometries: geometries }),
  setSelectedEraId: (id: string | null) => set({ selectedEraId: id }),
  applyEraStyle: (year: number) =>
    set((state) => {
      const style = getInterpolatedStyle(year);
      return {
        params: {
          ...state.params,
          eraYear: year,
          wallHeight: baseParams.wallHeight * style.wallHeightMultiplier,
          wallThickness: baseParams.wallThickness * style.wallThicknessMultiplier,
          towerHeight: baseParams.towerHeight * style.towerHeightMultiplier,
          towerRadius: baseParams.towerRadius * style.towerRadiusMultiplier,
          hasMoat: style.hasMoat,
          buildingCount: Math.round(baseParams.buildingCount * style.buildingCountMultiplier),
          towerShape: style.towerShape,
          crenellationStyle: style.crenellationStyle,
        },
      };
    }),
  applyTerrainType: (type: TerrainType) =>
    set((state) => {
      const preset = TERRAIN_PRESETS[type];
      return {
        params: {
          ...state.params,
          terrainType: type,
          terrainAmplitude: preset.amplitude,
          terrainFrequency: preset.frequency,
          terrainScale: preset.noiseScale,
        },
      };
    }),
  applyWallStyle: (style: WallStyle) =>
    set((state) => {
      const preset = WALL_STYLE_PRESETS[style];
      return {
        params: {
          ...state.params,
          wallStyle: style,
          crenellationStyle: preset.crenellationStyle,
          towerShape: preset.towerShape,
        },
      };
    }),
  applyWeather: (type: WeatherType) =>
    set((state) => ({
      params: { ...state.params, weather: type },
    })),
  setTimeOfDay: (time: number) =>
    set((state) => ({
      params: { ...state.params, timeOfDay: Math.max(0, Math.min(24, time)) },
    })),
  resetParams: () => set({ params: buildDefaultParams() }),
  randomizeSeed: () =>
    set((state) => ({
      params: { ...state.params, seed: Math.floor(Math.random() * 100000) },
    })),
  addRoom: (room: Room) => {
    const state = get();
    const clamped = clampRoomToBounds(room, state.params.plotWidth, state.params.plotDepth, state.params.wallThickness);
    if (hasOverlapWithOthers(clamped, state.interiorLayout.rooms)) {
      return false;
    }
    const rooms = [...state.interiorLayout.rooms, clamped];
    const corridors = generateCorridors(rooms);
    set({
      interiorLayout: {
        ...state.interiorLayout,
        rooms,
        corridors,
        selectedRoomId: clamped.id,
      },
    });
    return true;
  },
  updateRoom: (id: string, updates: Partial<Room>) => {
    const state = get();
    const target = state.interiorLayout.rooms.find(r => r.id === id);
    if (!target) return false;
    const updated = clampRoomToBounds(
      { ...target, ...updates },
      state.params.plotWidth,
      state.params.plotDepth,
      state.params.wallThickness
    );
    if (hasOverlapWithOthers(updated, state.interiorLayout.rooms, id)) {
      return false;
    }
    const rooms = state.interiorLayout.rooms.map(r => r.id === id ? updated : r);
    const corridors = generateCorridors(rooms);
    set({
      interiorLayout: {
        ...state.interiorLayout,
        rooms,
        corridors,
      },
    });
    return true;
  },
  deleteRoom: (id: string) =>
    set((state) => {
      const rooms = state.interiorLayout.rooms.filter((r) => r.id !== id);
      const corridors = generateCorridors(rooms);
      return {
        interiorLayout: {
          ...state.interiorLayout,
          rooms,
          corridors,
          selectedRoomId: state.interiorLayout.selectedRoomId === id ? null : state.interiorLayout.selectedRoomId,
        },
      };
    }),
  selectRoom: (id: string | null) =>
    set((state) => ({
      interiorLayout: {
        ...state.interiorLayout,
        selectedRoomId: id,
      },
    })),
  moveRoom: (id: string, x: number, y: number) => {
    const state = get();
    const target = state.interiorLayout.rooms.find(r => r.id === id);
    if (!target) return false;
    const moved = clampRoomToBounds(
      { ...target, x, y },
      state.params.plotWidth,
      state.params.plotDepth,
      state.params.wallThickness
    );
    if (hasOverlapWithOthers(moved, state.interiorLayout.rooms, id)) {
      return false;
    }
    const rooms = state.interiorLayout.rooms.map(r => r.id === id ? moved : r);
    const corridors = generateCorridors(rooms);
    set({
      interiorLayout: {
        ...state.interiorLayout,
        rooms,
        corridors,
      },
    });
    return true;
  },
  clearAllRooms: () =>
    set(() => ({
      interiorLayout: {
        rooms: [],
        corridors: [],
        selectedRoomId: null,
      },
    })),
  toggleResidentMode: () =>
    set((state) => ({
      params: {
        ...state.params,
        residentMode: !state.params.residentMode,
      },
    })),
  setSelectedNPCId: (id) =>
    set(() => ({
      selectedNPCId: id,
    })),
  selectNPC: (id, type = null) =>
    set(() => ({
      selectedNPCId: id,
      selectedNPCType: type,
    })),
  applyTowerType: (type: TowerType) =>
    set((state) => ({
      params: {
        ...state.params,
        towerType: type,
      },
    })),
  updateTowerSpecificParams: (type: keyof TowerSpecificParams, updates: Partial<TowerSpecificParams[keyof TowerSpecificParams]>) =>
    set((state) => ({
      params: {
        ...state.params,
        towerSpecificParams: {
          ...state.params.towerSpecificParams,
          [type]: {
            ...state.params.towerSpecificParams[type],
            ...updates,
          },
        },
      },
    })),
  setDrawbridgeAngle: (angle: number) =>
    set((state) => {
      const newSegments = state.params.moatSegments.map((seg) =>
        seg.hasDrawbridge ? { ...seg, drawbridgeAngle: angle } : seg
      );
      return {
        params: {
          ...state.params,
          drawbridgeAngle: angle,
          moatSegments: newSegments,
        },
      };
    }),
  setPortcullisPosition: (position: number) =>
    set((state) => ({
      params: {
        ...state.params,
        portcullisPosition: position,
      },
    })),
  updateMoatSegment: (segmentId: string, updates: Partial<MoatSegment>) =>
    set((state) => ({
      params: {
        ...state.params,
        moatSegments: state.params.moatSegments.map((seg) =>
          seg.id === segmentId ? { ...seg, ...updates } : seg
        ),
      },
    })),
  addMoatSegment: (segment: Omit<MoatSegment, 'id'>) =>
    set((state) => ({
      params: {
        ...state.params,
        moatSegments: [
          ...state.params.moatSegments,
          { ...segment, id: `seg_${Date.now()}` },
        ],
      },
    })),
  removeMoatSegment: (segmentId: string) =>
    set((state) => ({
      params: {
        ...state.params,
        moatSegments: state.params.moatSegments.filter((seg) => seg.id !== segmentId),
      },
    })),
  setBarLatchPosition: (position: number) =>
    set((state) => ({
      params: {
        ...state.params,
        barLatchPosition: position,
      },
    })),
  setBuildingTypeDistribution: (type: BuildingType, count: number) =>
    set((state) => ({
      params: {
        ...state.params,
        buildingTypeDistribution: {
          ...state.params.buildingTypeDistribution,
          [type]: Math.max(0, count),
        },
      },
    })),
  toggleGateAnimationSync: () =>
    set((state) => ({
      params: {
        ...state.params,
        gateAnimationSync: !state.params.gateAnimationSync,
      },
    })),
  openGateSequence: () =>
    set((state) => ({
      params: {
        ...state.params,
        drawbridgeAngle: 75,
        gateAnimationSync: true,
      },
    })),
  closeGateSequence: () =>
    set((state) => ({
      params: {
        ...state.params,
        drawbridgeAngle: 0,
        gateAnimationSync: true,
      },
    })),
  setUVMappingMode: (mode: UVMappingMode) =>
    set(() => ({
      uvMappingMode: mode,
    })),
  toggleShowSeams: () =>
    set((state) => ({
      showSeams: !state.showSeams,
    })),
  setMaterialParams: (newParams: Partial<MaterialParams>) =>
    set((state) => ({
      params: {
        ...state.params,
        materialParams: {
          ...state.params.materialParams,
          ...newParams,
        },
      },
    })),
  resetMaterialParams: () =>
    set((state) => ({
      params: {
        ...state.params,
        materialParams: { ...DEFAULT_MATERIAL_PARAMS },
      },
    })),
  toggleParamLock: (paramKey: string) =>
    set((state) => {
      const newLocked = new Set(state.lockedParams);
      if (newLocked.has(paramKey)) {
        newLocked.delete(paramKey);
      } else {
        newLocked.add(paramKey);
      }
      return { lockedParams: newLocked };
    }),
  isParamLocked: (paramKey: string) => {
    return get().lockedParams.has(paramKey);
  },
  togglePanelGroup: (groupId: PanelGroupId) =>
    set((state) => ({
      panelGroups: {
        ...state.panelGroups,
        [groupId]: !state.panelGroups[groupId],
      },
    })),
  setPanelGroupVisible: (groupId: PanelGroupId, visible: boolean) =>
    set((state) => ({
      panelGroups: {
        ...state.panelGroups,
        [groupId]: visible,
      },
    })),
  randomizeAllParams: () =>
    set((state) => {
      let newParams = { ...state.params };
      const locked = state.lockedParams;

      Object.entries(RANDOMIZABLE_PARAMS).forEach(([key, config]) => {
        if (!locked.has(key)) {
          const value = randomInRange(config.min, config.max, config.step);
          newParams = setNestedValue(newParams, key, value);
        }
      });

      Object.entries(RANDOMIZABLE_ENUMS).forEach(([key, options]) => {
        if (!locked.has(key)) {
          const randomIndex = Math.floor(Math.random() * options.length);
          newParams = setNestedValue(newParams, key, options[randomIndex]);
        }
      });

      if (!locked.has('seed')) {
        newParams.seed = Math.floor(Math.random() * 100000);
      }

      if (!locked.has('hasMoat')) {
        newParams.hasMoat = Math.random() > 0.3;
      }
      if (!locked.has('hasPortcullis')) {
        newParams.hasPortcullis = Math.random() > 0.3;
      }
      if (!locked.has('hasDrawbridge')) {
        newParams.hasDrawbridge = Math.random() > 0.3;
      }
      if (!locked.has('hasGatehouse')) {
        newParams.hasGatehouse = Math.random() > 0.3;
      }
      if (!locked.has('hasBarLatch')) {
        newParams.hasBarLatch = Math.random() > 0.4;
      }
      if (!locked.has('residentMode')) {
        newParams.residentMode = Math.random() > 0.5;
      }
      if (!locked.has('moatWaterParams.isAnimated')) {
        newParams.moatWaterParams.isAnimated = Math.random() > 0.2;
      }

      return { params: newParams };
    }),
  lockAllParams: () =>
    set((state) => {
      const allParams = new Set(state.lockedParams);
      Object.keys(RANDOMIZABLE_PARAMS).forEach((key) => allParams.add(key));
      Object.keys(RANDOMIZABLE_ENUMS).forEach((key) => allParams.add(key));
      allParams.add('seed');
      allParams.add('hasMoat');
      allParams.add('hasPortcullis');
      allParams.add('hasDrawbridge');
      allParams.add('hasGatehouse');
      allParams.add('hasBarLatch');
      allParams.add('residentMode');
      allParams.add('moatWaterParams.isAnimated');
      return { lockedParams: allParams };
    }),
  unlockAllParams: () =>
    set(() => ({
      lockedParams: new Set<string>(),
    })),
}));
