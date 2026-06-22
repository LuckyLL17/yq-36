import * as THREE from 'three';
import { UVMappingMode, SeamEdge } from '@/types/castle';

export interface UVIsland {
  geometry: THREE.BufferGeometry;
  name: string;
  bounds: { minU: number; maxU: number; minV: number; maxV: number };
  seams?: SeamEdge[];
}

export class UVUnwrapper {
  static unwrapGeometry(
    geometry: THREE.BufferGeometry,
    name: string = 'mesh',
    mode: UVMappingMode = 'auto'
  ): UVIsland {
    const pos = geometry.attributes.position;
    const norm = geometry.attributes.normal;

    if (!pos) {
      return {
        geometry,
        name,
        bounds: { minU: 0, maxU: 1, minV: 0, maxV: 1 },
      };
    }

    const uvs = new Float32Array(pos.count * 2);
    let minU = Infinity,
      maxU = -Infinity,
      minV = Infinity,
      maxV = -Infinity;

    let centerX = 0, centerY = 0, centerZ = 0;
    for (let i = 0; i < pos.count; i++) {
      centerX += pos.getX(i);
      centerY += pos.getY(i);
      centerZ += pos.getZ(i);
    }
    centerX /= pos.count;
    void centerY;
    centerZ /= pos.count;

    let bboxMinX = Infinity, bboxMinY = Infinity, bboxMinZ = Infinity;
    let bboxMaxX = -Infinity, bboxMaxY = -Infinity, bboxMaxZ = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      bboxMinX = Math.min(bboxMinX, pos.getX(i));
      bboxMinY = Math.min(bboxMinY, pos.getY(i));
      bboxMinZ = Math.min(bboxMinZ, pos.getZ(i));
      bboxMaxX = Math.max(bboxMaxX, pos.getX(i));
      bboxMaxY = Math.max(bboxMaxY, pos.getY(i));
      bboxMaxZ = Math.max(bboxMaxZ, pos.getZ(i));
    }
    const bboxSizeX = bboxMaxX - bboxMinX;
    const bboxSizeY = bboxMaxY - bboxMinY;
    const bboxSizeZ = bboxMaxZ - bboxMinZ;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const nx = norm?.getX(i) || 0;
      const ny = norm?.getY(i) || 0;
      const nz = norm?.getZ(i) || 0;

      let u: number, v: number;

