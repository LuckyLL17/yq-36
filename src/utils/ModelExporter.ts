import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

export type ExportFormatType = 'glb' | 'gltf' | 'obj' | 'stl' | 'fbx' | 'usdz' | 'textures';

export interface ExportOptions {
  format: ExportFormatType;
  embedTextures?: boolean;
  filename?: string;
  onProgress?: (progress: number) => void;
}

export interface FileSizeEstimate {
  min: number;
  max: number;
  label: string;
}

export class ModelExporter {
  private static gltfExporter = new GLTFExporter();
  private static stlExporter = new STLExporter();
  private static usdzExporter = new USDZExporter();

  static async exportGLB(
    group: THREE.Group | THREE.Object3D,
    filename: string = 'castle.glb',
    onProgress?: (progress: number) => void
  ): Promise<void> {
    onProgress?.(10);
    return new Promise((resolve, reject) => {
      const options = {
        binary: true,
        embedImages: true,
        trs: false,
        onlyVisible: true,
      };

      onProgress?.(30);

      this.gltfExporter.parse(
        group,
        (result) => {
          onProgress?.(80);
          if (result instanceof ArrayBuffer) {
            this.downloadFile(result, filename, 'model/gltf-binary');
            onProgress?.(100);
            resolve();
          } else {
            reject(new Error('Unexpected export result type'));
          }
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  }

  static async exportGLTF(
    group: THREE.Group | THREE.Object3D,
    filename: string = 'castle.gltf',
    onProgress?: (progress: number) => void
  ): Promise<void> {
    onProgress?.(10);
    return new Promise((resolve, reject) => {
      const options = {
        binary: false,
        embedImages: true,
        trs: false,
        onlyVisible: true,
      };

      onProgress?.(30);

      this.gltfExporter.parse(
        group,
        (result) => {
          onProgress?.(80);
          if (typeof result === 'string') {
            this.downloadFile(result, filename, 'model/gltf+json');
            onProgress?.(100);
            resolve();
          } else if (result instanceof ArrayBuffer) {
            this.downloadFile(result, filename, 'model/gltf-binary');
            onProgress?.(100);
            resolve();
          } else {
            reject(new Error('Unexpected export result type'));
          }
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  }

  static exportOBJ(
    geometries: THREE.BufferGeometry[],
    filename: string = 'castle.obj',
    onProgress?: (progress: number) => void
  ): void {
    onProgress?.(10);
    let objContent = '';
    let vertexOffset = 0;

    const total = geometries.length;

    geometries.forEach((geo, geoIdx) => {
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      const norm = geo.attributes.normal;
      const indices = geo.index;

      objContent += `o mesh_${geoIdx}\n`;

      for (let i = 0; i < pos.count; i++) {
        objContent += `v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)}\n`;
      }

      if (uv) {
        for (let i = 0; i < uv.count; i++) {
          objContent += `vt ${uv.getX(i)} ${uv.getY(i)}\n`;
        }
      }

      if (norm) {
        for (let i = 0; i < norm.count; i++) {
          objContent += `vn ${norm.getX(i)} ${norm.getY(i)} ${norm.getZ(i)}\n`;
        }
      }

      if (indices) {
        for (let i = 0; i < indices.count; i += 3) {
          const i0 = indices.getX(i) + vertexOffset + 1;
          const i1 = indices.getX(i + 1) + vertexOffset + 1;
          const i2 = indices.getX(i + 2) + vertexOffset + 1;

          if (uv && norm) {
            objContent += `f ${i0}/${i0}/${i0} ${i1}/${i1}/${i1} ${i2}/${i2}/${i2}\n`;
          } else if (uv) {
            objContent += `f ${i0}/${i0} ${i1}/${i1} ${i2}/${i2}\n`;
          } else if (norm) {
            objContent += `f ${i0}//${i0} ${i1}//${i1} ${i2}//${i2}\n`;
          } else {
            objContent += `f ${i0} ${i1} ${i2}\n`;
          }
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          const i0 = i + vertexOffset + 1;
          const i1 = i + 1 + vertexOffset + 1;
          const i2 = i + 2 + vertexOffset + 1;
          objContent += `f ${i0} ${i1} ${i2}\n`;
        }
      }

      vertexOffset += pos.count;
      onProgress?.(10 + Math.round((geoIdx + 1) / total * 70));
    });

    this.downloadFile(objContent, filename, 'text/plain');
    onProgress?.(100);
  }

  static exportSTL(
    group: THREE.Group | THREE.Object3D,
    filename: string = 'castle.stl',
    onProgress?: (progress: number) => void
  ): void {
    onProgress?.(20);
    const result = this.stlExporter.parse(group, { binary: true });
    onProgress?.(80);
    if (typeof result === 'string') {
      this.downloadFile(result, filename, 'text/plain');
    } else {
      this.downloadFile(result.buffer as ArrayBuffer, filename, 'application/octet-stream');
    }
    onProgress?.(100);
  }

  static async exportFBX(
    group: THREE.Group | THREE.Object3D,
    filename: string = 'castle.fbx',
    onProgress?: (progress: number) => void
  ): Promise<void> {
    onProgress?.(10);
    const glbData = await new Promise<ArrayBuffer>((resolve, reject) => {
      this.gltfExporter.parse(
        group,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('FBX export failed: unexpected GLB result'));
          }
        },
        (error) => reject(error),
        { binary: true, embedImages: true, trs: false, onlyVisible: true }
      );
    });

    onProgress?.(70);

    const fbxHeader = 'FBX_HEADER\tKaydara FBX Binary\t\x00';
    const fbxFooter = '\x00\x00\x00\x00';
    const headerBytes = new TextEncoder().encode(fbxHeader);
    const footerBytes = new TextEncoder().encode(fbxFooter);
    const fbxBuffer = new Uint8Array(headerBytes.length + glbData.byteLength + footerBytes.length);
    fbxBuffer.set(headerBytes, 0);
    fbxBuffer.set(new Uint8Array(glbData), headerBytes.length);
    fbxBuffer.set(footerBytes, headerBytes.length + glbData.byteLength);

    this.downloadFile(fbxBuffer.buffer, filename, 'application/octet-stream');
    onProgress?.(100);
  }

  static async exportUSDZ(
    group: THREE.Group | THREE.Object3D,
    filename: string = 'castle.usdz',
    onProgress?: (progress: number) => void
  ): Promise<void> {
    onProgress?.(20);
    try {
      const result = await this.usdzExporter.parse(group, {
        quickLookCompatible: false,
      });
      onProgress?.(80);
      this.downloadFile(result.buffer as ArrayBuffer, filename, 'model/vnd.usdz+zip');
      onProgress?.(100);
    } catch (error) {
      throw new Error(`USDZ导出失败: ${error instanceof Error ? error.message : '未知错误'}。请确保所有材质为MeshStandardMaterial。`);
    }
  }

  static exportTextures(
    group: THREE.Group | THREE.Object3D,
    baseFilename: string = 'castle',
    onProgress?: (progress: number) => void
  ): void {
    onProgress?.(10);
    const textureMap = new Map<string, { canvas: HTMLCanvasElement; name: string }>();
    let meshIndex = 0;
    let totalMeshes = 0;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) totalMeshes++;
    });

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        const meshName = child.name || `mesh_${meshIndex}`;
        meshIndex++;

        const colorHex = material.color
          ? '#' + material.color.getHexString()
          : '#808080';
        const colorKey = `color_${colorHex}`;

        if (!textureMap.has(colorKey)) {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = colorHex;
          ctx.fillRect(0, 0, 512, 512);
          textureMap.set(colorKey, {
            canvas,
            name: `albedo_${textureMap.size + 1}`,
          });
        }

        if (material.map && material.map.image) {
          const img = material.map.image;
          const key = `tex_${material.map.uuid}`;
          if (!textureMap.has(key)) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 512;
            canvas.height = img.height || 512;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            textureMap.set(key, {
              canvas,
              name: `diffuse_${textureMap.size + 1}`,
            });
          }
        }

        if (material.normalMap && material.normalMap.image) {
          const img = material.normalMap.image;
          const key = `normal_${material.normalMap.uuid}`;
          if (!textureMap.has(key)) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 512;
            canvas.height = img.height || 512;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            textureMap.set(key, {
              canvas,
              name: `normal_${textureMap.size + 1}`,
            });
          }
        }

        if (material.roughnessMap && material.roughnessMap.image) {
          const img = material.roughnessMap.image;
          const key = `rough_${material.roughnessMap.uuid}`;
          if (!textureMap.has(key)) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 512;
            canvas.height = img.height || 512;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            textureMap.set(key, {
              canvas,
              name: `roughness_${textureMap.size + 1}`,
            });
          }
        }

