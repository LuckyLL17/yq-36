import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlacedWeapon, WeaponType, WEAPON_CONFIGS } from '@/types/siege';
import { ViewMode } from '@/types/castle';
import { useSiegeStore } from '@/store/useSiegeStore';
import { MaterialFactory } from '@/utils/MaterialFactory';

interface WeaponModelProps {
  isAttacking: boolean;
  viewMode: ViewMode;
}

function CatapultModel({ isAttacking, viewMode }: WeaponModelProps) {
  const armRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (armRef.current) {
      if (isAttacking) {
        armRef.current.rotation.z = THREE.MathUtils.lerp(armRef.current.rotation.z, -1.2, delta * 5);
      } else {
        armRef.current.rotation.z = THREE.MathUtils.lerp(armRef.current.rotation.z, 0.5, delta * 2);
      }
    }
  });

  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);
  const material = isWireframe ? wireframeMaterial : null;

  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow material={material}>
        <boxGeometry args={[3, 0.4, 2]} />
        {!isWireframe && <meshStandardMaterial color="#6b4423" roughness={0.8} />}
      </mesh>
      <mesh position={[-1.2, 0.2, 0]} castShadow material={material}>
        <cylinderGeometry args={[0.2, 0.2, 1.6, 8]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <mesh position={[1.2, 0.2, 0]} castShadow material={material}>
        <cylinderGeometry args={[0.2, 0.2, 1.6, 8]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <group position={[0.5, 0.8, 0]} ref={armRef}>
        <mesh position={[0, 0.8, 0]} castShadow material={material}>
          <boxGeometry args={[0.15, 2.5, 0.15]} />
          {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.9} />}
        </mesh>
        <mesh position={[0, 2.0, 0]} castShadow material={material}>
          <boxGeometry args={[0.8, 0.3, 0.6]} />
          {!isWireframe && <meshStandardMaterial color="#8b7355" roughness={0.7} />}
        </mesh>
      </group>
      <mesh position={[-0.3, 1.0, 0]} castShadow rotation={[0, 0, 0.3]} material={material}>
        <cylinderGeometry args={[0.1, 0.15, 1, 6]} />
        {!isWireframe && <meshStandardMaterial color="#3d2b1f" roughness={0.9} />}
      </mesh>
    </group>
  );
}

function TrebuchetModel({ isAttacking, viewMode }: WeaponModelProps) {
  const armRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (armRef.current) {
      if (isAttacking) {
        armRef.current.rotation.z = THREE.MathUtils.lerp(armRef.current.rotation.z, -1.5, delta * 4);
      } else {
        armRef.current.rotation.z = THREE.MathUtils.lerp(armRef.current.rotation.z, 0.6, delta * 2);
      }
    }
  });

  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);
  const material = isWireframe ? wireframeMaterial : null;

  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow material={material}>
        <boxGeometry args={[4, 0.3, 2.5]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.8} />}
      </mesh>
      <mesh position={[-1.5, 1.5, 0]} castShadow material={material}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <mesh position={[1.5, 1.5, 0]} castShadow material={material}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <mesh position={[0, 3, 0]} castShadow material={material}>
        <boxGeometry args={[3.5, 0.3, 0.3]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <group position={[0.5, 3, 0]} ref={armRef}>
        <mesh position={[0, 0, 0]} castShadow material={material}>
          <boxGeometry args={[0.15, 5, 0.15]} />
          {!isWireframe && <meshStandardMaterial color="#6b4423" roughness={0.9} />}
        </mesh>
        <mesh position={[0, -2.3, 0]} castShadow material={material}>
          <boxGeometry args={[1, 1, 0.8]} />
          {!isWireframe && <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.3} />}
        </mesh>
        <mesh position={[0, 2.3, 0]} castShadow material={material}>
          <sphereGeometry args={[0.4, 8, 6]} />
          {!isWireframe && <meshStandardMaterial color="#777777" roughness={0.5} />}
        </mesh>
      </group>
      {[-1.5, 1.5].map((x) =>
        [-1.1, 1.1].map((z) => (
          <mesh key={`${x}_${z}`} position={[x, 0.2, z]} castShadow material={material}>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} />
            {!isWireframe && <meshStandardMaterial color="#3d2b1f" roughness={0.9} />}
          </mesh>
        ))
      )}
    </group>
  );
}

