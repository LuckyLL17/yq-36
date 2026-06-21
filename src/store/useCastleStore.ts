import { create } from 'zustand';
import { CastleParams, CastleState, ViewMode, Room, Corridor, TerrainType, TERRAIN_PRESETS, WeatherType, WallStyle, WALL_STYLE_PRESETS } from '@/types/castle';
import { getInterpolatedStyle } from '@/data/historicalEras';

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
}));