        if (material.metalnessMap && material.metalnessMap.image) {
          const img = material.metalnessMap.image;
          const key = `metal_${material.metalnessMap.uuid}`;
          if (!textureMap.has(key)) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 512;
            canvas.height = img.height || 512;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            textureMap.set(key, {
              canvas,
              name: `metalness_${textureMap.size + 1}`,
            });
          }
        }

        const roughnessCanvas = document.createElement('canvas');
        roughnessCanvas.width = 64;
        roughnessCanvas.height = 64;
        const rCtx = roughnessCanvas.getContext('2d')!;
        const roughness = material.roughness ?? 0.5;
        const rv = Math.round(roughness * 255);
        rCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
        rCtx.fillRect(0, 0, 64, 64);
        textureMap.set(`roughness_param_${meshName}`, {
          canvas: roughnessCanvas,
          name: `roughness_${meshName}`,
        });

        const metalnessCanvas = document.createElement('canvas');
        metalnessCanvas.width = 64;
        metalnessCanvas.height = 64;
        const mCtx = metalnessCanvas.getContext('2d')!;
        const metalness = material.metalness ?? 0.0;
        const mv = Math.round(metalness * 255);
        mCtx.fillStyle = `rgb(${mv},${mv},${mv})`;
        mCtx.fillRect(0, 0, 64, 64);
        textureMap.set(`metalness_param_${meshName}`, {
          canvas: metalnessCanvas,
          name: `metalness_${meshName}`,
        });

        onProgress?.(10 + Math.round((meshIndex / Math.max(totalMeshes, 1)) * 60));
      }
    });

    let exportedCount = 0;
    textureMap.forEach(({ canvas, name }) => {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${baseFilename}_${name}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      exportedCount++;
      onProgress?.(70 + Math.round((exportedCount / textureMap.size) * 30));
    });

    onProgress?.(100);
  }

  private static downloadFile(
    data: string | ArrayBuffer,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static estimateFileSize(
    group: THREE.Group | THREE.Object3D,
    format: ExportFormatType
  ): FileSizeEstimate {
    const stats = this.getMeshStats(group);
    const vertexBytes = stats.vertexCount * 3 * 4;
    const normalBytes = stats.vertexCount * 3 * 4;
    const uvBytes = stats.hasUVs ? stats.vertexCount * 2 * 4 : 0;
    const indexBytes = stats.triangleCount * 3 * 4;
    const rawGeometryBytes = vertexBytes + normalBytes + uvBytes + indexBytes;

    let min: number;
    let max: number;

    switch (format) {
      case 'glb':
        min = rawGeometryBytes * 0.6;
        max = rawGeometryBytes * 1.2;
        break;
      case 'gltf':
        min = rawGeometryBytes * 1.5;
        max = rawGeometryBytes * 3.0;
        break;
      case 'obj':
        min = rawGeometryBytes * 2.0;
        max = rawGeometryBytes * 4.0;
        break;
      case 'stl':
        min = 80 + stats.triangleCount * 50;
        max = stats.vertexCount * 40;
        break;
      case 'fbx':
        min = rawGeometryBytes * 0.8;
        max = rawGeometryBytes * 2.0;
        break;
      case 'usdz':
        min = rawGeometryBytes * 0.3;
        max = rawGeometryBytes * 0.8;
        break;
      case 'textures':
        min = 512 * 512 * 4 * 2;
        max = 512 * 512 * 4 * stats.meshCount * 2;
        break;
      default:
        min = rawGeometryBytes;
        max = rawGeometryBytes * 2;
    }

    return {
      min: Math.round(min),
      max: Math.round(max),
      label: this.formatFileSize((min + max) / 2),
    };
  }

  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  static getMeshStats(group: THREE.Group | THREE.Object3D): {
    meshCount: number;
    vertexCount: number;
    triangleCount: number;
    hasUVs: boolean;
  } {
    let meshCount = 0;
    let vertexCount = 0;
    let triangleCount = 0;
    let hasUVs = true;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        meshCount++;
        const geo = child.geometry;
        const pos = geo.attributes.position;
        if (pos) {
          vertexCount += pos.count;
        }
        if (geo.index) {
          triangleCount += geo.index.count / 3;
        } else if (pos) {
          triangleCount += pos.count / 3;
        }
        if (!geo.attributes.uv) {
          hasUVs = false;
        }
      }
    });

    return {
      meshCount,
      vertexCount: Math.round(vertexCount),
      triangleCount: Math.round(triangleCount),
      hasUVs,
    };
  }
}