function SiegeTowerModel({ viewMode }: Omit<WeaponModelProps, 'isAttacking'>) {
  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);
  const material = isWireframe ? wireframeMaterial : null;

  return (
    <group>
      <mesh position={[0, 3, 0]} castShadow material={material}>
        <boxGeometry args={[3, 6, 2.5]} />
        {!isWireframe && <meshStandardMaterial color="#6b4423" roughness={0.8} />}
      </mesh>
      <mesh position={[-1.3, 1.5, 0]} castShadow material={material}>
        <boxGeometry args={[0.15, 6, 2.5]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.9} />}
      </mesh>
      <mesh position={[1.3, 1.5, 0]} castShadow material={material}>
        <boxGeometry args={[0.15, 6, 2.5]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.9} />}
      </mesh>
      {[1, 2.5, 4].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow material={material}>
          <boxGeometry args={[2.6, 0.1, 2.5]} />
          {!isWireframe && <meshStandardMaterial color="#7a5a33" roughness={0.8} />}
        </mesh>
      ))}
      <mesh position={[0, 6.2, 0]} castShadow material={material}>
        <boxGeometry args={[3.4, 0.8, 2.8]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.9} />}
      </mesh>
      <mesh position={[0, 5.5, -1.3]} castShadow material={material}>
        <boxGeometry args={[2.5, 5, 0.15]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.9} />}
      </mesh>
      <mesh position={[0, 0.3, -1.2]} castShadow material={material}>
        <boxGeometry args={[2, 0.15, 2.4]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      {[-1.2, 1.2].map((x) =>
        [-0.8, 0.8].map((z) => (
          <mesh key={`${x}_${z}`} position={[x, 0.2, z]} castShadow material={material}>
            <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
            {!isWireframe && <meshStandardMaterial color="#3d2b1f" roughness={0.9} />}
          </mesh>
        ))
      )}
    </group>
  );
}

