import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSiegeStore } from '@/store/useSiegeStore';
import { WEAPON_CONFIGS } from '@/types/siege';

function WeakPointMarker() {
  const weakPoints = useSiegeStore((s) => s.weakPoints);

  return (
    <group>
      {weakPoints.map((wp, i) => {
        const intensity = wp.severity;
        const color = intensity > 0.7 ? '#ff2200' : intensity > 0.4 ? '#ff6600' : '#ffaa00';

        return (
          <group key={`wp_${i}`} position={wp.position as [number, number, number]}>
            <mesh>
              <sphereGeometry args={[0.8, 12, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.5 * intensity} />
            </mesh>
            <PulsingRing color={color} intensity={intensity} />
            <pointLight intensity={2 * intensity} distance={8} color={color} />
          </group>
        );
      })}
    </group>
  );
}

function PulsingRing({ color, intensity }: { color: string; intensity: number }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.0, 1.3, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4 * intensity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DefensePositionMarker() {
  const defensePositions = useSiegeStore((s) => s.defensePositions);

  return (
    <group>
      {defensePositions.map((dp, i) => {
        const coverage = dp.coverage;

        return (
          <group key={`dp_${i}`} position={dp.position as [number, number, number]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.2, 6]} />
              <meshBasicMaterial color="#00cc66" transparent opacity={0.4 * coverage} />
            </mesh>
            <mesh>
              <coneGeometry args={[0.3, 1.2, 6]} />
              <meshBasicMaterial color="#00ff88" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
              <sphereGeometry args={[0.2, 8, 6]} />
              <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
            </mesh>
            <pointLight intensity={1.5 * coverage} distance={6} color="#00ff88" />
          </group>
        );
      })}
    </group>
  );
}

function WeaponRangeOverlay() {
  const weapons = useSiegeStore((s) => s.weapons);
  const selectedWeaponId = useSiegeStore((s) => s.selectedWeaponId);

  return (
    <group>
      {weapons
        .filter((w) => selectedWeaponId === null || w.id === selectedWeaponId)
        .map((weapon) => {
          const config = WEAPON_CONFIGS[weapon.type];
          if (!config.range || config.range <= 5) return null;

          const points: [number, number, number][] = [];
          const segments = 64;
          for (let j = 0; j <= segments; j++) {
            const angle = (j / segments) * Math.PI * 2;
            points.push([
              weapon.position[0] + Math.cos(angle) * config.range,
              0.1,
              weapon.position[2] + Math.sin(angle) * config.range,
            ]);
          }

          return (
            <line key={`range_${weapon.id}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={points.length}
                  array={new Float32Array(points.flat())}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={weapon.id === selectedWeaponId ? '#ff6600' : '#ffaa00'}
                transparent
                opacity={weapon.id === selectedWeaponId ? 0.6 : 0.2}
              />
            </line>
          );
        })}
    </group>
  );
}

export function DefenseAnalysis() {
  const showAnalysis = useSiegeStore((s) => s.showAnalysis);

  if (!showAnalysis) return null;

  return (
    <group>
      <WeakPointMarker />
      <DefensePositionMarker />
      <WeaponRangeOverlay />
    </group>
  );
}
