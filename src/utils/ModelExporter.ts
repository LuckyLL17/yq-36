import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export interface ExportOptions {
  format: 'glb' | 'gltf';
  embedTextures?: boolean;
  filename?: string;
}

export class ModelExporter {
  private static exporter = new GLTFExporter();

  static exportGLB(
    group: THREE.Group | THREE.Object3D,
    filename: string = 'castle.glb'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const options = {
        binary: true,
        embedImages: true,
        trs: false,
        onlyVisible: true,
      };

      this.exporter.parse(
        group,
        (result) => {
          if (result instanceof ArrayBuffer) {
            this.downloadFile(result, filename, 'model/gltf-binary');
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

  static exportGLTF(
    group: THREE.Group | THREE.Object3D,
    filename: string = 'castle.gltf'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const options = {
        binary: false,
        embedImages: true,
        trs: false,
        onlyVisible: true,
      };

      this.exporter.parse(
        group,
        (result) => {
          if (typeof result === 'string') {
            this.downloadFile(result, filename, 'model/gltf+json');
            resolve();
          } else if (result instanceof ArrayBuffer) {
            this.downloadFile(result, filename, 'model/gltf-binary');
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
    filename: string = 'castle.obj'
  ): void {
    let objContent = '';
    let vertexOffset = 0;

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
    });

    this.downloadFile(objContent, filename, 'text/plain');
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