function BatteringRamModel({ isAttacking, viewMode }: WeaponModelProps) {
  const ramRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ramRef.current) {
      if (isAttacking) {
        ramRef.current.position.x = Math.sin(Date.now() * 0.02) * 0.5;
      } else {
        ramRef.current.position.x = THREE.MathUtils.lerp(ramRef.current.position.x, 0, delta * 3);
      }
    }
  });

  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);
  const material = isWireframe ? wireframeMaterial : null;

  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow material={material}>
        <boxGeometry args={[1.5, 1.2, 3]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.8} />}
      </mesh>
      <mesh position={[-0.7, 2.2, 0]} castShadow material={material}>
        <boxGeometry args={[0.1, 0.8, 3]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <mesh position={[0.7, 2.2, 0]} castShadow material={material}>
        <boxGeometry args={[0.1, 0.8, 3]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <mesh position={[0, 2.6, -1.5]} castShadow material={material}>
        <boxGeometry args={[1.6, 0.1, 0.2]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <mesh position={[0, 2.6, 1.5]} castShadow material={material}>
        <boxGeometry args={[1.6, 0.1, 0.2]} />
        {!isWireframe && <meshStandardMaterial color="#4a3520" roughness={0.9} />}
      </mesh>
      <group ref={ramRef}>
        <mesh position={[0, 1.8, -1.8]} castShadow rotation={[Math.PI / 2, 0, 0]} material={material}>
          <cylinderGeometry args={[0.2, 0.15, 1.5, 8]} />
          {!isWireframe && <meshStandardMaterial color="#6b4423" roughness={0.9} />}
        </mesh>
        <mesh position={[0, 1.8, -2.6]} castShadow material={material}>
          <sphereGeometry args={[0.3, 8, 6]} />
          {!isWireframe && <meshStandardMaterial color="#777777" roughness={0.4} metalness={0.5} />}
        </mesh>
      </group>
      {[-1.2, -0.4, 0.4, 1.2].map((z) => (
        <mesh key={z} position={[0, 0.3, z]} castShadow material={material}>
          <cylinderGeometry args={[0.2, 0.2, 0.6, 8]} />
          {!isWireframe && <meshStandardMaterial color="#3d2b1f" roughness={0.9} />}
        </mesh>
      ))}
    </group>
  );
}

function BallistaModel({ isAttacking, viewMode }: WeaponModelProps) {
  const stringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (stringRef.current) {
      const mat = stringRef.current.material as THREE.MeshStandardMaterial;
      if (isAttacking) {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.1);
      } else {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1, 0.05);
      }
    }
  });

  const isWireframe = viewMode === 'wireframe';
  const wireframeMaterial = useMemo(() => MaterialFactory.getWireframeMaterial(), []);
  const material = isWireframe ? wireframeMaterial : null;

  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow material={material}>
        <boxGeometry args={[1.5, 0.3, 2.5]} />
        {!isWireframe && <meshStandardMaterial color="#6b4423" roughness={0.8} />}
      </mesh>
      {[-0.6, 0.6].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}_${z}`} position={[x, 0.2, z]} castShadow material={material}>
            <cylinderGeometry args={[0.2, 0.2, 0.8, 8]} />
            {!isWireframe && <meshStandardMaterial color="#3d2b1f" roughness={0.9} />}
          </mesh>
        ))
      )}
      <mesh position={[0, 0.8, 0.3]} castShadow rotation={[0.3, 0, 0]} material={material}>
        <boxGeometry args={[0.15, 0.15, 2.5]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.9} />}
      </mesh>
      <mesh position={[0, 0.8, -1]} castShadow material={material}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        {!isWireframe && <meshStandardMaterial color="#5a3a1a" roughness={0.9} />}
      </mesh>
      <mesh ref={stringRef} position={[0, 0.8, -0.6]}>
        <boxGeometry args={[0.7, 0.03, 0.03]} />
        <meshStandardMaterial color="#8b6914" roughness={0.7} transparent />
      </mesh>
      <mesh position={[0, 0.8, 1.6]} castShadow material={material}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        {!isWireframe && <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.6} />}
      </mesh>
    </group>
  );
}

function WeaponModel({ type, isAttacking, viewMode }: { type: WeaponType; isAttacking: boolean; viewMode: ViewMode }) {
  switch (type) {
    case 'catapult':
      return <CatapultModel isAttacking={isAttacking} viewMode={viewMode} />;
    case 'trebuchet':
      return <TrebuchetModel isAttacking={isAttacking} viewMode={viewMode} />;
    case 'siege_tower':
      return <SiegeTowerModel viewMode={viewMode} />;
    case 'battering_ram':
      return <BatteringRamModel isAttacking={isAttacking} viewMode={viewMode} />;
    case 'ballista':
      return <BallistaModel isAttacking={isAttacking} viewMode={viewMode} />;
  }
}

function WeaponItem({ weapon, viewMode }: { weapon: PlacedWeapon; viewMode: ViewMode }) {
  const { selectWeapon, selectedWeaponId } = useSiegeStore();
  const isSelected = selectedWeaponId === weapon.id;
  const config = WEAPON_CONFIGS[weapon.type];
  const healthRatio = weapon.health / weapon.maxHealth;

  const rangeRing = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * config.range,
        0.05,
        Math.sin(angle) * config.range,
      ));
    }
    return points;
  }, [config.range]);

  const isWireframe = viewMode === 'wireframe';

  return (
    <group
      position={weapon.position}
      rotation={[0, weapon.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectWeapon(weapon.id);
      }}
    >
      <WeaponModel type={weapon.type} isAttacking={weapon.isAttacking} viewMode={viewMode} />

      {isSelected && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={rangeRing.length}
              array={new Float32Array(rangeRing.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ff6600" transparent opacity={0.4} />
        </line>
      )}

      {isSelected && !isWireframe && (
        <mesh position={[0, 4, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      )}

      {healthRatio < 1 && !isWireframe && (
        <group position={[0, 5, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2, 0.2, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[(healthRatio - 1) * 1, 0, 0.01]}>
            <boxGeometry args={[2 * healthRatio, 0.15, 0.1]} />
            <meshBasicMaterial color={healthRatio > 0.5 ? '#22cc44' : healthRatio > 0.25 ? '#ccaa22' : '#cc2222'} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function SiegeWeapons({ viewMode }: { viewMode: ViewMode }) {
  const weapons = useSiegeStore((s) => s.weapons);

  return (
    <group>
      {weapons.map((weapon) => (
        <WeaponItem key={weapon.id} weapon={weapon} viewMode={viewMode} />
      ))}
    </group>
  );
}
