import * as THREE from 'three';
import { WallStyle, WALL_STYLE_PRESETS } from '@/types/castle';

export class MaterialFactory {
  private static stoneTextures: Map<WallStyle, THREE.CanvasTexture> = new Map();
  private static woodTexture: THREE.CanvasTexture | null = null;
  private static waterTexture: THREE.CanvasTexture | null = null;
  private static roofTexture: THREE.CanvasTexture | null = null;
  private static checkerboardTexture: THREE.Texture | null = null;
  private static seamTexture: THREE.Texture | null = null;

  static getStoneMaterial(wireframe: boolean = false, style: WallStyle = 'medieval'): THREE.MeshStandardMaterial {
    if (!this.stoneTextures.has(style)) {
      const preset = WALL_STYLE_PRESETS[style];
      this.stoneTextures.set(style, this.createStoneTexture(
        preset.stoneColorLight,
        preset.stoneColorDark,
        preset.mortarColor,
        style
      ));
    }
    const preset = WALL_STYLE_PRESETS[style];
    return new THREE.MeshStandardMaterial({
      map: this.stoneTextures.get(style)!,
      color: new THREE.Color(preset.stoneColor),
      roughness: preset.roughness,
      metalness: 0.05,
      wireframe,
    });
  }

  static getWoodMaterial(wireframe: boolean = false): THREE.MeshStandardMaterial {
    if (!this.woodTexture) {
      this.woodTexture = this.createWoodTexture();
    }
    return new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      color: 0x8b4513,
      roughness: 0.7,
      metalness: 0.1,
      wireframe,
    });
  }

  static getWaterMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });
  }

  static getRoofMaterial(wireframe: boolean = false): THREE.MeshStandardMaterial {
    if (!this.roofTexture) {
      this.roofTexture = this.createRoofTexture();
    }
    return new THREE.MeshStandardMaterial({
      map: this.roofTexture,
      color: 0x8b2500,
      roughness: 0.9,
      metalness: 0.0,
      wireframe,
    });
  }

  static getGroundMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x3d5c3d,
      roughness: 1.0,
      metalness: 0.0,
    });
  }

  static getCheckerboardMaterial(): THREE.MeshBasicMaterial {
    if (!this.checkerboardTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      const tileSize = 64;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#333333';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
      this.checkerboardTexture = new THREE.CanvasTexture(canvas);
      this.checkerboardTexture.wrapS = THREE.RepeatWrapping;
      this.checkerboardTexture.wrapT = THREE.RepeatWrapping;
    }
    return new THREE.MeshBasicMaterial({
      map: this.checkerboardTexture,
      side: THREE.DoubleSide,
    });
  }

  static getWireframeMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
  }

  static getSeamLineMaterial(): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
      color: 0xff00ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
  }

  static getSeamVertexMaterial(): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      color: 0xffff00,
      size: 0.15,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
  }

  static getSeamOverlayMaterial(): THREE.MeshBasicMaterial {
    if (!this.seamTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(255, 0, 255, 0.4)');
      gradient.addColorStop(0.7, 'rgba(255, 100, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 150, 255, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
      ctx.lineWidth = 4;
      for (let i = 0; i < 256; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
      }
      this.seamTexture = new THREE.CanvasTexture(canvas);
      this.seamTexture.wrapS = THREE.RepeatWrapping;
      this.seamTexture.wrapT = THREE.RepeatWrapping;
    }
    return new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.seamTexture,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  private static createStoneTexture(
    lightColor: string,
    darkColor: string,
    mortarColor: string,
    style: WallStyle
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(1, darkColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const speckCount = style === 'roman' || style === 'renaissance' ? 1000 : 2000;
    for (let i = 0; i < speckCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.3;
      ctx.fillStyle = `rgba(30, 20, 10, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const mortarR = parseInt(mortarColor.slice(1, 3), 16);
    const mortarG = parseInt(mortarColor.slice(3, 5), 16);
    const mortarB = parseInt(mortarColor.slice(5, 7), 16);

    const stoneHeight = style === 'roman' ? 48 : style === 'gothic' ? 56 : 64;
    const stoneWidth = style === 'roman' ? 96 : style === 'gothic' ? 72 : 64;

    for (let y = 0; y < 512; y += stoneHeight) {
      ctx.strokeStyle = `rgba(${mortarR}, ${mortarG}, ${mortarB}, 0.5)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
      }
      ctx.stroke();
    }

    let row = 0;
    for (let y = 0; y < 512; y += stoneHeight) {
      const offset = row % 2 === 0 ? 0 : stoneWidth / 2;
      for (let x = -stoneWidth + offset; x < 512 + stoneWidth; x += stoneWidth) {
        ctx.strokeStyle = `rgba(${mortarR}, ${mortarG}, ${mortarB}, 0.4)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 2, y + stoneHeight);
        ctx.stroke();
      }
      row++;
    }

    if (style === 'gothic') {
      for (let i = 0; i < 8; i++) {
        const cx = 32 + Math.random() * 448;
        const cy = 32 + Math.random() * 448;
        ctx.fillStyle = `rgba(${mortarR}, ${mortarG}, ${mortarB}, 0.15)`;
        ctx.beginPath();
        ctx.arc(cx, cy, 12 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (style === 'roman') {
      ctx.strokeStyle = `rgba(${mortarR}, ${mortarG}, ${mortarB}, 0.3)`;
      ctx.lineWidth = 1;
      for (let y = 0; y < 512; y += stoneHeight) {
        for (let x = 0; x < 512; x += stoneWidth / 2) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + stoneHeight);
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private static createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, '#6b4423');
    gradient.addColorStop(0.5, '#8b5a2b');
    gradient.addColorStop(1, '#6b4423');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 50; i++) {
      const y = Math.random() * 512;
      const height = Math.random() * 4 + 1;
      const alpha = Math.random() * 0.3 + 0.1;
      ctx.fillStyle = `rgba(60, 30, 10, ${alpha})`;
      ctx.fillRect(0, y, 512, height);
    }

    for (let i = 0; i < 100; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = 'rgba(80, 40, 10, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 10) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 2);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private static createRoofTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#8b2500';
    ctx.fillRect(0, 0, 256, 256);

    const tileHeight = 32;
    for (let y = 0; y < 256; y += tileHeight) {
      for (let x = (y / tileHeight) % 2 === 0 ? 0 : -16; x < 256; x += 32) {
        const gradient = ctx.createLinearGradient(x, y, x, y + tileHeight);
        gradient.addColorStop(0, '#a03000');
        gradient.addColorStop(0.5, '#8b2500');
        gradient.addColorStop(1, '#5c1a00');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y + 1, 30, tileHeight - 2);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, 30, tileHeight - 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
}
