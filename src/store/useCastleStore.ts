import { create } from 'zustand';
import { CastleParams, CastleState, ViewMode } from '@/types/castle';

const defaultParams: CastleParams = {
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
};

export const useCastleStore = create<CastleState>((set) => ({
  params: defaultParams,
  viewMode: 'solid',
  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  resetParams: () => set({ params: defaultParams }),
  randomizeSeed: () =>
    set((state) => ({
      params: { ...state.params, seed: Math.floor(Math.random() * 100000) },
    })),
}));
