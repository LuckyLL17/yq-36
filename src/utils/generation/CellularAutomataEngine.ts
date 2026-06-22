import { SeededRandom } from '@/utils/seededRandom';
import { CellularAutomataConfig, CastleParams, DEFAULT_CELLULAR_AUTOMATA_CONFIG } from '@/types/castle';

export interface CAGrid {
  width: number;
  height: number;
  cells: boolean[][];
}

export interface CAResult {
  grid: CAGrid;
  buildingPositions: { row: number; col: number; cluster: number }[];
  terrainMap: number[][];
  wallMap: boolean[][];
}

export class CellularAutomataEngine {
  private rng: SeededRandom;
  private config: CellularAutomataConfig;

  constructor(seed: number, config: CellularAutomataConfig = DEFAULT_CELLULAR_AUTOMATA_CONFIG) {
    this.rng = new SeededRandom(seed);
    this.config = config;
  }

  private createGrid(): boolean[][] {
    const grid: boolean[][] = [];
    for (let y = 0; y < this.config.gridSize; y++) {
      grid[y] = [];
      for (let x = 0; x < this.config.gridSize; x++) {
        const isEdge = y === 0 || y === this.config.gridSize - 1 || x === 0 || x === this.config.gridSize - 1;
        grid[y][x] = isEdge || this.rng.next() < this.config.fillRatio;
      }
    }
    return grid;
  }

