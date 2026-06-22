import * as THREE from 'three';
import { WallStyle, WALL_STYLE_PRESETS, MaterialParams } from '@/types/castle';

export class MaterialFactory {
  private static stoneTextures: Map<string, THREE.CanvasTexture> = new Map();
  private static woodTextures: Map<string, THREE.CanvasTexture> = new Map();
  private static waterTextures: Map<string, THREE.CanvasTexture> = new Map();
  private static waterNormalMaps: Map<string, THREE.CanvasTexture> = new Map();
  private static roofTexture: THREE.CanvasTexture | null = null;
  private static groundTextures: Map<string, THREE.CanvasTexture> = new Map();
  private static checkerboardTexture: THREE.Texture | null = null;
  private static seamTexture: THREE.Texture | null = null;

  static getStoneMaterial(wireframe: boolean = false, style: WallStyle = 'medieval', materialParams?: MaterialParams): THREE.MeshStandardMaterial {
    const params = materialParams || { agingLevel: 0.5, mossCoverage: 0.3, stoneCrackLevel: 0.4, stoneStainLevel: 0.3, woodGrainLevel: 0.6, woodRingLevel: 0.5, waterRippleLevel: 0.5, waterClarity: 0.7 };
    const textureKey = `${style}_${params.agingLevel.toFixed(2)}_${params.mossCoverage.toFixed(2)}_${params.stoneCrackLevel.toFixed(2)}_${params.stoneStainLevel.toFixed(2)}`;
    
    if (!this.stoneTextures.has(textureKey)) {
      const preset = WALL_STYLE_PRESETS[style];
      this.stoneTextures.set(textureKey, this.createStoneTexture(
        preset.stoneColorLight,
        preset.stoneColorDark,
        preset.mortarColor,
        style,
        params
      ));
    }
    const preset = WALL_STYLE_PRESETS[style];
    const agedRoughness = Math.min(1, preset.roughness + params.agingLevel * 0.15);
    return new THREE.MeshStandardMaterial({
      map: this.stoneTextures.get(textureKey)!,
      color: new THREE.Color(preset.stoneColor),
      roughness: agedRoughness,
      metalness: 0.05,
      wireframe,
    });
  }

  static getWoodMaterial(wireframe: boolean = false, materialParams?: MaterialParams): THREE.MeshStandardMaterial {
    const params = materialParams || { agingLevel: 0.5, mossCoverage: 0.3, stoneCrackLevel: 0.4, stoneStainLevel: 0.3, woodGrainLevel: 0.6, woodRingLevel: 0.5, waterRippleLevel: 0.5, waterClarity: 0.7 };
    const textureKey = `${params.agingLevel.toFixed(2)}_${params.woodGrainLevel.toFixed(2)}_${params.woodRingLevel.toFixed(2)}`;
    
    if (!this.woodTextures.has(textureKey)) {
      this.woodTextures.set(textureKey, this.createWoodTexture(params));
    }
    const agedRoughness = Math.min(1, 0.7 + params.agingLevel * 0.2);
    return new THREE.MeshStandardMaterial({
      map: this.woodTextures.get(textureKey)!,
      color: 0x8b4513,
      roughness: agedRoughness,
      metalness: 0.1,
      wireframe,
    });
  }

