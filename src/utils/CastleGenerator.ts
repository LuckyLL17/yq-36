import * as THREE from 'three';
import { CastleParams, CrenellationStyle, TowerShape, TowerType } from '@/types/castle';
import { SeededRandom } from '@/utils/seededRandom';

export class CastleGenerator {
  private params: CastleParams;
  private rng: SeededRandom;
  private noisePerm: number[];

  constructor(params: CastleParams) {
    this.params = params;
    this.rng = new SeededRandom(params.seed);
    this.noisePerm = this.buildNoisePermutation();
  }

  private buildNoisePermutation(): number[] {
    const perm: number[] = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this.rng.range(0, i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const p: number[] = [];
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    return p;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private perlinNoise2D(x: number, y: number): number {
    const p = this.noisePerm;
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];

    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);

    return this.lerp(x1, x2, v);
  }

  getTerrainHeight(x: number, z: number): number {
    const { terrainAmplitude, terrainFrequency, terrainScale } = this.params;
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    const octaves = 4;

    for (let i = 0; i < octaves; i++) {
      total += this.perlinNoise2D(x * terrainScale * frequency, z * terrainScale * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= terrainFrequency * 0.5 + 1;
    }

    const normalized = total / maxValue;
    return normalized * terrainAmplitude;
  }

  generatePlotPoints(): THREE.Vector2[] {
    const { plotWidth, plotDepth } = this.params;
    const points: THREE.Vector2[] = [];
    const corners = 4;
    
    for (let i = 0; i < corners; i++) {
      const angle = (i / corners) * Math.PI * 2 - Math.PI / 2;
      const wobble = 0.85 + this.rng.range(0, 0.3);
      const x = Math.cos(angle) * (plotWidth / 2) * wobble;
      const y = Math.sin(angle) * (plotDepth / 2) * wobble;
      points.push(new THREE.Vector2(x, y));
    }
    
    return points;
  }

  generateWalls(plotPoints: THREE.Vector2[], crenellationHeightMultiplier = 1.0): THREE.BufferGeometry[] {
    const walls: THREE.BufferGeometry[] = [];
    const { wallHeight, wallThickness, crenellationStyle } = this.params;

    for (let i = 0; i < plotPoints.length; i++) {
      const p1 = plotPoints[i];
      const p2 = plotPoints[(i + 1) % plotPoints.length];
      
      const wallGeo = this.createWallSegmentTerrain(p1, p2, wallHeight, wallThickness);
      walls.push(wallGeo);
      
      const crenellationGeo = this.createCrenellationsTerrain(p1, p2, wallHeight, wallThickness, crenellationStyle, crenellationHeightMultiplier);
      walls.push(crenellationGeo);
    }

    return walls;
  }

  private createWallSegmentTerrain(
    p1: THREE.Vector2,
    p2: THREE.Vector2,
    height: number,
    thickness: number
  ): THREE.BufferGeometry {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const segments = Math.max(4, Math.floor(length / 2));
    const geometry = new THREE.BoxGeometry(length, height, thickness, segments, 1, 1);
    geometry.translate(length / 2, height / 2, 0);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i) - length / 2;
      const t = (localX + length / 2) / length;
      const worldX = p1.x + dx * t;
      const worldZ = p1.y + dy * t;
      const terrainH = this.getTerrainHeight(worldX, worldZ);

      const localY = positions.getY(i) - height / 2;
      if (localY < 0) {
        positions.setY(i, terrainH + localY + height / 2);
      } else {
        positions.setY(i, terrainH + localY + height / 2);
      }
    }
    geometry.computeVertexNormals();

    this.applyUVsToBox(geometry, length, height, thickness);
    geometry.rotateY(-angle);
    geometry.translate(p1.x, 0, p1.y);
    
