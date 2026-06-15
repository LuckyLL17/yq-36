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

    const rangeU = maxU - minU;
    const rangeV = maxV - minV;
    const maxRange = Math.max(rangeU, rangeV) || 1;

    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = (uvs[i * 2] - minU) / maxRange;
      uvs[i * 2 + 1] = (uvs[i * 2 + 1] - minV) / maxRange;
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;

    return {
      geometry,
      name,
      bounds: { minU: 0, maxU: rangeU / maxRange, minV: 0, maxV: rangeV / maxRange },
    };
  }

  static packIslands(islands: UVIsland[], padding: number = 0.02): UVIsland[] {
    const sorted = [...islands].sort((a, b) => {
      const sizeA = (a.bounds.maxU - a.bounds.minU) * (a.bounds.maxV - a.bounds.minV);
      const sizeB = (b.bounds.maxU - b.bounds.minU) * (b.bounds.maxV - b.bounds.minV);
      return sizeB - sizeA;
    });

    const placed: {
      island: UVIsland;
      x: number;
      y: number;
      w: number;
      h: number;
    }[] = [];

    const rowHeights: number[] = [];
    let currentX = padding;
    let currentY = padding;
    let currentRowHeight = 0;

    for (const island of sorted) {
      const w = island.bounds.maxU - island.bounds.minU + padding;
      const h = island.bounds.maxV - island.bounds.minV + padding;

      if (currentX + w > 1 - padding) {
        currentY += currentRowHeight;
        currentX = padding;
        currentRowHeight = 0;
      }

      placed.push({
        island,
        x: currentX,
        y: currentY,
        w,
        h,
      });

      currentX += w;
      currentRowHeight = Math.max(currentRowHeight, h);
    }

    const totalHeight = currentY + currentRowHeight + padding;
    const scale = Math.min(1, (1 - padding * 2) / Math.max(totalHeight, 1));

    for (const p of placed) {
      const uv = p.island.geometry.attributes.uv;
      if (!uv) continue;

      const w = p.island.bounds.maxU - p.island.bounds.minU;
      const h = p.island.bounds.maxV - p.island.bounds.minV;

      for (let i = 0; i < uv.count; i++) {
        const u = (uv.getX(i) - p.island.bounds.minU) / w;
        const v = (uv.getY(i) - p.island.bounds.minV) / h;

        uv.setX(i, p.x * scale + u * w * scale);
        uv.setY(i, p.y * scale + v * h * scale);
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