  static getWaterMaterial(materialParams?: MaterialParams): THREE.MeshStandardMaterial {
    const params = materialParams || { agingLevel: 0.5, mossCoverage: 0.3, stoneCrackLevel: 0.4, stoneStainLevel: 0.3, woodGrainLevel: 0.6, woodRingLevel: 0.5, waterRippleLevel: 0.5, waterClarity: 0.7 };
    const textureKey = `${params.waterRippleLevel.toFixed(2)}_${params.waterClarity.toFixed(2)}`;
    
    if (!this.waterTextures.has(textureKey)) {
      this.waterTextures.set(textureKey, this.createWaterTexture(params));
      this.waterNormalMaps.set(textureKey, this.createWaterNormalMap(params));
    }
    
    const opacity = 0.5 + params.waterClarity * 0.4;
    return new THREE.MeshStandardMaterial({
      map: this.waterTextures.get(textureKey)!,
      normalMap: this.waterNormalMaps.get(textureKey)!,
      normalScale: new THREE.Vector2(params.waterRippleLevel * 0.5, params.waterRippleLevel * 0.5),
      color: 0x1e3a5f,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: opacity,
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

  static getGroundMaterial(materialParams?: MaterialParams): THREE.MeshStandardMaterial {
    const params = materialParams || { agingLevel: 0.5, mossCoverage: 0.3, stoneCrackLevel: 0.4, stoneStainLevel: 0.3, woodGrainLevel: 0.6, woodRingLevel: 0.5, waterRippleLevel: 0.5, waterClarity: 0.7 };
    const textureKey = `${params.agingLevel.toFixed(2)}_${params.mossCoverage.toFixed(2)}`;
    
    if (!this.groundTextures.has(textureKey)) {
      this.groundTextures.set(textureKey, this.createGroundTexture(params));
    }
    
    return new THREE.MeshStandardMaterial({
      map: this.groundTextures.get(textureKey)!,
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
    style: WallStyle,
    params: MaterialParams
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const lightR = parseInt(lightColor.slice(1, 3), 16);
    const lightG = parseInt(lightColor.slice(3, 5), 16);
    const lightB = parseInt(lightColor.slice(5, 7), 16);
    const darkR = parseInt(darkColor.slice(1, 3), 16);
    const darkG = parseInt(darkColor.slice(3, 5), 16);
    const darkB = parseInt(darkColor.slice(5, 7), 16);

    const agingFactor = params.agingLevel;
    const agedLightR = Math.floor(lightR * (1 - agingFactor * 0.3));
    const agedLightG = Math.floor(lightG * (1 - agingFactor * 0.25));
    const agedLightB = Math.floor(lightB * (1 - agingFactor * 0.2));
    const agedDarkR = Math.floor(darkR * (1 - agingFactor * 0.25));
    const agedDarkG = Math.floor(darkG * (1 - agingFactor * 0.2));
    const agedDarkB = Math.floor(darkB * (1 - agingFactor * 0.15));

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, `rgb(${agedLightR}, ${agedLightG}, ${agedLightB})`);
    gradient.addColorStop(1, `rgb(${agedDarkR}, ${agedDarkG}, ${agedDarkB})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const speckCount = style === 'roman' || style === 'renaissance' ? 1000 : 2000;
    for (let i = 0; i < speckCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.3 * (1 + agingFactor * 0.5);
      ctx.fillStyle = `rgba(30, 20, 10, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (params.stoneStainLevel > 0) {
      const stainCount = Math.floor(15 * params.stoneStainLevel * (1 + agingFactor));
      for (let i = 0; i < stainCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 15 + Math.random() * 40 * params.stoneStainLevel;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const stainAlpha = 0.15 + Math.random() * 0.25 * params.stoneStainLevel;
        gradient.addColorStop(0, `rgba(40, 30, 20, ${stainAlpha})`);
        gradient.addColorStop(0.5, `rgba(30, 25, 15, ${stainAlpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(30, 25, 15, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    }

    if (params.stoneCrackLevel > 0) {
      const crackCount = Math.floor(8 * params.stoneCrackLevel * (1 + agingFactor * 0.5));
      for (let i = 0; i < crackCount; i++) {
        const startX = Math.random() * 512;
        const startY = Math.random() * 512;
        const length = 30 + Math.random() * 100 * params.stoneCrackLevel;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.strokeStyle = `rgba(20, 15, 10, ${0.4 + params.stoneCrackLevel * 0.3})`;
        ctx.lineWidth = 1 + Math.random() * 2 * params.stoneCrackLevel;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        let currentX = startX;
        let currentY = startY;
        const segments = 5 + Math.floor(Math.random() * 5);
        for (let j = 0; j < segments; j++) {
          const t = (j + 1) / segments;
          const branchAngle = angle + (Math.random() - 0.5) * 1.5;
          const segmentLength = (length / segments) * (0.5 + Math.random());
          currentX += Math.cos(branchAngle) * segmentLength;
          currentY += Math.sin(branchAngle) * segmentLength;
          ctx.lineTo(currentX, currentY);
          
          if (Math.random() < 0.3 * params.stoneCrackLevel && j < segments - 1) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            const subLength = segmentLength * (0.3 + Math.random() * 0.4);
            const subAngle = branchAngle + (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.8);
            ctx.lineTo(
              currentX + Math.cos(subAngle) * subLength,
              currentY + Math.sin(subAngle) * subLength
            );
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
          }
        }
        ctx.stroke();
      }
    }

    const mortarR = parseInt(mortarColor.slice(1, 3), 16);
    const mortarG = parseInt(mortarColor.slice(3, 5), 16);
    const mortarB = parseInt(mortarColor.slice(5, 7), 16);

    const agedMortarR = Math.floor(mortarR * (1 - agingFactor * 0.35));
    const agedMortarG = Math.floor(mortarG * (1 - agingFactor * 0.3));
    const agedMortarB = Math.floor(mortarB * (1 - agingFactor * 0.25));

    const stoneHeight = style === 'roman' ? 48 : style === 'gothic' ? 56 : 64;
    const stoneWidth = style === 'roman' ? 96 : style === 'gothic' ? 72 : 64;

    for (let y = 0; y < 512; y += stoneHeight) {
      ctx.strokeStyle = `rgba(${agedMortarR}, ${agedMortarG}, ${agedMortarB}, ${0.5 + agingFactor * 0.2})`;
      ctx.lineWidth = 3 + agingFactor * 2;
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
        ctx.strokeStyle = `rgba(${agedMortarR}, ${agedMortarG}, ${agedMortarB}, ${0.4 + agingFactor * 0.2})`;
        ctx.lineWidth = 2 + agingFactor * 1.5;
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
        ctx.fillStyle = `rgba(${agedMortarR}, ${agedMortarG}, ${agedMortarB}, 0.15)`;
        ctx.beginPath();
        ctx.arc(cx, cy, 12 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (style === 'roman') {
      ctx.strokeStyle = `rgba(${agedMortarR}, ${agedMortarG}, ${agedMortarB}, 0.3)`;
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

    if (params.mossCoverage > 0) {
      const mossCount = Math.floor(30 * params.mossCoverage * (1 + agingFactor * 0.5));
      for (let i = 0; i < mossCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 8 + Math.random() * 25 * params.mossCoverage;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const mossAlpha = 0.2 + Math.random() * 0.3 * params.mossCoverage;
        const mossGreen = 80 + Math.random() * 60;
        gradient.addColorStop(0, `rgba(${30 + Math.random() * 20}, ${mossGreen}, ${20 + Math.random() * 20}, ${mossAlpha})`);
        gradient.addColorStop(0.6, `rgba(${20 + Math.random() * 20}, ${mossGreen - 20}, ${15 + Math.random() * 15}, ${mossAlpha * 0.6})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        
        for (let j = 0; j < 5; j++) {
          const dotX = x + (Math.random() - 0.5) * radius * 1.5;
          const dotY = y + (Math.random() - 0.5) * radius * 1.5;
          const dotSize = 1 + Math.random() * 3;
          ctx.fillStyle = `rgba(${40 + Math.random() * 30}, ${100 + Math.random() * 50}, ${30 + Math.random() * 20}, ${0.3 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private static createWoodTexture(params: MaterialParams): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const agingFactor = params.agingLevel;
    const baseR = Math.floor(107 * (1 - agingFactor * 0.3));
    const baseG = Math.floor(68 * (1 - agingFactor * 0.25));
    const baseB = Math.floor(35 * (1 - agingFactor * 0.2));
    const midR = Math.floor(139 * (1 - agingFactor * 0.25));
    const midG = Math.floor(90 * (1 - agingFactor * 0.2));
    const midB = Math.floor(43 * (1 - agingFactor * 0.15));

    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, `rgb(${baseR}, ${baseG}, ${baseB})`);
    gradient.addColorStop(0.5, `rgb(${midR}, ${midG}, ${midB})`);
    gradient.addColorStop(1, `rgb(${baseR}, ${baseG}, ${baseB})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    if (params.woodRingLevel > 0) {
      const ringCount = Math.floor(8 + 12 * params.woodRingLevel);
      const centerX = 256 + (Math.random() - 0.5) * 100;
      const centerY = 256 + (Math.random() - 0.5) * 100;
      
      for (let i = 0; i < ringCount; i++) {
        const radius = 20 + i * (35 + Math.random() * 15) * params.woodRingLevel;
        const alpha = 0.08 + Math.random() * 0.12 * params.woodRingLevel;
        const ringWidth = 3 + Math.random() * 5 * params.woodRingLevel;
        
        const ringGradient = ctx.createRadialGradient(centerX, centerY, radius - ringWidth, centerX, centerY, radius + ringWidth);
        ringGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        ringGradient.addColorStop(0.5, `rgba(50, 25, 10, ${alpha})`);
        ringGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
        
        ctx.fillStyle = ringGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + ringWidth, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, radius - ringWidth, 0, Math.PI * 2, true);
        ctx.fill();
      }
    }

    if (params.woodGrainLevel > 0) {
      const grainLineCount = Math.floor(60 * params.woodGrainLevel);
      for (let i = 0; i < grainLineCount; i++) {
        const y = Math.random() * 512;
        const height = Math.random() * 4 + 1;
        const alpha = (Math.random() * 0.25 + 0.1) * params.woodGrainLevel * (1 + agingFactor * 0.3);
        const darkness = 40 + Math.random() * 30;
        ctx.fillStyle = `rgba(${darkness}, ${darkness * 0.5}, ${darkness * 0.2}, ${alpha})`;
        ctx.fillRect(0, y, 512, height);
      }

      const wavyLineCount = Math.floor(120 * params.woodGrainLevel);
      for (let i = 0; i < wavyLineCount; i++) {
        const y = Math.random() * 512;
        const darkness = 50 + Math.random() * 30;
        ctx.strokeStyle = `rgba(${darkness}, ${darkness * 0.5}, ${darkness * 0.2}, ${0.15 + Math.random() * 0.2 * params.woodGrainLevel})`;
        ctx.lineWidth = 0.5 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 512; x += 8) {
          ctx.lineTo(x, y + (Math.random() - 0.5) * (2 + params.woodGrainLevel * 2));
        }
        ctx.stroke();
      }

      const knotCount = Math.floor(3 + 5 * params.woodGrainLevel);
      for (let i = 0; i < knotCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 5 + Math.random() * 15 * params.woodGrainLevel;
        
        const knotGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        knotGradient.addColorStop(0, `rgba(30, 15, 5, ${0.6 + Math.random() * 0.3})`);
        knotGradient.addColorStop(0.4, `rgba(50, 25, 10, ${0.4 + Math.random() * 0.2})`);
        knotGradient.addColorStop(0.7, `rgba(70, 35, 15, ${0.2})`);
        knotGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = knotGradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        const swirlCount = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < swirlCount; j++) {
          const swirlAngle = Math.random() * Math.PI * 2;
          const swirlRadius = size * (0.3 + Math.random() * 0.5);
          ctx.strokeStyle = `rgba(40, 20, 8, ${0.3 + Math.random() * 0.3})`;
          ctx.lineWidth = 0.5 + Math.random() * 1;
          ctx.beginPath();
          for (let a = 0; a < Math.PI * 1.5; a += 0.2) {
            const r = swirlRadius * (1 - a / (Math.PI * 2));
            const px = x + Math.cos(a + swirlAngle) * r;
            const py = y + Math.sin(a + swirlAngle) * r;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }
    }

    if (params.mossCoverage > 0.3) {
      const mossCount = Math.floor(10 * (params.mossCoverage - 0.3) * 2);
      for (let i = 0; i < mossCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 5 + Math.random() * 15 * params.mossCoverage;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const mossAlpha = 0.15 + Math.random() * 0.2 * params.mossCoverage;
        gradient.addColorStop(0, `rgba(50, 90, 40, ${mossAlpha})`);
        gradient.addColorStop(0.7, `rgba(40, 70, 30, ${mossAlpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
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

  private static createWaterTexture(params: MaterialParams): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const clarity = params.waterClarity;
    const baseR = Math.floor(30 + (1 - clarity) * 20);
    const baseG = Math.floor(58 + (1 - clarity) * 20);
    const baseB = Math.floor(95 + (1 - clarity) * 15);

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 300);
    gradient.addColorStop(0, `rgb(${baseR + 10}, ${baseG + 15}, ${baseB + 20})`);
    gradient.addColorStop(0.5, `rgb(${baseR}, ${baseG}, ${baseB})`);
    gradient.addColorStop(1, `rgb(${baseR - 10}, ${baseG - 10}, ${baseB - 10})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    if (params.waterRippleLevel > 0) {
      const rippleCount = Math.floor(8 + 15 * params.waterRippleLevel);
      for (let i = 0; i < rippleCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const maxRadius = 30 + Math.random() * 80 * params.waterRippleLevel;
        const ringCount = 2 + Math.floor(Math.random() * 4 * params.waterRippleLevel);
        
        for (let r = 0; r < ringCount; r++) {
          const radius = (maxRadius / ringCount) * (r + 1);
          const alpha = (0.05 + Math.random() * 0.1) * params.waterRippleLevel * (1 - r / ringCount);
          const lineWidth = 0.5 + Math.random() * 1.5;
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const waveLineCount = Math.floor(15 + 25 * params.waterRippleLevel);
      for (let i = 0; i < waveLineCount; i++) {
        const y = Math.random() * 512;
        const alpha = (0.03 + Math.random() * 0.08) * params.waterRippleLevel;
        const waveAmplitude = 3 + Math.random() * 8 * params.waterRippleLevel;
        const waveFrequency = 0.02 + Math.random() * 0.03;
        
        ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.lineWidth = 0.5 + Math.random() * 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 512; x += 5) {
          const offsetY = Math.sin(x * waveFrequency + y * 0.1) * waveAmplitude;
          ctx.lineTo(x, y + offsetY);
        }
        ctx.stroke();
      }

      const highlightCount = Math.floor(20 + 30 * params.waterRippleLevel);
      for (let i = 0; i < highlightCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 1 + Math.random() * 3 * params.waterRippleLevel;
        const alpha = (0.1 + Math.random() * 0.3) * params.waterRippleLevel;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private static createWaterNormalMap(params: MaterialParams): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(256, 256);
    const data = imageData.data;

    const rippleScale = params.waterRippleLevel;
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const idx = (y * 256 + x) * 4;
        
        const noise1 = Math.sin(x * 0.08 * rippleScale) * Math.cos(y * 0.08 * rippleScale) * rippleScale;
        const noise2 = Math.sin(x * 0.15 * rippleScale + 1) * Math.cos(y * 0.12 * rippleScale + 0.5) * rippleScale * 0.5;
        const noise3 = Math.sin(x * 0.03 * rippleScale + y * 0.05 * rippleScale) * rippleScale * 0.3;
        
        const height = noise1 + noise2 + noise3;
        
        const dx = (Math.cos(x * 0.08 * rippleScale) * Math.cos(y * 0.08 * rippleScale) * 0.08 * rippleScale +
                    Math.cos(x * 0.15 * rippleScale + 1) * Math.cos(y * 0.12 * rippleScale + 0.5) * 0.15 * rippleScale * 0.5 +
                    Math.cos(x * 0.03 * rippleScale + y * 0.05 * rippleScale) * 0.03 * rippleScale * 0.3);
        
        const dy = (-Math.sin(x * 0.08 * rippleScale) * Math.sin(y * 0.08 * rippleScale) * 0.08 * rippleScale +
                    -Math.sin(x * 0.15 * rippleScale + 1) * Math.sin(y * 0.12 * rippleScale + 0.5) * 0.12 * rippleScale * 0.5 +
                    Math.sin(x * 0.03 * rippleScale + y * 0.05 * rippleScale) * 0.05 * rippleScale * 0.3);
        
        const nx = -dx * 50;
        const ny = -dy * 50;
        const nz = 1.0;
        
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        data[idx] = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private static createGroundTexture(params: MaterialParams): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const agingFactor = params.agingLevel;
    const baseR = Math.floor(61 * (1 - agingFactor * 0.2));
    const baseG = Math.floor(92 * (1 - agingFactor * 0.15));
    const baseB = Math.floor(61 * (1 - agingFactor * 0.1));

    ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    ctx.fillRect(0, 0, 512, 512);

    const colorVariationCount = 500;
    for (let i = 0; i < colorVariationCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 5 + Math.random() * 20;
      const variation = (Math.random() - 0.5) * 30;
      const r = Math.max(0, Math.min(255, baseR + variation));
      const g = Math.max(0, Math.min(255, baseG + variation * 0.8));
      const b = Math.max(0, Math.min(255, baseB + variation * 0.6));
      const alpha = 0.1 + Math.random() * 0.2;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    if (params.mossCoverage > 0) {
      const mossPatchCount = Math.floor(40 * params.mossCoverage * (1 + agingFactor * 0.3));
      for (let i = 0; i < mossPatchCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 15 + Math.random() * 50 * params.mossCoverage;
        const mossGreen = 60 + Math.random() * 80;
        const mossR = 30 + Math.random() * 30;
        const mossB = 20 + Math.random() * 25;
        const alpha = 0.2 + Math.random() * 0.4 * params.mossCoverage;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(${mossR}, ${mossGreen}, ${mossB}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${mossR - 10}, ${mossGreen - 15}, ${mossB - 10}, ${alpha * 0.6})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
      }

      const mossClumpCount = Math.floor(80 * params.mossCoverage);
      for (let i = 0; i < mossClumpCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const clumpSize = 2 + Math.random() * 6 * params.mossCoverage;
        const mossGreen = 80 + Math.random() * 60;
        const alpha = 0.4 + Math.random() * 0.4;
        
        ctx.fillStyle = `rgba(${40 + Math.random() * 20}, ${mossGreen}, ${30 + Math.random() * 20}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, clumpSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const dirtPatchCount = Math.floor(15 * (1 + agingFactor * 0.5));
    for (let i = 0; i < dirtPatchCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 20 + Math.random() * 40;
      const alpha = 0.1 + Math.random() * 0.2 * (1 + agingFactor * 0.5);
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(80, 60, 40, ${alpha})`);
      gradient.addColorStop(0.6, `rgba(70, 50, 30, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    const pebbleCount = Math.floor(30 + agingFactor * 20);
    for (let i = 0; i < pebbleCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 1 + Math.random() * 4;
      const gray = 80 + Math.random() * 60;
      const alpha = 0.3 + Math.random() * 0.4;
      
      ctx.fillStyle = `rgba(${gray}, ${gray - 10}, ${gray - 15}, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * (0.6 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const grassBladeCount = Math.floor(50 + 50 * (1 - agingFactor * 0.5));
    for (let i = 0; i < grassBladeCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const height = 3 + Math.random() * 8;
      const width = 0.5 + Math.random() * 1;
      const grassGreen = 70 + Math.random() * 60;
      const alpha = 0.5 + Math.random() * 0.3;
      
      ctx.strokeStyle = `rgba(${30 + Math.random() * 20}, ${grassGreen}, ${20 + Math.random() * 20}, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const sway = (Math.random() - 0.5) * 3;
      ctx.quadraticCurveTo(x + sway, y - height / 2, x + sway * 1.5, y - height);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
}
