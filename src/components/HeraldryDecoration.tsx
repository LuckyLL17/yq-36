import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useHeraldryStore } from '@/store/useHeraldryStore';
import { renderHeraldryToCanvas } from '@/utils/HeraldryRenderer';
import { CastleParams } from '@/types/castle';
import { getInterpolatedStyle } from '@/data/historicalEras';
import { CastleGenerator } from '@/utils/CastleGenerator';

interface HeraldryDecorationProps {
  params: CastleParams;
}

export function HeraldryDecoration({ params }: HeraldryDecorationProps) {
  const config = useHeraldryStore((s) => s.config);
  const gateMeshRef = useRef<THREE.Mesh>(null);
  const towerMeshRefs = useRef<THREE.Mesh[]>([]);

  const plotPoints = useMemo(() => {
    const generator = new CastleGenerator(params);
    return generator.generatePlotPoints();
  }, [params]);

  const gateInfo = useMemo(() => {
    const p1 = plotPoints[0];
    const p2 = plotPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.y + p2.y) / 2;

    const wx = dx;
    const wz = dy;
    const n1x = -wz;
    const n1z = wx;
    const dot = n1x * midX + n1z * midZ;
    const outwardX = dot >= 0 ? n1x : -n1x;
    const outwardZ = dot >= 0 ? n1z : -n1z;
    const nLen = Math.sqrt(outwardX * outwardX + outwardZ * outwardZ) || 1;

    const offset = params.wallThickness / 2 + 0.08;
    const gateShieldY = params.gateHeight + 1.8;
    const gateShieldSize = Math.min(params.gateWidth * 0.7, 2.8);

    return {
      position: [
        midX + (outwardX / nLen) * offset,
        gateShieldY,
        midZ + (outwardZ / nLen) * offset,
      ] as [number, number, number],
      rotation: [0, -angle + Math.PI / 2, 0] as [number, number, number],
      width: gateShieldSize,
      height: gateShieldSize * 1.2,
    };
  }, [plotPoints, params]);

  const towerInfos = useMemo(() => {
    const style = getInterpolatedStyle(params.eraYear);
    const towerR = params.towerRadius * style.towerRadiusMultiplier;
    const towerH = params.towerHeight * style.towerHeightMultiplier;

    return plotPoints.map((point, i) => {
      const nextPoint = plotPoints[(i + 1) % plotPoints.length];
      const dx = nextPoint.x - point.x;
      const dy = nextPoint.y - point.y;
      const angle = Math.atan2(dy, dx);

      const wx = dx;
      const wz = dy;
      const n1x = -wz;
      const n1z = wx;
      const dot = n1x * point.x + n1z * point.y;
      const outwardX = dot >= 0 ? n1x : -n1x;
      const outwardZ = dot >= 0 ? n1z : -n1z;
      const nLen = Math.sqrt(outwardX * outwardX + outwardZ * outwardZ) || 1;

      const offset = towerR + 0.06;
      const shieldY = towerH * 0.55;
      const shieldW = towerR * 1.1;
      const shieldH = towerR * 1.3;

      return {
        position: [
          point.x + (outwardX / nLen) * offset,
          shieldY,
          point.y + (outwardZ / nLen) * offset,
        ] as [number, number, number],
        rotation: [0, -angle + Math.PI / 2, 0] as [number, number, number],
        width: shieldW,
        height: shieldH,
      };
    });
  }, [plotPoints, params]);

  useEffect(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    renderHeraldryToCanvas(ctx, size, size, config);

    const updateMesh = (mesh: THREE.Mesh | null) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat.map) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = 4;
        mat.map = tex;
      } else {
        mat.map.image = canvas;
      }
      mat.map.needsUpdate = true;
      mat.needsUpdate = true;
    };

    updateMesh(gateMeshRef.current);
    towerMeshRefs.current.forEach((m) => updateMesh(m));
  }, [config]);

  if (!config.applied) return null;

  return (
    <group>
      <mesh
        ref={gateMeshRef}
        position={gateInfo.position}
        rotation={gateInfo.rotation}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[gateInfo.width, gateInfo.height]} />
        <meshStandardMaterial
          transparent
          alphaTest={0.05}
          roughness={0.5}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {towerInfos.map((info, i) => (
        <mesh
          key={`tower_shield_${i}`}
          ref={(el) => {
            towerMeshRefs.current[i] = el;
          }}
          position={info.position}
          rotation={info.rotation}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[info.width, info.height]} />
          <meshStandardMaterial
            transparent
            alphaTest={0.05}
            roughness={0.5}
            metalness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
