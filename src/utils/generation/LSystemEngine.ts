import { SeededRandom } from '@/utils/seededRandom';
import { LSystemConfig, CastleParams, DEFAULT_LSYSTEM_CONFIG, LSystemSegment } from '@/types/castle';

export class LSystemEngine {
  private rng: SeededRandom;
  private config: LSystemConfig;

  constructor(seed: number, config: LSystemConfig = DEFAULT_LSYSTEM_CONFIG) {
    this.rng = new SeededRandom(seed);
    this.config = config;
  }

  generate(): string {
    let current = this.config.axiom;
    for (let i = 0; i < this.config.iterations; i++) {
      let next = '';
      for (const ch of current) {
        next += this.config.rules[ch] ?? ch;
      }
      if (next.length > 50000) break;
      current = next;
    }
    return current;
  }

  interpret(lstring: string): LSystemSegment[] {
    const segments: LSystemSegment[] = [];
    let x = 0;
    let y = 0;
    let angle = 0;
    let depth = 0;
    const stack: { x: number; y: number; angle: number; depth: number }[] = [];
    const segLen = this.config.segmentLength;
    const angleStep = this.config.angle * Math.PI / 180;

    const wallThreshold = 0.6;
    const towerThreshold = 0.85;
    const gateInterval = Math.max(5, Math.floor(lstring.length / 10));

    let segIndex = 0;

    for (let i = 0; i < lstring.length; i++) {
      const ch = lstring[i];
      if (ch === 'F') {
        const nx = x + Math.cos(angle) * segLen;
        const ny = y + Math.sin(angle) * segLen;
        const r = this.rng.next();
        let type: LSystemSegment['type'] = 'wall';
        if (this.config.towerBranchRules && r > towerThreshold) {
          type = 'tower';
        } else if (this.config.moatPatternRules && r < 1 - towerThreshold && r > wallThreshold) {
          type = 'moat';
        }
        if (this.config.wallSegmentRules) {
          if (segIndex % gateInterval === 0 && depth === 0) {
            type = 'gate';
          }
        }
        segments.push({ startX: x, startY: y, endX: nx, endY: ny, depth, type });
        x = nx;
        y = ny;
        segIndex++;
      } else if (ch === '+') {
        angle += angleStep + (this.rng.next() - 0.5) * angleStep * 0.3;
      } else if (ch === '-') {
        angle -= angleStep + (this.rng.next() - 0.5) * angleStep * 0.3;
      } else if (ch === '[') {
        stack.push({ x, y, angle, depth });
        depth++;
      } else if (ch === ']') {
        const state = stack.pop();
        if (state) {
          x = state.x;
          y = state.y;
          angle = state.angle;
          depth = state.depth;
        }
      }
    }

    return segments;
  }

  generateParams(baseParams: CastleParams): Partial<CastleParams> {
    const lstring = this.generate();
    const segments = this.interpret(lstring);

    const wallSegs = segments.filter(s => s.type === 'wall');
    const towerSegs = segments.filter(s => s.type === 'tower');
    const moatSegs = segments.filter(s => s.type === 'moat');
    const gateSegs = segments.filter(s => s.type === 'gate');

    let minMaxX = [Infinity, -Infinity];
    let minMaxY = [Infinity, -Infinity];
    for (const seg of segments) {
      minMaxX[0] = Math.min(minMaxX[0], seg.startX, seg.endX);
      minMaxX[1] = Math.max(minMaxX[1], seg.startX, seg.endX);
      minMaxY[0] = Math.min(minMaxY[0], seg.startY, seg.endY);
      minMaxY[1] = Math.max(minMaxY[1], seg.startY, seg.endY);
    }

    const spanX = Math.max(1, minMaxX[1] - minMaxX[0]);
    const spanY = Math.max(1, minMaxY[1] - minMaxY[0]);
    const scaleFactor = Math.max(baseParams.plotWidth / spanX, baseParams.plotDepth / spanY) * 0.8;

    const maxDepth = Math.max(1, ...segments.map(s => s.depth));
    const wallHeight = baseParams.wallHeight * (1 + (maxDepth - 1) * 0.1);
    const wallThickness = baseParams.wallThickness * (0.8 + this.rng.range(0, 0.4));

    const towerCount = Math.max(
      baseParams.towerCount,
      towerSegs.length
    );

    const hasMoat = moatSegs.length > 0 || baseParams.hasMoat;

    const branchFactor = towerSegs.length / Math.max(1, wallSegs.length);
    const terrainAmplitude = baseParams.terrainAmplitude * (1 + branchFactor * 0.5);

    return {
      wallHeight: Math.min(20, Math.max(4, wallHeight)),
      wallThickness: Math.min(5, Math.max(1, wallThickness)),
      towerCount: Math.min(12, towerCount),
      hasMoat,
      terrainAmplitude: Math.min(15, Math.max(0, terrainAmplitude)),
      seed: Math.floor(this.rng.range(0, 100000)),
    };
  }

  generateLayout(lstring: string): { x: number; z: number; type: string }[] {
    const segments = this.interpret(lstring);
    const points: { x: number; z: number; type: string }[] = [];
    for (const seg of segments) {
      points.push({
        x: (seg.startX + seg.endX) / 2,
        z: (seg.startY + seg.endY) / 2,
        type: seg.type,
      });
    }
    return points;
  }

  static PRESETS: Record<string, LSystemConfig> = {
    classic: {
      axiom: 'F[+F]F[-F]F',
      rules: { 'F': 'FF[+F][-F][F]', '+': '+', '-': '-' },
      iterations: 3,
      angle: 25,
      segmentLength: 5,
      wallSegmentRules: true,
      towerBranchRules: true,
      moatPatternRules: false,
    },
    branching: {
      axiom: 'F+F+F+F',
      rules: { 'F': 'FF+F-F+F+FF', '+': '+', '-': '-' },
      iterations: 3,
      angle: 90,
      segmentLength: 4,
      wallSegmentRules: true,
      towerBranchRules: true,
      moatPatternRules: true,
    },
    organic: {
      axiom: 'F',
      rules: { 'F': 'F[+F]F[-F]F', '+': '+', '-': '-' },
      iterations: 4,
      angle: 25.7,
      segmentLength: 3,
      wallSegmentRules: true,
      towerBranchRules: true,
      moatPatternRules: false,
    },
    fortress: {
      axiom: 'F+F+F+F',
      rules: { 'F': 'F+F-F-FF+F+F-F', '+': '+', '-': '-' },
      iterations: 2,
      angle: 90,
      segmentLength: 6,
      wallSegmentRules: true,
      towerBranchRules: true,
      moatPatternRules: true,
    },
    fractal: {
      axiom: 'F[+F][-F]',
      rules: { 'F': 'F[+F][-F][F]', '+': '+', '-': '-' },
      iterations: 4,
      angle: 22.5,
      segmentLength: 3,
      wallSegmentRules: false,
      towerBranchRules: true,
      moatPatternRules: false,
    },
  };
}