      switch (mode) {
        case 'planar': {
          const absNx = Math.abs(nx);
          const absNy = Math.abs(ny);
          const absNz = Math.abs(nz);
          if (absNy >= absNx && absNy >= absNz) {
            u = x;
            v = z;
          } else if (absNx >= absNz) {
            u = z;
            v = y;
          } else {
            u = x;
            v = y;
          }
          break;
        }

        case 'cylindrical': {
          const dx = x - centerX;
          const dz = z - centerZ;
          let theta = Math.atan2(dz, dx);
          if (theta < 0) theta += Math.PI * 2;
          u = theta / (Math.PI * 2);
          const heightNorm = (y - bboxMinY) / (bboxSizeY || 1);
          v = heightNorm;
          u *= Math.max(bboxSizeX, bboxSizeZ);
          v *= bboxSizeY;
          break;
        }

        case 'cubic': {
          const absNx = Math.abs(nx);
          const absNy = Math.abs(ny);
          const absNz = Math.abs(nz);
          let faceU: number, faceV: number;
          let faceIndex: number;

          if (absNy >= absNx && absNy >= absNz) {
            faceIndex = ny >= 0 ? 0 : 1;
            faceU = (x - bboxMinX) / (bboxSizeX || 1);
            faceV = (z - bboxMinZ) / (bboxSizeZ || 1);
            if (ny < 0) faceU = 1 - faceU;
          } else if (absNx >= absNz) {
            faceIndex = nx >= 0 ? 2 : 3;
            faceU = (z - bboxMinZ) / (bboxSizeZ || 1);
            faceV = (y - bboxMinY) / (bboxSizeY || 1);
            if (nx < 0) faceU = 1 - faceU;
          } else {
            faceIndex = nz >= 0 ? 4 : 5;
            faceU = (x - bboxMinX) / (bboxSizeX || 1);
            faceV = (y - bboxMinY) / (bboxSizeY || 1);
            if (nz < 0) faceU = 1 - faceU;
          }

          const cols = 3;
          const rows = 2;
          const tileW = 1 / cols;
          const tileH = 1 / rows;
          const col = faceIndex % cols;
          const row = Math.floor(faceIndex / cols);
          const scale = 0.95;
          const pad = (1 - scale) / 2;
          u = (col + pad + faceU * scale) * tileW;
          v = (row + pad + faceV * scale) * tileH;

          const maxDim = Math.max(bboxSizeX, bboxSizeY, bboxSizeZ);
          u *= maxDim * cols;
          v *= maxDim * rows;
          break;
        }

        case 'auto':
        default: {
          const absNx = Math.abs(nx);
          const absNy = Math.abs(ny);
          const absNz = Math.abs(nz);

          if (absNy >= absNx && absNy >= absNz) {
            u = x;
            v = z;
          } else if (absNx >= absNz) {
            u = z;
            v = y;
          } else {
            u = x;
            v = y;
          }
          break;
        }
      }

      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }

    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = uvs[i * 2] - minU;
      uvs[i * 2 + 1] = uvs[i * 2 + 1] - minV;
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;

    const island: UVIsland = {
      geometry,
      name,
      bounds: { minU: 0, maxU: maxU - minU, minV: 0, maxV: maxV - minV },
    };

    island.seams = this.detectSeams(geometry);

    return island;
  }

  static detectSeams(geometry: THREE.BufferGeometry): SeamEdge[] {
    const seams: SeamEdge[] = [];
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const index = geometry.index;

    if (!pos || !uv) return seams;

    const edgeMap = new Map<string, { indices: number[]; positions: number[][] }>();

    const triCount = index ? index.count / 3 : pos.count / 3;

    for (let t = 0; t < triCount; t++) {
      for (let e = 0; e < 3; e++) {
        let i0: number, i1: number;
        if (index) {
          i0 = index.getX(t * 3 + e);
          i1 = index.getX(t * 3 + ((e + 1) % 3));
        } else {
          i0 = t * 3 + e;
          i1 = t * 3 + ((e + 1) % 3);
        }

        const p0 = [pos.getX(i0), pos.getY(i0), pos.getZ(i0)];
        const p1 = [pos.getX(i1), pos.getY(i1), pos.getZ(i1)];

        const d0 = Math.sqrt(p0[0] ** 2 + p0[1] ** 2 + p0[2] ** 2);
        const d1 = Math.sqrt(p1[0] ** 2 + p1[1] ** 2 + p1[2] ** 2);

        let key: string;
        if (d0 < d1 || (d0 === d1 && (p0[0] < p1[0] || (p0[0] === p1[0] && p0[1] < p1[1])))) {
          key = `${i0}_${i1}`;
        } else {
          key = `${i1}_${i0}`;
        }

        const existing = edgeMap.get(key);
        if (existing) {
          existing.indices.push(i0, i1);
        } else {
          edgeMap.set(key, {
            indices: [i0, i1],
            positions: [p0, p1],
          });
        }
      }
    }

    const EPS = 1e-4;
    edgeMap.forEach(({ indices, positions }) => {
      if (indices.length <= 2) return;

      const u0a = uv.getX(indices[0]);
      const v0a = uv.getY(indices[0]);
      const u1a = uv.getX(indices[1]);
      const v1a = uv.getY(indices[1]);

      let isSeam = false;
      for (let k = 2; k < indices.length; k += 2) {
        const u0b = uv.getX(indices[k]);
        const v0b = uv.getY(indices[k]);
        const u1b = uv.getX(indices[k + 1]);
        const v1b = uv.getY(indices[k + 1]);

        const du0 = Math.abs(u0a - u0b);
        const dv0 = Math.abs(v0a - v0b);
        const du1 = Math.abs(u1a - u1b);
        const dv1 = Math.abs(v1a - v1b);

        const du0r = Math.abs(u0a - u1b);
        const dv0r = Math.abs(v0a - v1b);
        const du1r = Math.abs(u1a - u0b);
        const dv1r = Math.abs(v1a - v0b);

        const diffForward = du0 + dv0 + du1 + dv1;
        const diffReverse = du0r + dv0r + du1r + dv1r;

        if (Math.min(diffForward, diffReverse) > EPS) {
          isSeam = true;
          break;
        }
      }

      if (isSeam) {
        seams.push({
          start: positions[0] as [number, number, number],
          end: positions[1] as [number, number, number],
          uvStartU: u0a,
          uvStartV: v0a,
          uvEndU: u1a,
          uvEndV: v1a,
        });
      }
    });

    return seams;
  }

  static packIslands(islands: UVIsland[], padding: number = 0.02): UVIsland[] {
    if (islands.length === 0) return [];

    const sorted = [...islands].sort((a, b) => {
      const areaA = (a.bounds.maxU - a.bounds.minU) * (a.bounds.maxV - a.bounds.minV);
      const areaB = (b.bounds.maxU - b.bounds.minU) * (b.bounds.maxV - b.bounds.minV);
      return areaB - areaA;
    });

    let totalArea = 0;
    let maxSize = 0;
    for (const island of sorted) {
      const w = island.bounds.maxU - island.bounds.minU;
      const h = island.bounds.maxV - island.bounds.minV;
      totalArea += w * h;
      maxSize = Math.max(maxSize, w, h);
    }

    const gap = maxSize * padding;
    const targetWidth = Math.sqrt(totalArea) * (1 + padding * 2);

    const placed: {
      island: UVIsland;
      x: number;
      y: number;
      w: number;
      h: number;
      rotated: boolean;
    }[] = [];

    const rows: { y: number; height: number; width: number }[] = [];

    for (const island of sorted) {
      const origW = island.bounds.maxU - island.bounds.minU;
      const origH = island.bounds.maxV - island.bounds.minV;

      const wNormal = origW + gap;
      const hNormal = origH + gap;
      const wRotated = origH + gap;
      const hRotated = origW + gap;

      let bestRow = -1;
      let bestX = 0;
      let bestW = 0;
      let bestH = 0;
      let bestRotated = false;
      let bestWaste = Infinity;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (row.width + wNormal <= targetWidth && hNormal <= row.height * 1.15) {
          const waste = row.height - hNormal;
          if (waste < bestWaste) {
            bestWaste = waste;
            bestRow = i;
            bestX = row.width;
            bestW = wNormal;
            bestH = hNormal;
            bestRotated = false;
          }
        }

        if (row.width + wRotated <= targetWidth && hRotated <= row.height * 1.15) {
          const waste = row.height - hRotated;
          if (waste < bestWaste) {
            bestWaste = waste;
            bestRow = i;
            bestX = row.width;
            bestW = wRotated;
            bestH = hRotated;
            bestRotated = true;
          }
        }
      }

      if (bestRow >= 0) {
        placed.push({
          island,
          x: bestX,
          y: rows[bestRow].y,
          w: bestW,
          h: bestH,
          rotated: bestRotated,
        });
        rows[bestRow].width += bestW;
      } else {
        const aspectNormal = origW / origH;
        const aspectRotated = origH / origW;

        const fitsNormal = wNormal <= targetWidth;
        const fitsRotated = wRotated <= targetWidth;

        let useRotation = false;
        if (fitsNormal && fitsRotated) {
          useRotation = aspectRotated > aspectNormal;
        } else if (fitsRotated && !fitsNormal) {
          useRotation = true;
        }

        const finalW = useRotation ? wRotated : wNormal;
        const finalH = useRotation ? hRotated : hNormal;

        const newRowY = rows.length > 0
          ? rows[rows.length - 1].y + rows[rows.length - 1].height
          : gap;
        rows.push({
          y: newRowY,
          height: finalH,
          width: gap + finalW,
        });
        placed.push({
          island,
          x: gap,
          y: newRowY,
          w: finalW,
          h: finalH,
          rotated: useRotation,
        });
      }
    }

    let totalWidth = 0;
    for (const row of rows) {
      totalWidth = Math.max(totalWidth, row.width);
    }
    const totalHeight = rows.length > 0
      ? rows[rows.length - 1].y + rows[rows.length - 1].height + gap
      : 1;

    const maxDim = Math.max(totalWidth, totalHeight);
    const scale = 1 / maxDim;
    const padScale = padding;

    const finalScale = scale * (1 - padScale * 2);
    const offsetX = (1 - totalWidth * finalScale) / 2;
    const offsetY = (1 - totalHeight * finalScale) / 2;

    for (const p of placed) {
      const uv = p.island.geometry.attributes.uv;
      if (!uv) continue;

      const islandW = p.island.bounds.maxU - p.island.bounds.minU;
      const islandH = p.island.bounds.maxV - p.island.bounds.minV;

      for (let i = 0; i < uv.count; i++) {
        const uNorm = (uv.getX(i) - p.island.bounds.minU) / islandW;
        const vNorm = (uv.getY(i) - p.island.bounds.minV) / islandH;

        let finalU: number, finalV: number;
        if (p.rotated) {
          finalU = offsetX + (p.x + vNorm * islandH) * finalScale;
          finalV = offsetY + (p.y + (1 - uNorm) * islandW) * finalScale;
        } else {
          finalU = offsetX + (p.x + uNorm * islandW) * finalScale;
          finalV = offsetY + (p.y + vNorm * islandH) * finalScale;
        }

        uv.setX(i, finalU);
        uv.setY(i, finalV);
      }
      uv.needsUpdate = true;
    }

    return placed.map((p) => p.island);
  }

  static createCheckerboardTexture(size: number = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const tileSize = size / 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#333333';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
  }

  static createSeamHighlightTexture(size: number = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(0.5, '#cc2222');
    gradient.addColorStop(1, '#881111');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size / 6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SEAM', size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;

    return texture;
  }

  static generateUVPreview(
    islands: UVIsland[],
    size: number = 512,
    options: {
      showSeams?: boolean;
      showLabels?: boolean;
      highlightIslandIndex?: number | null;
    } = {}
  ): HTMLCanvasElement {
    const { showSeams = false, showLabels = false, highlightIslandIndex = null } = options;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    const gridSize = size / 10;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(size, i * gridSize);
      ctx.stroke();
    }

    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#e67e22', '#34495e', '#d35400', '#16a085',
      '#8e44ad', '#27ae60', '#2980b9', '#f1c40f', '#c0392b',
    ];

    islands.forEach((island, idx) => {
      const geo = island.geometry;
      const uv = geo.attributes.uv;
      if (!uv) return;

      const isHighlighted = highlightIslandIndex === idx;
      const baseColor = colors[idx % colors.length];
      const fillAlpha = isHighlighted ? '80' : '40';
      const strokeWidth = isHighlighted ? 3 : 1.5;

      ctx.fillStyle = baseColor + fillAlpha;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = strokeWidth;

      const triangles = geo.index ? geo.index.count / 3 : uv.count / 3;
      for (let t = 0; t < triangles; t++) {
        let i0, i1, i2;
        if (geo.index) {
          i0 = geo.index.getX(t * 3);
          i1 = geo.index.getX(t * 3 + 1);
          i2 = geo.index.getX(t * 3 + 2);
        } else {
          i0 = t * 3;
          i1 = t * 3 + 1;
          i2 = t * 3 + 2;
        }

        const u0 = uv.getX(i0) * size;
        const v0 = (1 - uv.getY(i0)) * size;
        const u1 = uv.getX(i1) * size;
        const v1 = (1 - uv.getY(i1)) * size;
        const u2 = uv.getX(i2) * size;
        const v2 = (1 - uv.getY(i2)) * size;

        ctx.beginPath();
        ctx.moveTo(u0, v0);
        ctx.lineTo(u1, v1);
        ctx.lineTo(u2, v2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      if (showSeams && island.seams) {
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        for (const seam of island.seams) {
          const su0 = seam.uvStartU * size;
          const sv0 = (1 - seam.uvStartV) * size;
          const su1 = seam.uvEndU * size;
          const sv1 = (1 - seam.uvEndV) * size;
          ctx.beginPath();
          ctx.moveTo(su0, sv0);
          ctx.lineTo(su1, sv1);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      if (showLabels) {
        let centroidU = 0, centroidV = 0, count = 0;
        for (let i = 0; i < uv.count; i++) {
          centroidU += uv.getX(i);
          centroidV += uv.getY(i);
          count++;
        }
        if (count > 0) {
          centroidU /= count;
          centroidV /= count;
          const lx = centroidU * size;
          const ly = (1 - centroidV) * size;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          const label = island.name;
          ctx.font = `${Math.max(10, size / 50)}px monospace`;
          const metrics = ctx.measureText(label);
          const padX = 4;
          const padY = 2;
          ctx.fillRect(
            lx - metrics.width / 2 - padX,
            ly - 8 - padY,
            metrics.width + padX * 2,
            16 + padY * 2
          );
          ctx.fillStyle = baseColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, lx, ly);
        }
      }
    });

    return canvas;
  }

  static collectAllSeams3D(islands: UVIsland[]): THREE.Vector3[][] {
    const lines: THREE.Vector3[][] = [];
    for (const island of islands) {
      if (island.seams) {
        for (const seam of island.seams) {
          lines.push([
            new THREE.Vector3(...seam.start),
            new THREE.Vector3(...seam.end),
          ]);
        }
      }
    }
    return lines;
  }

  static buildSeamLineSegments(islands: UVIsland[]): THREE.BufferGeometry | null {
    const allLines: number[] = [];
    for (const island of islands) {
      if (!island.seams) continue;
      for (const seam of island.seams) {
        allLines.push(
          seam.start[0], seam.start[1], seam.start[2],
          seam.end[0], seam.end[1], seam.end[2]
        );
      }
    }
    if (allLines.length === 0) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(allLines, 3));
    return geometry;
  }
}
