import * as THREE from 'three';

export interface UVIsland {
  geometry: THREE.BufferGeometry;
  name: string;
  bounds: { minU: number; maxU: number; minV: number; maxV: number };
}

export class UVUnwrapper {
  static unwrapGeometry(
    geometry: THREE.BufferGeometry,
    name: string = 'mesh'
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

    for (let i = 0; i < pos.count; i++) {
      const nx = norm?.getX(i) || 0;
      const ny = norm?.getY(i) || 0;
      const nz = norm?.getZ(i) || 0;
      const absNx = Math.abs(nx);
      const absNy = Math.abs(ny);
      const absNz = Math.abs(nz);

      let u: number, v: number;

      if (absNy >= absNx && absNy >= absNz) {
        u = pos.getX(i);
        v = pos.getZ(i);
      } else if (absNx >= absNz) {
        u = pos.getZ(i);
        v = pos.getY(i);
      } else {
        u = pos.getX(i);
        v = pos.getY(i);
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

    return {
      geometry,
      name,
      bounds: { minU: 0, maxU: maxU - minU, minV: 0, maxV: maxV - minV },
    };
  }

  static packIslands(islands: UVIsland[], padding: number = 0.02): UVIsland[] {
    if (islands.length === 0) return [];

    const sorted = [...islands].sort((a, b) => {
      const areaA = (a.bounds.maxU - a.bounds.minU) * (a.bounds.maxV - a.bounds.minV);
      const areaB = (b.bounds.maxU - b.bounds.minU) * (b.bounds.maxV - b.bounds.minV);
      return areaB - areaA;
    });

    let maxDim = 0;
    for (const island of islands) {
      maxDim = Math.max(maxDim, island.bounds.maxU - island.bounds.minU);
      maxDim = Math.max(maxDim, island.bounds.maxV - island.bounds.minV);
    }
    const gap = maxDim * padding;

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
        
        if (hNormal <= row.height * 1.2) {
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
        
        if (hRotated <= row.height * 1.2) {
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
        const aspectRatio = origW / origH;
        const useRotation = aspectRatio < 0.5;
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

    const maxTotal = Math.max(totalWidth, totalHeight);
    const scale = 1 / maxTotal;
    const margin = gap * scale;
    
    const finalScale = scale * (1 - margin * 2);
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

  static generateUVPreview(
    geometries: THREE.BufferGeometry[],
    size: number = 512
  ): HTMLCanvasElement {
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

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

    geometries.forEach((geo, idx) => {
      const uv = geo.attributes.uv;
      if (!uv) return;

      ctx.fillStyle = colors[idx % colors.length] + '40';
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = 1.5;

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
    });

    return canvas;
  }
}
