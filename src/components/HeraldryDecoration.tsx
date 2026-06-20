import { useMemo } from 'react';
import * as THREE from 'three';
import { useHeraldryStore } from '@/store/useHeraldryStore';
import { renderHeraldryToCanvas } from '@/utils/HeraldryRenderer';
import { CastleParams } from '@/types/castle';
import { getInterpolatedStyle } from '@/data/historicalEras';
import { CastleGenerator } from '@/utils/CastleGenerator';

interface HeraldryDecorationProps {
  params: CastleParams;
}

function createHeraldryTexture(config: ReturnType<typeof useHeraldryStore.getState>['config']): THREE.CanvasTexture | null {
  if (!config.applied) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  renderHeraldryToCanvas(ctx, 256, 256, config);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function HeraldryDecoration({ params }: HeraldryDecorationProps) {
  const config = useHeraldryStore((s) => s.config);

  const heraldryTexture = useMemo(() => createHeraldryTexture(config), [config]);

  const plotPoints = useMemo(() => {
    const generator = new CastleGenerator(params);
    return generator.generatePlotPoints();
  }, [params]);

  const gatePosition = useMemo(() => {
    const p1 = plotPoints[0];
    const p2 = plotPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    return {
      x: (p1.x + p2.x) / 2,
      z: (p1.y + p2.y) / 2,
      angle,
    };
  }, [plotPoints]);

  if (!heraldryTexture) return null;

  const shieldMaterial = new THREE.MeshStandardMaterial({
    map: heraldryTexture,
    roughness: 0.4,
    metalness: 0.2,
    transparent: true,
    alphaTest: 0.1,
  });

  const gateShieldY = params.gateHeight + 1.5;
  const gateShieldSize = Math.min(params.gateWidth * 0.6, 2.5);

  return (
    <group>
      <mesh
        position={[gatePosition.x, gateShieldY, gatePosition.z]}
        rotation={[0, -gatePosition.angle + Math.PI / 2, 0]}
        material={shieldMaterial}
        castShadow
      >
        <planeGeometry args={[gateShieldSize, gateShieldSize * 1.2]} />
      </mesh>

      {plotPoints.map((point, i) => {
        const nextPoint = plotPoints[(i + 1) % plotPoints.length];
        const dx = nextPoint.x - point.x;
        const dy = nextPoint.y - point.y;
        const angle = Math.atan2(dy, dx);
        const style = getInterpolatedStyle(params.eraYear);
        const towerH = params.towerHeight * style.towerHeightMultiplier;
        const towerR = params.towerRadius * style.towerRadiusMultiplier;

        return (
          <group key={`tower_heraldry_${i}`}>
            <mesh
              position={[point.x, towerH * 0.6, point.y]}
              rotation={[0, -angle + Math.PI / 2, 0]}
              material={shieldMaterial}
              castShadow
            >
              <planeGeometry args={[towerR * 0.9, towerR * 1.1]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