    return geometry;
  }

  private createCrenellationsTerrain(
    p1: THREE.Vector2,
    p2: THREE.Vector2,
    wallHeight: number,
    wallThickness: number,
    style: CrenellationStyle = 'simple',
    heightMultiplier: number = 1.0
  ): THREE.BufferGeometry {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const crenellationWidth = 1.2;
    const crenellationHeight = 1.5 * heightMultiplier;
    const gap = style === 'cross_shaped' ? 0.8 : 1.2;
    const count = Math.floor(length / (crenellationWidth + gap));

    const geometries: THREE.BufferGeometry[] = [];
    
    for (let i = 0; i < count; i++) {
      const x = i * (crenellationWidth + gap) + gap / 2;
      const centerX = x + crenellationWidth / 2;
      const t = centerX / length;
      const worldX = p1.x + dx * t;
      const worldZ = p1.y + dy * t;
      const terrainH = this.getTerrainHeight(worldX, worldZ);

      if (style === 'simple') {
        const geo = new THREE.BoxGeometry(crenellationWidth, crenellationHeight, wallThickness * 1.05);
        geo.translate(centerX, terrainH + wallHeight + crenellationHeight / 2, 0);
        geometries.push(geo);
      } else if (style === 'decorated') {
        const mainGeo = new THREE.BoxGeometry(crenellationWidth, crenellationHeight, wallThickness * 1.05);
        mainGeo.translate(centerX, terrainH + wallHeight + crenellationHeight / 2, 0);
        geometries.push(mainGeo);
        const capGeo = new THREE.BoxGeometry(crenellationWidth * 0.8, crenellationHeight * 0.2, wallThickness * 1.15);
        capGeo.translate(centerX, terrainH + wallHeight + crenellationHeight * 0.9, 0);
        geometries.push(capGeo);
      } else if (style === 'machicolated') {
        const mainGeo = new THREE.BoxGeometry(crenellationWidth, crenellationHeight, wallThickness * 1.05);
        mainGeo.translate(centerX, terrainH + wallHeight + crenellationHeight / 2, 0);
        geometries.push(mainGeo);
        const machicolationHeight = 0.5;
        const overhangGeo = new THREE.BoxGeometry(crenellationWidth, machicolationHeight, wallThickness * 1.4);
        overhangGeo.translate(centerX, terrainH + wallHeight - machicolationHeight / 2, 0);
        geometries.push(overhangGeo);
        const holeWidth = crenellationWidth * 0.4;
        const holeGeo = new THREE.BoxGeometry(holeWidth, machicolationHeight * 0.6, wallThickness * 1.42);
        holeGeo.translate(centerX, terrainH + wallHeight - machicolationHeight / 2, 0);
        geometries.push(holeGeo);
      } else if (style === 'cross_shaped') {
        const mainGeo = new THREE.BoxGeometry(crenellationWidth, crenellationHeight, wallThickness * 1.05);
        mainGeo.translate(centerX, terrainH + wallHeight + crenellationHeight / 2, 0);
        geometries.push(mainGeo);
        const crossBarWidth = crenellationWidth * 1.3;
        const crossBarHeight = crenellationHeight * 0.3;
        const crossBarGeo = new THREE.BoxGeometry(crossBarWidth, crossBarHeight, wallThickness * 1.1);
        crossBarGeo.translate(centerX, terrainH + wallHeight + crenellationHeight / 2, 0);
        geometries.push(crossBarGeo);
      }
    }

    const merged = this.mergeGeometries(geometries);
    merged.rotateY(-angle);
    merged.translate(p1.x, 0, p1.y);

    return merged;
  }

  generateTowers(plotPoints: THREE.Vector2[]): THREE.BufferGeometry[] {
    const towers: THREE.BufferGeometry[] = [];
    const { towerCount, towerHeight, towerRadius, towerShape, towerType } = this.params;

    for (let i = 0; i < plotPoints.length; i++) {
      const terrainH = this.getTerrainHeight(plotPoints[i].x, plotPoints[i].y);
      const tower = this.createTowerByType(plotPoints[i], towerHeight, towerRadius, towerShape, towerType, terrainH, i);
      towers.push(tower);
    }

    const additionalTowers = Math.max(0, towerCount - plotPoints.length);
    for (let i = 0; i < additionalTowers; i++) {
      const segIndex = i % plotPoints.length;
      const p1 = plotPoints[segIndex];
      const p2 = plotPoints[(segIndex + 1) % plotPoints.length];
      const t = 0.5;
      const midPoint = new THREE.Vector2(
        p1.x + (p2.x - p1.x) * t,
        p1.y + (p2.y - p1.y) * t
      );
      const terrainH = this.getTerrainHeight(midPoint.x, midPoint.y);
      const h = towerHeight * (0.8 + this.rng.range(0, 0.4));
      const r = towerRadius * (0.8 + this.rng.range(0, 0.3));
      const tower = this.createTowerByType(midPoint, h, r, towerShape, towerType, terrainH, i + plotPoints.length);
      towers.push(tower);
    }

    return towers;
  }

  private createTowerByType(
    position: THREE.Vector2,
    height: number,
    radius: number,
    shape: TowerShape,
    type: TowerType,
    terrainOffset: number = 0,
    index: number = 0
  ): THREE.BufferGeometry {
    let geometry: THREE.BufferGeometry;

    switch (type) {
      case 'square_fort':
        geometry = this.createSquareFortTower(position, height, radius, terrainOffset);
        break;
      case 'polygon_tower':
        geometry = this.createPolygonTower(position, height, radius, terrainOffset);
        break;
      case 'spiral_stair':
        geometry = this.createSpiralStairTower(position, height, radius, terrainOffset);
        break;
      case 'gatehouse':
        geometry = this.createGatehouseTower(position, height, radius, terrainOffset, index);
        break;
      case 'basic':
      default:
        geometry = this.createTower(position, height, radius, shape, terrainOffset);
        break;
    }

    return geometry;
  }

  private createSquareFortTower(
    position: THREE.Vector2,
    height: number,
    radius: number,
    terrainOffset: number = 0
  ): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];
    const params = this.params.towerSpecificParams.squareFort;
    const size = radius * 2.0;

    const bodyGeo = new THREE.BoxGeometry(size, height, size);
    bodyGeo.translate(0, terrainOffset + height / 2, 0);
    geometries.push(bodyGeo);

    const crenHeight = params.crenellationHeight;
    const crenWidth = 1.0;
    const crenGap = 0.8;
    const crenCount = Math.floor(size / (crenWidth + crenGap));
    for (let side = 0; side < 4; side++) {
      const angle = (side / 4) * Math.PI * 2;
      for (let i = 0; i < crenCount; i++) {
        const offset = -size / 2 + crenGap / 2 + i * (crenWidth + crenGap) + crenWidth / 2;
        const crenGeo = new THREE.BoxGeometry(crenWidth, crenHeight, 0.5);
        const cx = side % 2 === 0 ? offset : (side < 2 ? size / 2 : -size / 2);
        const cz = side % 2 === 1 ? offset : (side === 1 || side === 2 ? size / 2 : -size / 2);
        const rot = side % 2 === 0 ? 0 : Math.PI / 2;
        crenGeo.rotateY(rot);
        crenGeo.translate(cx, terrainOffset + height + crenHeight / 2, cz);
        geometries.push(crenGeo);
      }
    }

    const parapetGeo = new THREE.BoxGeometry(size * 1.05, 0.3, size * 1.05);
    parapetGeo.translate(0, terrainOffset + height + 0.15, 0);
    geometries.push(parapetGeo);

    const buttressCount = params.buttressCount;
    for (let i = 0; i < buttressCount; i++) {
      const angle = (i / buttressCount) * Math.PI * 2 + Math.PI / 4;
      const bWidth = 0.8;
      const bDepth = 0.6;
      const bHeight = height * 0.6;
      const buttressGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bx = Math.cos(angle) * (size / 2 + bDepth / 2 - 0.1);
      const bz = Math.sin(angle) * (size / 2 + bDepth / 2 - 0.1);
      buttressGeo.rotateY(angle);
      buttressGeo.translate(bx, terrainOffset + bHeight / 2, bz);
      geometries.push(buttressGeo);
    }

    const windowRows = params.windowRows;
    for (let side = 0; side < 4; side++) {
      const angle = (side / 4) * Math.PI * 2;
      const perpAngle = angle + Math.PI / 2;
      for (let row = 0; row < windowRows; row++) {
        const winCount = 2;
        for (let w = 0; w < winCount; w++) {
          const windowGeo = new THREE.BoxGeometry(0.7, 1.0, 0.3);
          const t = (w + 0.5) / winCount;
          const alongOffset = -size / 2 + 1 + t * (size - 2);
          const wx = Math.cos(angle) * (size / 2 - 0.05) + Math.cos(perpAngle) * alongOffset;
          const wz = Math.sin(angle) * (size / 2 - 0.05) + Math.sin(perpAngle) * alongOffset;
          const wy = terrainOffset + 2 + row * ((height - 4) / Math.max(1, windowRows - 1));
          windowGeo.rotateY(angle);
          windowGeo.translate(wx, wy, wz);
          geometries.push(windowGeo);
        }
      }
    }

    const merged = this.mergeGeometries(geometries);
    merged.translate(position.x, 0, position.y);
    return merged;
  }

  private createPolygonTower(
    position: THREE.Vector2,
    height: number,
    radius: number,
    terrainOffset: number = 0
  ): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];
    const params = this.params.towerSpecificParams.polygonTower;
    const sides = Math.max(5, Math.min(12, params.sides));

    const bodyGeo = new THREE.CylinderGeometry(radius, radius * 1.15, height, sides);
    bodyGeo.translate(0, terrainOffset + height / 2, 0);
    geometries.push(bodyGeo);

    const turretH = params.turretHeight;
    const turretGeo = new THREE.CylinderGeometry(radius * 0.85, radius * 0.9, turretH, sides);
    turretGeo.translate(0, terrainOffset + height + turretH / 2, 0);
    geometries.push(turretGeo);

    const roofHeight = radius * 1.4;
    const roofGeo = new THREE.ConeGeometry(radius * 1.0, roofHeight, sides);
    roofGeo.translate(0, terrainOffset + height + turretH + roofHeight / 2, 0);
    geometries.push(roofGeo);

    const spireGeo = new THREE.ConeGeometry(radius * 0.15, radius * 1.2, sides);
    spireGeo.translate(0, terrainOffset + height + turretH + roofHeight + radius * 0.6, 0);
    geometries.push(spireGeo);

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + Math.PI / sides;
      const windowGeo = new THREE.BoxGeometry(0.7, 1.2, 0.25);
      windowGeo.translate(
        Math.cos(angle) * (radius - 0.1),
        terrainOffset + height * 0.35 + (i % 3) * 1.6,
        Math.sin(angle) * (radius - 0.1)
      );
      windowGeo.rotateY(angle);
      geometries.push(windowGeo);
    }

    const pinnacleCount = params.pinnacleCount;
    for (let i = 0; i < pinnacleCount; i++) {
      const angle = (i / pinnacleCount) * Math.PI * 2;
      const pinnacleBase = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      pinnacleBase.translate(
        Math.cos(angle) * radius * 0.95,
        terrainOffset + height + turretH + 0.2,
        Math.sin(angle) * radius * 0.95
      );
      geometries.push(pinnacleBase);
      const pinnacleGeo = new THREE.ConeGeometry(0.25, 1.0, 4);
      pinnacleGeo.translate(
        Math.cos(angle) * radius * 0.95,
        terrainOffset + height + turretH + 0.9,
        Math.sin(angle) * radius * 0.95
      );
      geometries.push(pinnacleGeo);
    }

    const merged = this.mergeGeometries(geometries);
    merged.translate(position.x, 0, position.y);
    return merged;
  }

  private createSpiralStairTower(
    position: THREE.Vector2,
    height: number,
    radius: number,
    terrainOffset: number = 0
  ): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];
    const params = this.params.towerSpecificParams.spiralStair;
    const centralR = params.centralColumnRadius;

    const centralGeo = new THREE.CylinderGeometry(centralR, centralR * 1.1, height, 12);
    centralGeo.translate(0, terrainOffset + height / 2, 0);
    geometries.push(centralGeo);

    const stairWidth = params.stairWidth;
    const stairTurns = params.stairTurns;
    const stepsPerTurn = 16;
    const totalSteps = stairTurns * stepsPerTurn;
    const stepHeight = (height - 2) / totalSteps;
    const stepDepth = (2 * Math.PI * (centralR + stairWidth / 2)) / stepsPerTurn;

    for (let i = 0; i < totalSteps; i++) {
      const angle = (i / stepsPerTurn) * Math.PI * 2;
      const y = terrainOffset + 1 + i * stepHeight;
      const stepGeo = new THREE.BoxGeometry(stepDepth * 0.9, stepHeight * 1.05, stairWidth);
      const midR = centralR + stairWidth / 2;
      stepGeo.rotateY(-angle);
      stepGeo.translate(
        Math.cos(angle) * midR,
        y + stepHeight / 2,
        Math.sin(angle) * midR
      );
      geometries.push(stepGeo);
    }

    const railHeight = 0.9;
    const railPosts = totalSteps / 2;
    for (let i = 0; i < railPosts; i++) {
      const stepIdx = Math.floor((i / railPosts) * totalSteps);
      const angle = (stepIdx / stepsPerTurn) * Math.PI * 2;
      const y = terrainOffset + 1 + stepIdx * stepHeight;
      const outerR = centralR + stairWidth;
      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, railHeight, 6);
      postGeo.translate(
        Math.cos(angle) * outerR,
        y + railHeight / 2,
        Math.sin(angle) * outerR
      );
      geometries.push(postGeo);
    }

    const capGeo = new THREE.CylinderGeometry(centralR + stairWidth + 0.2, centralR + stairWidth + 0.3, 0.5, 16);
    capGeo.translate(0, terrainOffset + height + 0.25, 0);
    geometries.push(capGeo);

    const roofHeight = radius * 1.0;
    const roofGeo = new THREE.ConeGeometry(centralR + stairWidth + 0.2, roofHeight, 16);
    roofGeo.translate(0, terrainOffset + height + 0.5 + roofHeight / 2, 0);
    geometries.push(roofGeo);

    const windowCount = 4;
    for (let i = 0; i < windowCount; i++) {
      const angle = (i / windowCount) * Math.PI * 2;
      const windowGeo = new THREE.BoxGeometry(0.6, 1.0, 0.2);
      windowGeo.translate(
        Math.cos(angle) * (centralR - 0.05),
        terrainOffset + height * 0.4 + i * 1.5,
        Math.sin(angle) * (centralR - 0.05)
      );
      windowGeo.rotateY(angle);
      geometries.push(windowGeo);
    }

    const merged = this.mergeGeometries(geometries);
    merged.translate(position.x, 0, position.y);
    return merged;
  }

  private createGatehouseTower(
    position: THREE.Vector2,
    height: number,
    radius: number,
    terrainOffset: number = 0,
    index: number = 0
  ): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];
    const params = this.params.towerSpecificParams.gatehouse;
    const isGateLocation = index === 0;

    if (isGateLocation) {
      const spacing = params.towerSpacing;
      const towerW = radius * 1.6;

      const leftBody = new THREE.BoxGeometry(towerW, height, towerW);
      leftBody.translate(-spacing / 2 - towerW / 2, terrainOffset + height / 2, 0);
      geometries.push(leftBody);

      const rightBody = new THREE.BoxGeometry(towerW, height, towerW);
      rightBody.translate(spacing / 2 + towerW / 2, terrainOffset + height / 2, 0);
      geometries.push(rightBody);

      const connectHeight = params.archHeight + 2;
      const connectGeo = new THREE.BoxGeometry(spacing + towerW * 2, connectHeight, towerW * 0.8);
      connectGeo.translate(0, terrainOffset + height - connectHeight / 2, 0);
      geometries.push(connectGeo);

      const roofH = radius * 0.9;
      const leftRoof = new THREE.ConeGeometry(towerW * 0.85, roofH, 4);
      leftRoof.rotateY(Math.PI / 4);
      leftRoof.translate(-spacing / 2 - towerW / 2, terrainOffset + height + roofH / 2, 0);
      geometries.push(leftRoof);

      const rightRoof = new THREE.ConeGeometry(towerW * 0.85, roofH, 4);
      rightRoof.rotateY(Math.PI / 4);
      rightRoof.translate(spacing / 2 + towerW / 2, terrainOffset + height + roofH / 2, 0);
      geometries.push(rightRoof);

      const crenHeight = 1.2;
      const crenCount = 6;
      for (let i = 0; i < crenCount; i++) {
        const offset = -spacing / 2 - towerW / 2 + (i + 0.5) * ((spacing + towerW) / crenCount);
        const crenGeo = new THREE.BoxGeometry(0.8, crenHeight, towerW * 0.85);
        crenGeo.translate(offset, terrainOffset + height + crenHeight / 2 - connectHeight + 1, 0);
        geometries.push(crenGeo);
      }

      const winRows = 2;
      for (let side = 0; side < 2; side++) {
        const sx = side === 0 ? -spacing / 2 - towerW / 2 : spacing / 2 + towerW / 2;
        for (let r = 0; r < winRows; r++) {
          for (let w = 0; w < 2; w++) {
            const windowGeo = new THREE.BoxGeometry(0.6, 0.9, 0.25);
            const offset = -towerW / 4 + w * (towerW / 2);
            windowGeo.translate(
              sx,
              terrainOffset + 2.5 + r * 3,
              offset
            );
            geometries.push(windowGeo);
            const windowBack = windowGeo.clone();
            windowBack.translate(0, 0, -offset * 2);
            geometries.push(windowBack);
          }
        }
      }
    } else {
      const size = radius * 1.8;
      const bodyGeo = new THREE.BoxGeometry(size, height, size);
      bodyGeo.translate(0, terrainOffset + height / 2, 0);
      geometries.push(bodyGeo);

      const roofH = radius * 0.9;
      const roofGeo = new THREE.ConeGeometry(radius * 1.4, roofH, 4);
      roofGeo.rotateY(Math.PI / 4);
      roofGeo.translate(0, terrainOffset + height + roofH / 2, 0);
      geometries.push(roofGeo);

      for (let side = 0; side < 4; side++) {
        const angle = (side / 4) * Math.PI * 2 + Math.PI / 4;
        for (let i = 0; i < 2; i++) {
          const windowGeo = new THREE.BoxGeometry(0.7, 1.0, 0.25);
          windowGeo.translate(
            Math.cos(angle) * (size / 2 - 0.05),
            terrainOffset + 2 + i * 2.5,
            Math.sin(angle) * (size / 2 - 0.05)
          );
          windowGeo.rotateY(angle);
          geometries.push(windowGeo);
        }
      }
    }

    const merged = this.mergeGeometries(geometries);
    merged.translate(position.x, 0, position.y);
    return merged;
  }

  private createTower(
    position: THREE.Vector2,
    height: number,
    radius: number,
    shape: TowerShape = 'round',
    terrainOffset: number = 0
  ): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];

    if (shape === 'square') {
      const size = radius * 1.8;
      const bodyGeo = new THREE.BoxGeometry(size, height, size);
      bodyGeo.translate(0, terrainOffset + height / 2, 0);
      geometries.push(bodyGeo);

      const roofHeight = radius * 1.0;
      const roofGeo = new THREE.ConeGeometry(radius * 1.5, roofHeight, 4);
      roofGeo.rotateY(Math.PI / 4);
      roofGeo.translate(0, terrainOffset + height + roofHeight / 2, 0);
      geometries.push(roofGeo);

      for (let side = 0; side < 4; side++) {
        const angle = (side / 4) * Math.PI * 2 + Math.PI / 4;
        const windowCount = 3;
        for (let i = 0; i < windowCount; i++) {
          const windowGeo = new THREE.BoxGeometry(0.8, 1.2, 0.3);
          windowGeo.translate(
            Math.cos(angle) * (size / 2 - 0.05),
            terrainOffset + 2 + i * 2.5,
            Math.sin(angle) * (size / 2 - 0.05)
          );
          windowGeo.rotateY(angle);
          geometries.push(windowGeo);
        }
      }
    } else if (shape === 'round') {
      const bodyGeo = new THREE.CylinderGeometry(radius, radius * 1.1, height, 16);
      bodyGeo.translate(0, terrainOffset + height / 2, 0);
      geometries.push(bodyGeo);

      const roofHeight = radius * 1.2;
      const roofGeo = new THREE.ConeGeometry(radius * 1.2, roofHeight, 16);
      roofGeo.translate(0, terrainOffset + height + roofHeight / 2, 0);
      geometries.push(roofGeo);

      const windowCount = 5;
      for (let i = 0; i < windowCount; i++) {
        const angle = (i / windowCount) * Math.PI * 2;
        const windowGeo = new THREE.BoxGeometry(0.8, 1.5, 0.3);
        windowGeo.translate(
          Math.cos(angle) * (radius - 0.1),
          terrainOffset + height * 0.5 + i * 1.2 - 1.2,
          Math.sin(angle) * (radius - 0.1)
        );
        windowGeo.rotateY(angle);
        geometries.push(windowGeo);
      }
    } else if (shape === 'polygonal') {
      const sides = 6;
      const bodyGeo = new THREE.CylinderGeometry(radius, radius * 1.1, height, sides);
      bodyGeo.translate(0, terrainOffset + height / 2, 0);
      geometries.push(bodyGeo);

      const roofHeight = radius * 1.3;
      const roofGeo = new THREE.ConeGeometry(radius * 1.25, roofHeight, sides);
      roofGeo.translate(0, terrainOffset + height + roofHeight / 2, 0);
      geometries.push(roofGeo);

      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + Math.PI / sides;
        const windowGeo = new THREE.BoxGeometry(0.8, 1.4, 0.3);
        windowGeo.translate(
          Math.cos(angle) * (radius - 0.15),
          terrainOffset + height * 0.4 + (i % 3) * 1.8,
          Math.sin(angle) * (radius - 0.15)
        );
        windowGeo.rotateY(angle);
        geometries.push(windowGeo);
      }

      const pinnacleCount = sides;
      for (let i = 0; i < pinnacleCount; i++) {
        const angle = (i / pinnacleCount) * Math.PI * 2;
        const pinnacleGeo = new THREE.ConeGeometry(radius * 0.15, radius * 0.6, 4);
        pinnacleGeo.translate(
          Math.cos(angle) * radius * 1.15,
          terrainOffset + height,
          Math.sin(angle) * radius * 1.15
        );
        geometries.push(pinnacleGeo);
      }
    } else if (shape === 'd_shaped') {
      const flatSize = radius * 1.5;
      const curvePoints: THREE.Vector2[] = [];
      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const angle = Math.PI + (i / segments) * Math.PI;
        curvePoints.push(new THREE.Vector2(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        ));
      }
      const flatPoints = [
        new THREE.Vector2(flatSize / 2, radius),
        new THREE.Vector2(-flatSize / 2, radius),
      ];
      const allPoints = [...curvePoints, ...flatPoints];
      const shape = new THREE.Shape();
      shape.moveTo(allPoints[0].x, allPoints[0].y);
      for (let i = 1; i < allPoints.length; i++) {
        shape.lineTo(allPoints[i].x, allPoints[i].y);
      }
      shape.closePath();

      const extrudeSettings = { depth: height, bevelEnabled: false };
      const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      bodyGeo.rotateX(-Math.PI / 2);
      bodyGeo.translate(0, 0, 0);
      bodyGeo.translate(0, terrainOffset + height / 2, 0);
      geometries.push(bodyGeo);

      const roofHeight = radius * 1.1;
      const roofGeo = new THREE.ConeGeometry(radius * 1.15, roofHeight, 8);
      roofGeo.translate(0, terrainOffset + height + roofHeight / 2, 0);
      geometries.push(roofGeo);

      for (let i = 0; i < 3; i++) {
        const angle = Math.PI + 0.3 + (i / 3) * (Math.PI * 0.4);
        const windowGeo = new THREE.BoxGeometry(0.7, 1.3, 0.3);
        windowGeo.translate(
          Math.cos(angle) * (radius - 0.1),
          terrainOffset + height * 0.4 + i * 1.8,
          Math.sin(angle) * (radius - 0.1)
        );
        windowGeo.rotateY(angle);
        geometries.push(windowGeo);
      }
    }

    const merged = this.mergeGeometries(geometries);
    merged.translate(position.x, 0, position.y);

    return merged;
  }

  generateGate(plotPoints: THREE.Vector2[]): THREE.BufferGeometry {
    const { gateWidth, gateHeight, wallThickness } = this.params;
    
    const p1 = plotPoints[0];
    const p2 = plotPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.y + p2.y) / 2;
    const terrainH = this.getTerrainHeight(midX, midZ);

    const geometries: THREE.BufferGeometry[] = [];

    const frameThickness = 1;
    const leftFrame = new THREE.BoxGeometry(frameThickness, gateHeight + 1, wallThickness * 1.2);
    leftFrame.translate(-gateWidth / 2 - frameThickness / 2, terrainH + (gateHeight + 1) / 2, 0);
    geometries.push(leftFrame);

    const rightFrame = new THREE.BoxGeometry(frameThickness, gateHeight + 1, wallThickness * 1.2);
    rightFrame.translate(gateWidth / 2 + frameThickness / 2, terrainH + (gateHeight + 1) / 2, 0);
    geometries.push(rightFrame);

    const topFrame = new THREE.BoxGeometry(gateWidth + frameThickness * 2, frameThickness, wallThickness * 1.2);
    topFrame.translate(0, terrainH + gateHeight + 1 + frameThickness / 2, 0);
    geometries.push(topFrame);

    const doorLeft = new THREE.BoxGeometry(gateWidth / 2 - 0.1, gateHeight, 0.4);
    doorLeft.translate(-gateWidth / 4, terrainH + gateHeight / 2, 0);
    geometries.push(doorLeft);

    const doorRight = new THREE.BoxGeometry(gateWidth / 2 - 0.1, gateHeight, 0.4);
    doorRight.translate(gateWidth / 4, terrainH + gateHeight / 2, 0);
    geometries.push(doorRight);

    const merged = this.mergeGeometries(geometries);
    merged.rotateY(-angle);
    merged.translate(midX, 0, midZ);

    return merged;
  }

  generateMoat(plotPoints: THREE.Vector2[]): THREE.BufferGeometry | null {
    if (!this.params.hasMoat) return null;

    const { moatWidth, moatDepth } = this.params;
    const { innerPoints, outerPoints } = this.getMoatPoints(plotPoints, moatWidth);

    const shape = new THREE.Shape();
    shape.moveTo(outerPoints[0].x, outerPoints[0].y);
    for (let i = 1; i < outerPoints.length; i++) {
      shape.lineTo(outerPoints[i].x, outerPoints[i].y);
    }
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(innerPoints[0].x, innerPoints[0].y);
    for (let i = 1; i < innerPoints.length; i++) {
      hole.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    hole.closePath();
    shape.holes.push(hole);

    const extrudeSettings = {
      depth: moatDepth,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y < -0.01) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const terrainH = this.getTerrainHeight(x, z);
        positions.setY(i, terrainH - moatDepth);
      } else {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const terrainH = this.getTerrainHeight(x, z);
        positions.setY(i, terrainH);
      }
    }
    geometry.computeVertexNormals();

    return geometry;
  }

  private getMoatPoints(plotPoints: THREE.Vector2[], moatWidth: number): { innerPoints: THREE.Vector2[]; outerPoints: THREE.Vector2[] } {
    const outerPoints: THREE.Vector2[] = [];
    const innerPoints: THREE.Vector2[] = [];

    for (let i = 0; i < plotPoints.length; i++) {
      const p1 = plotPoints[i];
      const p2 = plotPoints[(i + 1) % plotPoints.length];
      const p0 = plotPoints[(i - 1 + plotPoints.length) % plotPoints.length];
      
      const dx1 = p2.x - p1.x;
      const dy1 = p2.y - p1.y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const nx1 = -dy1 / len1;
      const ny1 = dx1 / len1;
      
      const dx2 = p1.x - p0.x;
      const dy2 = p1.y - p0.y;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const nx2 = -dy2 / len2;
      const ny2 = dx2 / len2;
      
      const nx = (nx1 + nx2) / 2;
      const ny = (ny1 + ny2) / 2;
      const nlen = Math.sqrt(nx * nx + ny * ny);
      
      outerPoints.push(new THREE.Vector2(
        p1.x + (nx / nlen) * moatWidth,
        p1.y + (ny / nlen) * moatWidth
      ));
      
      innerPoints.push(new THREE.Vector2(
        p1.x - (nx / nlen) * (this.params.wallThickness + 1),
        p1.y - (ny / nlen) * (this.params.wallThickness + 1)
      ));
    }

    return { innerPoints, outerPoints };
  }

  generateMoatSegments(plotPoints: THREE.Vector2[]): THREE.BufferGeometry[] {
    if (!this.params.hasMoat) return [];

    const segments: THREE.BufferGeometry[] = [];
    const { moatWidth, moatDepth, moatSegments } = this.params;
    const { innerPoints, outerPoints } = this.getMoatPoints(plotPoints, moatWidth);

    for (const segConfig of moatSegments) {
      const i = segConfig.startIndex;
      const j = segConfig.endIndex;

      const segInner: THREE.Vector2[] = [];
      const segOuter: THREE.Vector2[] = [];
      
      segInner.push(innerPoints[i]);
      segInner.push(innerPoints[j]);
      segOuter.push(outerPoints[j]);
      segOuter.push(outerPoints[i]);

      const shape = new THREE.Shape();
      shape.moveTo(segInner[0].x, segInner[0].y);
      for (let k = 1; k < segInner.length; k++) {
        shape.lineTo(segInner[k].x, segInner[k].y);
      }
      for (let k = 0; k < segOuter.length; k++) {
        shape.lineTo(segOuter[k].x, segOuter[k].y);
      }
      shape.closePath();

      const extrudeSettings = {
        depth: moatDepth,
        bevelEnabled: false,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2);

      const positions = geometry.attributes.position;
      for (let idx = 0; idx < positions.count; idx++) {
        const y = positions.getY(idx);
        const x = positions.getX(idx);
        const z = positions.getZ(idx);
        const terrainH = this.getTerrainHeight(x, z);
        if (y < -0.01) {
          positions.setY(idx, terrainH - moatDepth);
        } else {
          positions.setY(idx, terrainH);
        }
      }
      geometry.computeVertexNormals();

      segments.push(geometry);
    }

    return segments;
  }

  generateWater(plotPoints: THREE.Vector2[]): THREE.BufferGeometry | null {
    if (!this.params.hasMoat) return null;

    const { moatWidth, moatDepth, moatWaterParams } = this.params;
    const waterLevel = moatWaterParams.globalWaterLevel;
    const { innerPoints, outerPoints } = this.getMoatPoints(plotPoints, moatWidth);

    const shape = new THREE.Shape();
    shape.moveTo(outerPoints[0].x, outerPoints[0].y);
    for (let i = 1; i < outerPoints.length; i++) {
      shape.lineTo(outerPoints[i].x, outerPoints[i].y);
    }
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(innerPoints[0].x, innerPoints[0].y);
    for (let i = 1; i < innerPoints.length; i++) {
      hole.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    hole.closePath();
    shape.holes.push(hole);

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const terrainH = this.getTerrainHeight(x, z);
      const waterY = terrainH - moatDepth * (1 - waterLevel);
      positions.setY(i, waterY);
    }
    geometry.computeVertexNormals();

    return geometry;
  }

  generateWaterSegments(plotPoints: THREE.Vector2[]): THREE.BufferGeometry[] {
    if (!this.params.hasMoat) return [];

    const segments: THREE.BufferGeometry[] = [];
    const { moatWidth, moatDepth, moatSegments } = this.params;
    const { innerPoints, outerPoints } = this.getMoatPoints(plotPoints, moatWidth);

    for (const segConfig of moatSegments) {
      const i = segConfig.startIndex;
      const j = segConfig.endIndex;
      const waterLevel = segConfig.waterLevel;

      const segInner: THREE.Vector2[] = [];
      const segOuter: THREE.Vector2[] = [];
      
      segInner.push(innerPoints[i]);
      segInner.push(innerPoints[j]);
      segOuter.push(outerPoints[j]);
      segOuter.push(outerPoints[i]);

      const shape = new THREE.Shape();
      shape.moveTo(segInner[0].x, segInner[0].y);
      for (let k = 1; k < segInner.length; k++) {
        shape.lineTo(segInner[k].x, segInner[k].y);
      }
      for (let k = 0; k < segOuter.length; k++) {
        shape.lineTo(segOuter[k].x, segOuter[k].y);
      }
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      geometry.rotateX(-Math.PI / 2);

      const positions = geometry.attributes.position;
      for (let idx = 0; idx < positions.count; idx++) {
        const x = positions.getX(idx);
        const z = positions.getZ(idx);
        const terrainH = this.getTerrainHeight(x, z);
        const waterY = terrainH - moatDepth * (1 - waterLevel);
        positions.setY(idx, waterY);
      }
      geometry.computeVertexNormals();

      segments.push(geometry);
    }

    return segments;
  }

  generateDrawbridge(plotPoints: THREE.Vector2[]): THREE.BufferGeometry | null {
    if (!this.params.hasMoat || !this.params.hasDrawbridge) return null;

    const { moatWidth, gateWidth, wallThickness } = this.params;
    const p1 = plotPoints[0];
    const p2 = plotPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.y + p2.y) / 2;

    const bridgeLength = moatWidth + wallThickness;
    const bridgeWidth = gateWidth * 0.9;
    const bridgeThickness = 0.3;

    const plankCount = 8;
    const geometries: THREE.BufferGeometry[] = [];

    for (let i = 0; i < plankCount; i++) {
      const plankWidth = bridgeWidth / plankCount;
      const plankGeo = new THREE.BoxGeometry(bridgeLength * 0.95, bridgeThickness, plankWidth - 0.05);
      const offset = -bridgeWidth / 2 + plankWidth / 2 + i * plankWidth;
      plankGeo.translate(bridgeLength / 2 - 0.5, 0, offset);
      geometries.push(plankGeo);
    }

    const chainGeo1 = new THREE.CylinderGeometry(0.05, 0.05, bridgeLength * 0.8, 6);
    chainGeo1.rotateZ(Math.PI / 2);
    chainGeo1.translate(bridgeLength / 2 - 0.5, bridgeThickness, bridgeWidth / 2 - 0.3);
    geometries.push(chainGeo1);

    const chainGeo2 = chainGeo1.clone();
    chainGeo2.translate(0, 0, -(bridgeWidth - 0.6));
    geometries.push(chainGeo2);

    const merged = this.mergeGeometries(geometries);
    merged.rotateY(-angle);
    merged.translate(midX, 0, midZ);

    return merged;
  }

  generatePortcullis(plotPoints: THREE.Vector2[]): THREE.BufferGeometry | null {
    if (!this.params.hasPortcullis) return null;

    const { gateWidth, gateHeight, portcullisPosition, wallThickness } = this.params;
    const p1 = plotPoints[0];
    const p2 = plotPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.y + p2.y) / 2;
    const terrainH = this.getTerrainHeight(midX, midZ);

    const liftOffset = portcullisPosition * (gateHeight * 0.9);
    const barCount = 10;
    const verticalBars = 6;
    const geometries: THREE.BufferGeometry[] = [];

    const barThickness = 0.15;

    for (let i = 0; i < verticalBars; i++) {
      const x = -gateWidth / 2 + 0.4 + (i / (verticalBars - 1)) * (gateWidth - 0.8);
      const barGeo = new THREE.BoxGeometry(barThickness, gateHeight * 0.95, barThickness);
      barGeo.translate(x, terrainH + gateHeight * 0.475 + liftOffset, 0);
      geometries.push(barGeo);

      const spikeGeo = new THREE.ConeGeometry(barThickness * 0.8, 0.4, 4);
      spikeGeo.translate(x, terrainH + 0.05 + liftOffset, 0);
      geometries.push(spikeGeo);
    }

    for (let i = 0; i < barCount; i++) {
      const y = 0.5 + (i / (barCount - 1)) * (gateHeight * 0.85);
      const hbarGeo = new THREE.BoxGeometry(gateWidth - 0.6, barThickness, barThickness);
      hbarGeo.translate(0, terrainH + y + liftOffset, 0);
      geometries.push(hbarGeo);
    }

    const frameTop = new THREE.BoxGeometry(gateWidth + 0.3, 0.25, wallThickness * 0.6);
    frameTop.translate(0, terrainH + gateHeight + 0.1 + liftOffset, 0);
    geometries.push(frameTop);

    const merged = this.mergeGeometries(geometries);
    merged.rotateY(-angle);
    merged.translate(midX, 0, midZ);

    return merged;
  }

  getBuildingPositions(plotPoints: THREE.Vector2[]): { x: number; z: number; width: number; depth: number; height: number }[] {
    const positions: { x: number; z: number; width: number; depth: number; height: number }[] = [];
    const { buildingCount, buildingHeight } = this.params;

    const innerBounds = this.getInnerBounds(plotPoints);
    const minX = innerBounds.minX + 3;
    const maxX = innerBounds.maxX - 3;
    const minZ = innerBounds.minY + 3;
    const maxZ = innerBounds.maxY - 3;

    const placed: { x: number; z: number; w: number; d: number }[] = [];
    const buildingRng = new SeededRandom(this.params.seed + 7777);

    for (let i = 0; i < buildingCount; i++) {
      let attempts = 0;
      while (attempts < 20) {
        const w = 3 + buildingRng.range(0, 4);
        const d = 3 + buildingRng.range(0, 4);
        const x = buildingRng.range(minX + w / 2, maxX - w / 2);
        const z = buildingRng.range(minZ + d / 2, maxZ - d / 2);
        const h = buildingHeight * (0.7 + buildingRng.range(0, 0.6));

        const overlap = placed.some((p) =>
          Math.abs(p.x - x) < (p.w + w) / 2 + 1 &&
          Math.abs(p.z - z) < (p.d + d) / 2 + 1
        );

        if (!overlap) {
          positions.push({ x, z, width: w, depth: d, height: h });
          placed.push({ x, z, w, d });
          break;
        }
        attempts++;
      }
    }

    return positions;
  }

  generateBuildings(plotPoints: THREE.Vector2[]): THREE.BufferGeometry[] {
    const buildings: THREE.BufferGeometry[] = [];
    const buildingPositions = this.getBuildingPositions(plotPoints);

    for (const pos of buildingPositions) {
      const terrainH = this.getTerrainHeight(pos.x, pos.z);
      const building = this.createBuilding(pos.x, pos.z, pos.width, pos.depth, pos.height, terrainH);
      buildings.push(building);
    }

    return buildings;
  }

  private createBuilding(
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    terrainOffset: number = 0
  ): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];

    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    bodyGeo.translate(0, terrainOffset + height / 2, 0);
    geometries.push(bodyGeo);

    const roofHeight = depth * 0.4;
    const roofGeo = new THREE.ConeGeometry(width * 0.7, roofHeight, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.translate(0, terrainOffset + height + roofHeight / 2, 0);
    geometries.push(roofGeo);

    const floors = Math.floor(height / 2.5);
    for (let f = 0; f < floors; f++) {
      const y = 1.5 + f * 2.5;
      const winCount = Math.max(1, Math.floor(width / 2.5));
      for (let w = 0; w < winCount; w++) {
        const wx = -width / 2 + 1 + w * (width - 2) / Math.max(1, winCount - 1);
        const windowGeo = new THREE.BoxGeometry(0.8, 1, 0.1);
        windowGeo.translate(wx, terrainOffset + y, depth / 2 + 0.05);
        geometries.push(windowGeo);
        
        const windowBack = windowGeo.clone();
        windowBack.translate(0, 0, -depth - 0.1);
        geometries.push(windowBack);
      }
    }

    const merged = this.mergeGeometries(geometries);
    merged.translate(x, 0, z);

    return merged;
  }

  generateGround(): THREE.BufferGeometry {
    const { hasMoat, moatWidth } = this.params;
    const padding = hasMoat ? moatWidth + 20 : 20;
    
    const size = Math.max(
      this.params.plotWidth + padding * 2,
      this.params.plotDepth + padding * 2
    );

    const geometry = new THREE.PlaneGeometry(size, size, 120, 120);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const terrainH = this.getTerrainHeight(x, z);
      positions.setY(i, terrainH);
    }
    geometry.computeVertexNormals();

    return geometry;
  }

  private getInnerBounds(points: THREE.Vector2[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    
    return { minX, maxX, minY, maxY };
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const mergedGeometry = new THREE.BufferGeometry();
    
    let vertexCount = 0;
    let indexCount = 0;
    
    for (const geo of geometries) {
      const pos = geo.attributes.position;
      if (!pos) continue;
      
      if (geo.index) {
        indexCount += geo.index.count;
      } else {
        indexCount += pos.count;
      }
      vertexCount += pos.count;
    }
    
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(indexCount);
    
    let vertexOffset = 0;
    let indexOffset = 0;
    
    for (const geo of geometries) {
      const pos = geo.attributes.position;
      const nor = geo.attributes.normal;
      const uv = geo.attributes.uv;
      
      if (!pos) continue;
      
      for (let i = 0; i < pos.count; i++) {
        positions[(vertexOffset + i) * 3] = pos.getX(i);
        positions[(vertexOffset + i) * 3 + 1] = pos.getY(i);
        positions[(vertexOffset + i) * 3 + 2] = pos.getZ(i);
        
        if (nor) {
          normals[(vertexOffset + i) * 3] = nor.getX(i);
          normals[(vertexOffset + i) * 3 + 1] = nor.getY(i);
          normals[(vertexOffset + i) * 3 + 2] = nor.getZ(i);
        }
        
        if (uv) {
          uvs[(vertexOffset + i) * 2] = uv.getX(i);
          uvs[(vertexOffset + i) * 2 + 1] = uv.getY(i);
        }
      }
      
      if (geo.index) {
        const idx = geo.index;
        for (let i = 0; i < idx.count; i++) {
          indices[indexOffset + i] = idx.getX(i) + vertexOffset;
        }
        indexOffset += idx.count;
      } else {
        for (let i = 0; i < pos.count; i++) {
          indices[indexOffset + i] = i + vertexOffset;
        }
        indexOffset += pos.count;
      }
      
      vertexOffset += pos.count;
    }
    
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    mergedGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    return mergedGeometry;
  }

  private applyUVsToBox(
    geometry: THREE.BufferGeometry,
    width: number,
    height: number,
    depth: number
  ) {
    const uvs = geometry.attributes.uv;
    if (!uvs) return;

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      if (Math.abs(z - depth / 2) < 0.01) {
        uvs.setXY(i, x / width + 0.5, y / height);
      } else if (Math.abs(z + depth / 2) < 0.01) {
        uvs.setXY(i, 1 - (x / width + 0.5), y / height);
      } else if (Math.abs(x - width / 2) < 0.01) {
        uvs.setXY(i, z / depth + 0.5, y / height);
      } else if (Math.abs(x + width / 2) < 0.01) {
        uvs.setXY(i, 1 - (z / depth + 0.5), y / height);
      } else {
        uvs.setXY(i, x / width + 0.5, z / depth + 0.5);
      }
    }
    uvs.needsUpdate = true;
  }

  generateAll(crenellationHeightMultiplier = 1.0): {
    plotPoints: THREE.Vector2[];
    walls: THREE.BufferGeometry[];
    towers: THREE.BufferGeometry[];
    gate: THREE.BufferGeometry;
    moat: THREE.BufferGeometry | null;
    moatSegments: THREE.BufferGeometry[];
    water: THREE.BufferGeometry | null;
    waterSegments: THREE.BufferGeometry[];
    drawbridge: THREE.BufferGeometry | null;
    portcullis: THREE.BufferGeometry | null;
    buildings: THREE.BufferGeometry[];
    ground: THREE.BufferGeometry;
  } {
    const plotPoints = this.generatePlotPoints();
    return {
      plotPoints,
      walls: this.generateWalls(plotPoints, crenellationHeightMultiplier),
      towers: this.generateTowers(plotPoints),
      gate: this.generateGate(plotPoints),
      moat: this.generateMoat(plotPoints),
      moatSegments: this.generateMoatSegments(plotPoints),
      water: this.generateWater(plotPoints),
      waterSegments: this.generateWaterSegments(plotPoints),
      drawbridge: this.generateDrawbridge(plotPoints),
      portcullis: this.generatePortcullis(plotPoints),
      buildings: this.generateBuildings(plotPoints),
      ground: this.generateGround(),
    };
  }
}
