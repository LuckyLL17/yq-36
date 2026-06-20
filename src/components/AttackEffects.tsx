import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useSiegeStore } from '@/store/useSiegeStore';
import { Projectile, ImpactEffect } from '@/types/siege';
import { ViewMode } from '@/types/castle';
import { MaterialFactory } from '@/utils/MaterialFactory';

function ProjectileMesh({ projectile, viewMode }: { projectile: Projectile; viewMode: ViewMode }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const trajectory = useMemo(() => {
    const start = new THREE.Vector3(...projectile.startPosition);
    const end = new THREE.Vector3(...projectile.targetPosition);
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    const dist = start.distanceTo(end);
    mid.y += dist * 0.4;

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve;
  }, [projectile.startPosition, projectile.targetPosition]);

  const trailPositions = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const trailLength = 5;
    for (let i = 0; i < trailLength; i++) {
      const t = Math.max(0, projectile.progress - i * 0.03);
      points.push(trajectory.getPoint(t));
    }
    return new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));
  }, [projectile.progress, trajectory]);

  const position = trajectory.getPoint(projectile.progress);

  const projectileColor = useMemo(() => {
    switch (projectile.type) {
      case 'catapult':
      case 'trebuchet':
        return '#8b7355';
      case 'ballista':
        return '#555555';
      case 'battering_ram':
        return '#6b4423';
      default:
        return '#777777';
    }
  }, [projectile.type]);

  const projectileSize = useMemo(() => {
    switch (projectile.type) {
      case 'trebuchet':
        return 0.6;
      case 'catapult':
        return 0.45;
      case 'ballista':
        return 0.15;
      default:
        return 0.3;
    }
  }, [projectile.type]);

  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);
  const material = isWireframe ? wireframeMaterial : null;

  return (
    <group>
      <mesh ref={meshRef} position={position.toArray() as [number, number, number]} castShadow material={material}>
        <sphereGeometry args={[projectileSize, 8, 6]} />
        {!isWireframe && <meshStandardMaterial color={projectileColor} roughness={0.6} />}
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={trailPositions.length / 3}
            array={trailPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff8833" transparent opacity={0.5} />
      </line>
    </group>
  );
}

function ImpactMesh({ impact, viewMode }: { impact: ImpactEffect; viewMode: ViewMode }) {
  const groupRef = useRef<THREE.Group>(null);
  const particleCount = 12;
  const scale = Math.sqrt(impact.damage) * 0.5;

  const particleOffsets = useMemo(() => {
    return Array.from({ length: particleCount }, () => ({
      dir: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2,
      ).normalize(),
      speed: 2 + Math.random() * 3,
      size: 0.1 + Math.random() * 0.3,
    }));
  }, []);

  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);
  const particleMaterial = isWireframe ? wireframeMaterial : null;

  return (
    <group ref={groupRef} position={impact.position as [number, number, number]}>
      {!isWireframe && (
        <pointLight
          position={[0, 1, 0]}
          intensity={5 * (1 - impact.progress)}
          distance={10}
          color="#ff4400"
        />
      )}
      <mesh position={[0, 0.5, 0]} scale={[1, 1, 1].map((s) => s * scale * impact.progress) as [number, number, number]} material={particleMaterial}>
        <sphereGeometry args={[1, 8, 6]} />
        {!isWireframe && <meshBasicMaterial color="#ff6600" transparent opacity={0.6 * (1 - impact.progress)} />}
      </mesh>
      {particleOffsets.map((p, i) => {
        const pos: [number, number, number] = [
          impact.position[0] + p.dir.x * p.speed * impact.progress,
          impact.position[1] + p.dir.y * p.speed * impact.progress,
          impact.position[2] + p.dir.z * p.speed * impact.progress,
        ];
        return (
          <mesh key={i} position={pos} material={particleMaterial}>
            <boxGeometry args={[p.size, p.size, p.size]} />
            {!isWireframe && (
              <meshBasicMaterial
                color={i % 2 === 0 ? '#8b7355' : '#555555'}
                transparent
                opacity={1 - impact.progress}
              />
            )}
          </mesh>
        );
      })}
    </group>
  );
}

function WallDamageOverlay({ viewMode }: { viewMode: ViewMode }) {
  const wallSegments = useSiegeStore((s) => s.wallSegments);
  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);

  return (
    <group>
      {wallSegments
        .filter((seg) => seg.health < seg.maxHealth)
        .map((seg) => {
          const damageRatio = 1 - seg.health / seg.maxHealth;
          const opacity = damageRatio * 0.7;
          const color = damageRatio > 0.7 ? '#ff0000' : damageRatio > 0.4 ? '#ff6600' : '#ffaa00';

          return (
            <mesh key={seg.id} position={seg.centerPosition as [number, number, number]} material={isWireframe ? wireframeMaterial : null}>
              <boxGeometry args={[4, seg.height, seg.thickness + 0.3]} />
              {!isWireframe && <meshBasicMaterial color={color} transparent opacity={opacity} />}
            </mesh>
          );
        })}
    </group>
  );
}

export function AttackEffects({ viewMode }: { viewMode: ViewMode }) {
  const projectiles = useSiegeStore((s) => s.projectiles);
  const impacts = useSiegeStore((s) => s.impacts);

  return (
    <group>
      {projectiles.map((proj) => (
        <ProjectileMesh key={proj.id} projectile={proj} viewMode={viewMode} />
      ))}
      {impacts.map((impact) => (
        <ImpactMesh key={impact.id} impact={impact} viewMode={viewMode} />
      ))}
      <WallDamageOverlay viewMode={viewMode} />
    </group>
  );
}
