import * as THREE from 'three';
import { CastleParams, CrenellationStyle, TowerShape } from '@/types/castle';
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
    const { towerCount, towerHeight, towerRadius, towerShape } = this.params;

    for (let i = 0; i < plotPoints.length; i++) {
      const terrainH = this.getTerrainHeight(plotPoints[i].x, plotPoints[i].y);
      const tower = this.createTower(plotPoints[i], towerHeight, towerRadius, towerShape, terrainH);
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
      const tower = this.createTower(midPoint, h, r, towerShape, terrainH);
      towers.push(tower);
    }

    return towers;
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
      buildings: this.generateBuildings(plotPoints),
      ground: this.generateGround(),
    };
  }
}
