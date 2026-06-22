import { CABuildingPosition, BuildingType, BUILDING_TYPE_INFO } from '@/types/castle';

export interface CABuildingPlacement {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  type: BuildingType;
}

export class CAGeometryAdapter {
  private terrainMap: number[][];
  private buildingPositions: CABuildingPosition[];
  private gridSize: number;
  private plotWidth: number;
  private plotDepth: number;
  private buildingHeight: number;
  private buildingTypeDistribution: Record<BuildingType, number>;
  private rng: { range: (min: number, max: number) => number; next: () => number };
  private seed: number;

  constructor(
    terrainMap: number[][],
    buildingPositions: CABuildingPosition[],
    gridSize: number,
    plotWidth: number,
    plotDepth: number,
    buildingHeight: number,
    buildingTypeDistribution: Record<BuildingType, number>,
    rng: { range: (min: number, max: number) => number; next: () => number },
    seed: number
  ) {
    this.terrainMap = terrainMap;
    this.buildingPositions = buildingPositions;
    this.gridSize = gridSize;
    this.plotWidth = plotWidth;
    this.plotDepth = plotDepth;
    this.buildingHeight = buildingHeight;
    this.buildingTypeDistribution = buildingTypeDistribution;
    this.rng = rng;
    this.seed = seed;
  }

  sampleTerrainHeight(x: number, z: number, normalizedAmplitude: number): number {
    const nx = (x + this.plotWidth / 2) / this.plotWidth;
    const nz = (z + this.plotDepth / 2) / this.plotDepth;
    const col = Math.floor(nx * this.gridSize);
    const row = Math.floor(nz * this.gridSize);

    if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) return 0;
    return (this.terrainMap[row][col] / 3.0) * normalizedAmplitude;
  }

  getBuildingPlacements(
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): CABuildingPlacement[] {
    const placements: CABuildingPlacement[] = [];

    const buildingList: { type: BuildingType; count: number }[] = [];
    (Object.keys(this.buildingTypeDistribution) as BuildingType[]).forEach((type) => {
      const count = Math.max(0, Math.floor(this.buildingTypeDistribution[type]));
      if (count > 0) {
        buildingList.push({ type, count });
      }
    });
    buildingList.sort((a, b) => {
      const sizeA = BUILDING_TYPE_INFO[a.type].widthRatio * BUILDING_TYPE_INFO[a.type].depthRatio;
      const sizeB = BUILDING_TYPE_INFO[b.type].widthRatio * BUILDING_TYPE_INFO[b.type].depthRatio;
      return sizeB - sizeA;
    });

    const buildingRng = this.createBuildingRng();
    const placed: { x: number; z: number; w: number; d: number }[] = [];
    const worldW = maxX - minX;
    const worldD = maxZ - minZ;

    const sorted = [...this.buildingPositions].sort((a, b) => b.cluster - a.cluster);
    const maxBuildings = Math.min(
      sorted.length,
      buildingList.reduce((s, b) => s + b.count, 0)
    );

    let typeIndex = 0;
    let typeCountLeft = buildingList[0]?.count ?? 0;

    for (let i = 0; i < maxBuildings; i++) {
      if (buildingList.length === 0) break;

      while (typeCountLeft <= 0 && typeIndex < buildingList.length - 1) {
        typeIndex++;
        typeCountLeft = buildingList[typeIndex].count;
      }
      if (typeCountLeft <= 0) break;

      const type = buildingList[typeIndex].type;
      const info = BUILDING_TYPE_INFO[type];
      const cp = sorted[i];

      const nx = cp.col / this.gridSize;
      const nz = cp.row / this.gridSize;
      const baseX = minX + nx * worldW;
      const baseZ = minZ + nz * worldD;

      const baseW = 4 + buildingRng.range(0, 2);
      const baseD = 4 + buildingRng.range(0, 2);
      const w = baseW * info.widthRatio;
      const d = baseD * info.depthRatio;
      const h = this.buildingHeight * info.heightRatio * (0.9 + buildingRng.range(0, 0.2));
      const x = Math.min(maxX - w / 2, Math.max(minX + w / 2, baseX));
      const z = Math.min(maxZ - d / 2, Math.max(minZ + d / 2, baseZ));

      const overlap = placed.some(
        (p) =>
          Math.abs(p.x - x) < (p.w + w) / 2 + 1.5 &&
          Math.abs(p.z - z) < (p.d + d) / 2 + 1.5
      );

      if (!overlap) {
        placements.push({ x, z, width: w, depth: d, height: h, type });
        placed.push({ x, z, w, d });
        typeCountLeft--;
      }
    }

    return placements;
  }

  private createBuildingRng() {
    let s = this.seed + 7777;
    return {
      next: () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      },
      range: (min: number, max: number) => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return min + (s / 4294967296) * (max - min);
      },
    };
  }
}
