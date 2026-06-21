import * as THREE from 'three';
import { NPCType, CastleParams } from '@/types/castle';
import { SeededRandom } from '@/utils/seededRandom';

export interface NPC {
  id: string;
  type: NPCType;
  position: THREE.Vector3;
  target: THREE.Vector3;
  speed: number;
  rotation: number;
  walkPhase: number;
  homePosition: THREE.Vector3;
}

interface Obstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class NPCSystem {
  private npcs: NPC[] = [];
  private obstacles: Obstacle[] = [];
  private rng: SeededRandom;
  private params: CastleParams;
  private plotPoints: THREE.Vector2[];
  private innerBounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(params: CastleParams, plotPoints: THREE.Vector2[]) {
    this.params = params;
    this.rng = new SeededRandom(params.seed + 9999);
    this.plotPoints = plotPoints;
    this.innerBounds = this.calculateInnerBounds();
  }

  private calculateInnerBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of this.plotPoints) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.y);
      maxZ = Math.max(maxZ, p.y);
    }
    const wallOffset = this.params.wallThickness + 1;
    return {
      minX: minX + wallOffset,
      maxX: maxX - wallOffset,
      minZ: minZ + wallOffset,
      maxZ: maxZ - wallOffset,
    };
  }

  setObstacles(buildingPositions: { x: number; z: number; width: number; depth: number }[]) {
    this.obstacles = buildingPositions.map((b) => ({
      minX: b.x - b.width / 2 - 0.5,
      maxX: b.x + b.width / 2 + 0.5,
      minZ: b.z - b.depth / 2 - 0.5,
      maxZ: b.z + b.depth / 2 + 0.5,
    }));
  }

  generateNPCs(): NPC[] {
    this.npcs = [];
    const { residentCount, farmerRatio, soldierRatio, nobleRatio } = this.params;

    const farmerCount = Math.floor(residentCount * farmerRatio);
    const soldierCount = Math.floor(residentCount * soldierRatio);
    const nobleCount = Math.max(1, residentCount - farmerCount - soldierCount);

    for (let i = 0; i < farmerCount; i++) {
      this.npcs.push(this.createNPC('farmer', i));
    }
    for (let i = 0; i < soldierCount; i++) {
      this.npcs.push(this.createNPC('soldier', i));
    }
    for (let i = 0; i < nobleCount; i++) {
      this.npcs.push(this.createNPC('noble', i));
    }

    return this.npcs;
  }

  private createNPC(type: NPCType, index: number): NPC {
    const id = `${type}_${index}_${this.rng.range(0, 10000).toFixed(0)}`;
    const homePos = this.getHomePosition(type);
    const target = this.getRandomTargetForType(type, homePos);

    let speed = 1.5;
    if (type === 'soldier') speed = 2.0;
    if (type === 'noble') speed = 1.0;

    return {
      id,
      type,
      position: homePos.clone(),
      target,
      speed,
      rotation: 0,
      walkPhase: this.rng.range(0, Math.PI * 2),
      homePosition: homePos.clone(),
    };
  }

  private getHomePosition(type: NPCType): THREE.Vector3 {
    const { minX, maxX, minZ, maxZ } = this.innerBounds;
    let x: number, z: number;

    if (type === 'soldier') {
      const side = Math.floor(this.rng.range(0, 4));
      const margin = 1.5;
      switch (side) {
        case 0:
          x = this.rng.range(minX + margin, maxX - margin);
          z = minZ + margin;
          break;
        case 1:
          x = this.rng.range(minX + margin, maxX - margin);
          z = maxZ - margin;
          break;
        case 2:
          x = minX + margin;
          z = this.rng.range(minZ + margin, maxZ - margin);
          break;
        default:
          x = maxX - margin;
          z = this.rng.range(minZ + margin, maxZ - margin);
          break;
      }
    } else if (type === 'noble') {
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const radius = Math.min(maxX - minX, maxZ - minZ) * 0.25;
      const angle = this.rng.range(0, Math.PI * 2);
      x = centerX + Math.cos(angle) * radius;
      z = centerZ + Math.sin(angle) * radius;
    } else {
      x = this.rng.range(minX + 2, maxX - 2);
      z = this.rng.range(minZ + 2, maxZ - 2);
    }

    return new THREE.Vector3(x, 0, z);
  }

  private getRandomTargetForType(type: NPCType, currentPos: THREE.Vector3): THREE.Vector3 {
    const { minX, maxX, minZ, maxZ } = this.innerBounds;
    let targetX: number, targetZ: number;

    if (type === 'soldier') {
      const wallIndex = Math.floor(this.rng.range(0, this.plotPoints.length));
      const p1 = this.plotPoints[wallIndex];
      const p2 = this.plotPoints[(wallIndex + 1) % this.plotPoints.length];
      const t = this.rng.range(0.1, 0.9);
      const midX = p1.x + (p2.x - p1.x) * t;
      const midZ = p1.y + (p2.y - p1.y) * t;
      const dx = p2.x - p1.x;
      const dz = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dz * dz);
      const inwardOffset = this.params.wallThickness * 0.5 + 1;
      targetX = midX - (dz / len) * inwardOffset;
      targetZ = midZ + (dx / len) * inwardOffset;
    } else if (type === 'noble') {
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const radius = Math.min(maxX - minX, maxZ - minZ) * 0.2;
      const angle = this.rng.range(0, Math.PI * 2);
      targetX = centerX + Math.cos(angle) * radius;
      targetZ = centerZ + Math.sin(angle) * radius;
    } else {
      targetX = this.rng.range(minX + 1, maxX - 1);
      targetZ = this.rng.range(minZ + 1, maxZ - 1);
    }

    return new THREE.Vector3(targetX, 0, targetZ);
  }

  private checkCollision(x: number, z: number, radius: number = 0.4): boolean {
    const { minX, maxX, minZ, maxZ } = this.innerBounds;
    if (x < minX + radius || x > maxX - radius || z < minZ + radius || z > maxZ - radius) {
      return true;
    }

    for (const obs of this.obstacles) {
      if (
        x + radius > obs.minX &&
        x - radius < obs.maxX &&
        z + radius > obs.minZ &&
        z - radius < obs.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  private findSteerDirection(
    pos: THREE.Vector3,
    target: THREE.Vector3,
    radius: number = 0.4
  ): THREE.Vector3 {
    const desired = new THREE.Vector3().subVectors(target, pos);
    desired.y = 0;
    const dist = desired.length();

    if (dist < 0.1) return new THREE.Vector3();

    desired.normalize();

    if (!this.checkCollision(pos.x + desired.x * radius, pos.z + desired.z * radius, radius)) {
      return desired;
    }

    const angles = [30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180];
    const baseAngle = Math.atan2(desired.z, desired.x);

    for (const angleDeg of angles) {
      const angleRad = baseAngle + (angleDeg * Math.PI) / 180;
      const testDir = new THREE.Vector3(Math.cos(angleRad), 0, Math.sin(angleRad));
      if (
        !this.checkCollision(
          pos.x + testDir.x * radius * 2,
          pos.z + testDir.z * radius * 2,
          radius
        )
      ) {
        return testDir;
      }
    }

    return desired.negate();
  }

  update(deltaTime: number, getTerrainHeight: (x: number, z: number) => number) {
    for (const npc of this.npcs) {
      const toTarget = new THREE.Vector3().subVectors(npc.target, npc.position);
      toTarget.y = 0;
      const distToTarget = toTarget.length();

      if (distToTarget < 0.5) {
        npc.target = this.getRandomTargetForType(npc.type, npc.position);
        continue;
      }

      const steerDir = this.findSteerDirection(npc.position, npc.target, 0.4);
      if (steerDir.length() < 0.01) continue;

      const moveAmount = npc.speed * deltaTime;
      const newX = npc.position.x + steerDir.x * moveAmount;
      const newZ = npc.position.z + steerDir.z * moveAmount;

      if (!this.checkCollision(newX, newZ, 0.4)) {
        npc.position.x = newX;
        npc.position.z = newZ;
        npc.rotation = Math.atan2(steerDir.x, steerDir.z);
        npc.walkPhase += deltaTime * npc.speed * 3;
      } else {
        const backupDir = steerDir.clone().negate();
        npc.position.x += backupDir.x * moveAmount * 0.5;
        npc.position.z += backupDir.z * moveAmount * 0.5;
      }

      npc.position.y = getTerrainHeight(npc.position.x, npc.position.z);
    }
  }

  getNPCs(): NPC[] {
    return this.npcs;
  }
}