  private countNeighbors(grid: boolean[][], x: number, y: number): number {
    let count = 0;
    const isMoore = this.config.neighborhood === 'moore';
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (!isMoore && Math.abs(dx) + Math.abs(dy) > 1) continue;
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < this.config.gridSize && nx >= 0 && nx < this.config.gridSize) {
          if (grid[ny][nx]) count++;
        } else {
          count++;
        }
      }
    }
    return count;
  }

  private step(grid: boolean[][]): boolean[][] {
    const newGrid: boolean[][] = [];
    for (let y = 0; y < this.config.gridSize; y++) {
      newGrid[y] = [];
      for (let x = 0; x < this.config.gridSize; x++) {
        const neighbors = this.countNeighbors(grid, x, y);
        const alive = grid[y][x];
        if (alive) {
          newGrid[y][x] = this.config.surviveRule.includes(neighbors);
        } else {
          newGrid[y][x] = this.config.birthRule.includes(neighbors);
        }
      }
    }
    return newGrid;
  }

  run(): CAResult {
    let grid = this.createGrid();
    for (let i = 0; i < this.config.iterations; i++) {
      grid = this.step(grid);
    }

    const terrainMap = this.generateTerrainMap(grid);
    const buildingPositions = this.findBuildingClusters(grid);
    const wallMap = this.config.applyToWalls ? this.detectWalls(grid) : this.createEmptyWallMap();

    return {
      grid: { width: this.config.gridSize, height: this.config.gridSize, cells: grid },
      buildingPositions,
      terrainMap,
      wallMap,
    };
  }

  private generateTerrainMap(grid: boolean[][]): number[][] {
    const map: number[][] = [];
    for (let y = 0; y < this.config.gridSize; y++) {
      map[y] = [];
      for (let x = 0; x < this.config.gridSize; x++) {
        if (grid[y][x]) {
          let height = 1.0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < this.config.gridSize && nx >= 0 && nx < this.config.gridSize) {
                if (!grid[ny][nx]) height += 0.15;
              }
            }
          }
          map[y][x] = Math.min(3.0, height);
        } else {
          map[y][x] = 0;
        }
      }
    }
    return map;
  }

  private findBuildingClusters(grid: boolean[][]): { row: number; col: number; cluster: number }[] {
    const visited: boolean[][] = Array.from({ length: this.config.gridSize }, () =>
      Array(this.config.gridSize).fill(false)
    );
    const positions: { row: number; col: number; cluster: number }[] = [];
    let clusterId = 0;

    const floodFill = (startY: number, startX: number): void => {
      const queue: [number, number][] = [[startY, startX]];
      const cluster: [number, number][] = [];
      visited[startY][startX] = true;

      while (queue.length > 0) {
        const [cy, cx] = queue.shift()!;
        cluster.push([cy, cx]);

        for (const [dy, dx] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const ny = cy + dy;
          const nx = cx + dx;
          if (ny >= 0 && ny < this.config.gridSize && nx >= 0 && nx < this.config.gridSize) {
            if (!visited[ny][nx] && grid[ny][nx]) {
              visited[ny][nx] = true;
              queue.push([ny, nx]);
            }
          }
        }
      }

      if (cluster.length >= 3) {
        const centerRow = cluster.reduce((s, [r]) => s + r, 0) / cluster.length;
        const centerCol = cluster.reduce((s, [, c]) => s + c, 0) / cluster.length;
        positions.push({ row: centerRow, col: centerCol, cluster: clusterId });
      }
      clusterId++;
    };

    for (let y = 0; y < this.config.gridSize; y++) {
      for (let x = 0; x < this.config.gridSize; x++) {
        if (grid[y][x] && !visited[y][x]) {
          floodFill(y, x);
        }
      }
    }

    return positions;
  }

  private detectWalls(grid: boolean[][]): boolean[][] {
    const walls: boolean[][] = Array.from({ length: this.config.gridSize }, () =>
      Array(this.config.gridSize).fill(false)
    );

    for (let y = 1; y < this.config.gridSize - 1; y++) {
      for (let x = 1; x < this.config.gridSize - 1; x++) {
        if (grid[y][x]) {
          let emptyNeighbors = 0;
          for (const [dy, dx] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            if (!grid[y + dy][x + dx]) emptyNeighbors++;
          }
          if (emptyNeighbors >= 1 && emptyNeighbors <= 2) {
            walls[y][x] = true;
          }
        }
      }
    }

    return walls;
  }

  private createEmptyWallMap(): boolean[][] {
    return Array.from({ length: this.config.gridSize }, () =>
      Array(this.config.gridSize).fill(false)
    );
  }

  generateParams(baseParams: CastleParams): Partial<CastleParams> {
    const result = this.run();
    const updates: Partial<CastleParams> = {};

    if (this.config.applyToBuildings) {
      const clusterCount = result.buildingPositions.length;
      if (clusterCount > 0) {
        const buildingTypes = ['main_keep', 'great_hall', 'chapel', 'stable', 'barracks'] as const;
        const distribution = { ...baseParams.buildingTypeDistribution };
        const perCluster = Math.max(1, Math.ceil(clusterCount / buildingTypes.length));

        for (let i = 0; i < buildingTypes.length; i++) {
          const type = buildingTypes[i];
          const assigned = i < clusterCount ? perCluster : Math.max(0, Math.floor(perCluster * 0.5));
          distribution[type] = assigned;
        }
        updates.buildingTypeDistribution = distribution;
        updates.buildingCount = clusterCount;
      }
    }

    if (this.config.applyToTerrain) {
      let maxTerrainHeight = 0;
      let totalHeight = 0;
      let count = 0;
      for (const row of result.terrainMap) {
        for (const h of row) {
          if (h > 0) {
            maxTerrainHeight = Math.max(maxTerrainHeight, h);
            totalHeight += h;
            count++;
          }
        }
      }
      const avgHeight = count > 0 ? totalHeight / count : 0;
      updates.terrainAmplitude = Math.min(15, Math.max(0, avgHeight * 2));
      updates.terrainFrequency = Math.min(6, Math.max(0.5, 1 + maxTerrainHeight * 0.5));
    }

    if (this.config.applyToWalls && result.wallMap) {
      let wallCellCount = 0;
      let totalCells = 0;
      for (const row of result.wallMap) {
        for (const cell of row) {
          totalCells++;
          if (cell) wallCellCount++;
        }
      }
      const wallRatio = wallCellCount / Math.max(1, totalCells);
      updates.wallThickness = Math.min(5, Math.max(1, 1 + wallRatio * 8));
    }

    updates.seed = Math.floor(this.rng.range(0, 100000));

    return updates;
  }

  static PRESETS: Record<string, CellularAutomataConfig> = {
    cave: {
      gridSize: 32,
      birthRule: [5, 6, 7, 8],
      surviveRule: [4, 5, 6, 7, 8],
      fillRatio: 0.45,
      iterations: 5,
      neighborhood: 'moore',
      applyToTerrain: true,
      applyToBuildings: true,
      applyToWalls: false,
    },
    organic: {
      gridSize: 24,
      birthRule: [3, 6, 7, 8],
      surviveRule: [3, 4, 5, 6, 7, 8],
      fillRatio: 0.4,
      iterations: 4,
      neighborhood: 'moore',
      applyToTerrain: true,
      applyToBuildings: false,
      applyToWalls: true,
    },
    maze: {
      gridSize: 40,
      birthRule: [3],
      surviveRule: [1, 2, 3, 4, 5],
      fillRatio: 0.55,
      iterations: 6,
      neighborhood: 'vonneumann',
      applyToTerrain: false,
      applyToBuildings: true,
      applyToWalls: true,
    },
    settlement: {
      gridSize: 28,
      birthRule: [2, 3],
      surviveRule: [3, 4, 5],
      fillRatio: 0.35,
      iterations: 3,
      neighborhood: 'moore',
      applyToTerrain: false,
      applyToBuildings: true,
      applyToWalls: false,
    },
  };
}
