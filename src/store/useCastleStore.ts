import { create } from 'zustand';
import { CastleParams, CastleState, ViewMode } from '@/types/castle';
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

export const useCastleStore = create<CastleState>((set) => ({
  params: defaultParams,
  viewMode: 'solid',
  castleGeometries: null,
  selectedEraId: null,
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
}));
