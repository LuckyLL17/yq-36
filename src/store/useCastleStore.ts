import { create } from 'zustand';
import { CastleParams, CastleState, ViewMode, Room, Corridor } from '@/types/castle';
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

function generateCorridors(rooms: Room[]): Corridor[] {
  const corridors: Corridor[] = [];
  if (rooms.length < 2) return corridors;

  const corridorWidth = 2;

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const roomA = rooms[i];
      const roomB = rooms[j];
      const centerA = getRoomCenter(roomA);
      const centerB = getRoomCenter(roomB);

      const dx = Math.abs(centerA.x - centerB.x);
      const dy = Math.abs(centerA.y - centerB.y);
      const minDist = (roomA.width + roomB.width) / 2 + (roomA.height + roomB.height) / 2 + corridorWidth * 2;

      if (dx + dy < minDist * 1.5) {
        const midX = (centerA.x + centerB.x) / 2;
        const path = [
          { x: centerA.x, y: centerA.y },
          { x: midX, y: centerA.y },
          { x: midX, y: centerB.y },
          { x: centerB.x, y: centerB.y },
        ];

        let hasOverlap = false;
        for (const existing of corridors) {
          if (
            (existing.fromRoomId === roomA.id && existing.toRoomId === roomB.id) ||
            (existing.fromRoomId === roomB.id && existing.toRoomId === roomA.id)
          ) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap) {
          corridors.push({
            id: generateId(),
            fromRoomId: roomA.id,
            toRoomId: roomB.id,
            path,
          });
        }
      }
    }
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
  resetParams: () => set({ params: buildDefaultParams() }),
  randomizeSeed: () =>
    set((state) => ({
      params: { ...state.params, seed: Math.floor(Math.random() * 100000) },
    })),
  addRoom: (room: Room) =>
    set((state) => {
      const rooms = [...state.interiorLayout.rooms, room];
      const corridors = generateCorridors(rooms);
      return {
        interiorLayout: {
          ...state.interiorLayout,
          rooms,
          corridors,
          selectedRoomId: room.id,
        },
      };
    }),
  updateRoom: (id: string, updates: Partial<Room>) =>
    set((state) => {
      const rooms = state.interiorLayout.rooms.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      const corridors = generateCorridors(rooms);
      return {
        interiorLayout: {
          ...state.interiorLayout,
          rooms,
          corridors,
        },
      };
    }),
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
  moveRoom: (id: string, x: number, y: number) =>
    set((state) => {
      const rooms = state.interiorLayout.rooms.map((r) =>
        r.id === id ? { ...r, x, y } : r
      );
      const corridors = generateCorridors(rooms);
      return {
        interiorLayout: {
          ...state.interiorLayout,
          rooms,
          corridors,
        },
      };
    }),
  clearAllRooms: () =>
    set((state) => ({
      interiorLayout: {
        rooms: [],
        corridors: [],
        selectedRoomId: null,
      },
    })),
}));
