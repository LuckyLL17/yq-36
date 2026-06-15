import * as THREE from 'three';

export class MaterialFactory {
  private static stoneTexture: THREE.CanvasTexture | null = null;
  private static woodTexture: THREE.CanvasTexture | null = null;
  private static waterTexture: THREE.CanvasTexture | null = null;
  private static roofTexture: THREE.CanvasTexture | null = null;
  private static checkerboardTexture: THREE.Texture | null = null;

  static getStoneMaterial(wireframe: boolean = false): THREE.MeshStandardMaterial {
    if (!this.stoneTexture) {
      this.stoneTexture = this.createStoneTexture();
    }
    return new THREE.MeshStandardMaterial({
      map: this.stoneTexture,
      color: 0x8b7355,
      roughness: 0.85,
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

  private static createStoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#9a8b7a');
    gradient.addColorStop(1, '#6b5b4f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.3;
      ctx.fillStyle = `rgba(50, 40, 30, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let y = 0; y < 512; y += 64) {
      ctx.strokeStyle = 'rgba(40, 30, 20, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 4);
      }
      ctx.stroke();
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
