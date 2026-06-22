import * as THREE from 'three';
import { LSystemSegment } from '@/types/castle';

export class LSystemGeometryAdapter {
  private segments: LSystemSegment[];
  private plotWidth: number;
  private plotDepth: number;
  private rng: { range: (min: number, max: number) => number; next: () => number };

  constructor(
    segments: LSystemSegment[],
    plotWidth: number,
    plotDepth: number,
    rng: { range: (min: number, max: number) => number; next: () => number }
  ) {
    this.segments = segments;
    this.plotWidth = plotWidth;
    this.plotDepth = plotDepth;
    this.rng = rng;
  }

  generatePlotPoints(): THREE.Vector2[] {
    const wallSegs = this.segments.filter(s => s.type === 'wall' || s.type === 'gate');

    if (wallSegs.length < 3) {
      return this.createFallbackPlotPoints();
    }

    const { scale, offX, offY } = this.computeScaleAndOffset(wallSegs);

    const endpointSet = new Map<string, { x: number; y: number; count: number }>();
    for (const seg of wallSegs) {
      const sKey = `${seg.startX.toFixed(2)}_${seg.startY.toFixed(2)}`;
      const eKey = `${seg.endX.toFixed(2)}_${seg.endY.toFixed(2)}`;
      for (const [key, px, py] of [[sKey, seg.startX, seg.startY], [eKey, seg.endX, seg.endY]] as const) {
        const existing = endpointSet.get(key);
        if (existing) {
          existing.count++;
        } else {
          endpointSet.set(key, { x: px, y: py, count: 1 });
        }
      }
    }

    const junctions = Array.from(endpointSet.values())
      .filter(p => p.count >= 2 || this.rng.next() < 0.3)
      .map(p => new THREE.Vector2(
        (p.x + offX) * scale,
        (p.y + offY) * scale
      ));

    if (junctions.length < 3) {
      return this.createFallbackPlotPoints();
    }

    const centerX = junctions.reduce((s, p) => s + p.x, 0) / junctions.length;
    const centerY = junctions.reduce((s, p) => s + p.y, 0) / junctions.length;
    junctions.sort((a, b) => {
      const angA = Math.atan2(a.y - centerY, a.x - centerX);
      const angB = Math.atan2(b.y - centerY, b.x - centerX);
      return angA - angB;
    });

    const targetCount = Math.min(12, Math.max(4, Math.floor(junctions.length / 2)));
    const result: THREE.Vector2[] = [];
    const step = junctions.length / targetCount;
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.floor(i * step) % junctions.length;
      result.push(junctions[idx]);
    }

    return result;
  }

  getTowerPositions(): THREE.Vector2[] {
    const towerSegs = this.segments.filter(s => s.type === 'tower');
    if (towerSegs.length === 0) return [];
    return this.scaleSegmentMidpoints(towerSegs);
  }

  private scaleSegmentMidpoints(segments: LSystemSegment[]): THREE.Vector2[] {
    const { scale, offX, offY } = this.computeScaleAndOffset(segments);
    return segments.map(seg => new THREE.Vector2(
      ((seg.startX + seg.endX) / 2 + offX) * scale,
      ((seg.startY + seg.endY) / 2 + offY) * scale
    ));
  }

  private computeScaleAndOffset(segments: LSystemSegment[]): { scale: number; offX: number; offY: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const seg of segments) {
      minX = Math.min(minX, seg.startX, seg.endX);
      maxX = Math.max(maxX, seg.startX, seg.endX);
      minY = Math.min(minY, seg.startY, seg.endY);
      maxY = Math.max(maxY, seg.startY, seg.endY);
    }
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const scaleX = this.plotWidth / spanX;
    const scaleY = this.plotDepth / spanY;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    const offX = -(minX + maxX) / 2;
    const offY = -(minY + maxY) / 2;
    return { scale, offX, offY };
  }

  private createFallbackPlotPoints(): THREE.Vector2[] {
    const points: THREE.Vector2[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
      const wobble = 0.85 + this.rng.range(0, 0.3);
      points.push(new THREE.Vector2(
        Math.cos(angle) * (this.plotWidth / 2) * wobble,
        Math.sin(angle) * (this.plotDepth / 2) * wobble
      ));
    }
    return points;
  }
}
