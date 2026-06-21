import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CastleParams, NPCType, NPC_TYPE_INFO } from '@/types/castle';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { NPCSystem, NPC } from '@/utils/NPCSystem';
import { useCastleStore } from '@/store/useCastleStore';

interface NPCManagerProps {
  params: CastleParams;
}

function createNPCGeometry(type: NPCType): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  const bodyHeight = type === 'noble' ? 1.1 : type === 'soldier' ? 1.0 : 0.9;
  const bodyWidth = type === 'soldier' ? 0.45 : 0.35;
  const headRadius = type === 'noble' ? 0.22 : 0.2;

  const bodyGeo = new THREE.CylinderGeometry(bodyWidth * 0.8, bodyWidth, bodyHeight, 8);
  bodyGeo.translate(0, bodyHeight / 2, 0);
  geometries.push(bodyGeo);

  const headGeo = new THREE.SphereGeometry(headRadius, 8, 8);
  headGeo.translate(0, bodyHeight + headRadius * 0.8, 0);
  geometries.push(headGeo);

  const armRadius = 0.06;
  const armLength = bodyHeight * 0.6;
  const leftArm = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 6);
  leftArm.translate(-bodyWidth * 0.9, bodyHeight * 0.55, 0);
  leftArm.rotateZ(0.3);
  geometries.push(leftArm);

  const rightArm = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 6);
  rightArm.translate(bodyWidth * 0.9, bodyHeight * 0.55, 0);
  rightArm.rotateZ(-0.3);
  geometries.push(rightArm);

  const legRadius = 0.07;
  const legLength = bodyHeight * 0.5;
  const leftLeg = new THREE.CylinderGeometry(legRadius, legRadius, legLength, 6);
  leftLeg.translate(-bodyWidth * 0.35, legLength / 2, 0);
  geometries.push(leftLeg);

  const rightLeg = new THREE.CylinderGeometry(legRadius, legRadius, legLength, 6);
  rightLeg.translate(bodyWidth * 0.35, legLength / 2, 0);
  geometries.push(rightLeg);

  if (type === 'soldier') {
    const helmetGeo = new THREE.ConeGeometry(headRadius * 1.1, headRadius * 0.8, 8);
    helmetGeo.translate(0, bodyHeight + headRadius * 1.2, 0);
    geometries.push(helmetGeo);

    const shieldGeo = new THREE.BoxGeometry(0.3, 0.5, 0.05);
    shieldGeo.translate(bodyWidth * 1.1, bodyHeight * 0.5, 0);
    geometries.push(shieldGeo);
  }

  if (type === 'noble') {
    const hatGeo = new THREE.ConeGeometry(headRadius * 0.9, headRadius * 1.0, 6);
    hatGeo.translate(0, bodyHeight + headRadius * 1.3, 0);
    geometries.push(hatGeo);

    const capeGeo = new THREE.BoxGeometry(bodyWidth * 1.3, bodyHeight * 0.7, 0.05);
    capeGeo.translate(0, bodyHeight * 0.45, -bodyWidth * 0.55);
    geometries.push(capeGeo);
  }

  if (type === 'farmer') {
    const hatGeo = new THREE.CylinderGeometry(headRadius * 0.8, headRadius * 1.2, 0.05, 8);
    hatGeo.translate(0, bodyHeight + headRadius * 0.9, 0);
    geometries.push(hatGeo);
  }

  const merged = mergeGeometries(geometries);
  return merged;
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;

    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (nor) {
        normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      }
    }

    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + vertexOffset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(i + vertexOffset);
      }
    }

    vertexOffset += pos.count;
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) {
    result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  result.setIndex(indices);

  return result;
}

function NPCMesh({
  npc,
  geometry,
  color,
  onClick,
  isSelected,
}: {
  npc: NPC;
  geometry: THREE.BufferGeometry;
  color: string;
  onClick: () => void;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.set(npc.position.x, npc.position.y, npc.position.z);
    groupRef.current.rotation.y = npc.rotation;

    const walkSwing = Math.sin(npc.walkPhase) * 0.5;
    if (leftArmRef.current) leftArmRef.current.rotation.x = walkSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -walkSwing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -walkSwing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = walkSwing;
  });

  const headColor = npc.type === 'farmer' ? '#D4A574' : npc.type === 'soldier' ? '#E8C4A0' : '#F5DEB3';
  const bodyColor = NPC_TYPE_INFO[npc.type].color;
  const limbColor = npc.type === 'farmer' ? '#8B6914' : npc.type === 'soldier' ? '#3D4A5C' : '#6B4C9A';

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {isSelected && (
        <mesh position={[0, 1.2, 0]}>
          <ringGeometry args={[0.4, 0.5, 16]} />
          <meshBasicMaterial color="#ffd700" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      <mesh
        ref={leftArmRef}
        position={[-0.35, 0.6, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.06, 0.06, 0.5, 6]} />
        <meshStandardMaterial color={limbColor} />
      </mesh>
      <mesh
        ref={rightArmRef}
        position={[0.35, 0.6, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.06, 0.06, 0.5, 6]} />
        <meshStandardMaterial color={limbColor} />
      </mesh>

      <mesh
        ref={leftLegRef}
        position={[-0.12, 0.2, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.07, 0.07, 0.4, 6]} />
        <meshStandardMaterial color={limbColor} />
      </mesh>
      <mesh
        ref={rightLegRef}
        position={[0.12, 0.2, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.07, 0.07, 0.4, 6]} />
        <meshStandardMaterial color={limbColor} />
      </mesh>

      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={headColor} />
      </mesh>

      {npc.type === 'soldier' && (
        <mesh position={[0, 1.15, 0]} castShadow>
          <coneGeometry args={[0.22, 0.18, 8]} />
          <meshStandardMaterial color="#5A6A7A" />
        </mesh>
      )}
      {npc.type === 'noble' && (
        <mesh position={[0, 1.2, 0]} castShadow>
          <coneGeometry args={[0.18, 0.25, 6]} />
          <meshStandardMaterial color="#9F7AEA" />
        </mesh>
      )}
      {npc.type === 'farmer' && (
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.22, 0.05, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}
    </group>
  );
}

export function NPCManager({ params }: NPCManagerProps) {
  const residentMode = useCastleStore((state) => state.params.residentMode);
  const selectedNPCId = useCastleStore((state) => state.selectedNPCId);
  const selectNPC = useCastleStore((state) => state.selectNPC);

  const npcSystemRef = useRef<NPCSystem | null>(null);
  const npcListRef = useRef<NPC[]>([]);

  const { plotPoints, buildingPositions, generator } = useMemo(() => {
    const gen = new CastleGenerator(params);
    const points = gen.generatePlotPoints();
    const buildings = gen.getBuildingPositions(points);
    return { plotPoints: points, buildingPositions: buildings, generator: gen };
  }, [params.seed, params.plotWidth, params.plotDepth, params.buildingCount, params.wallThickness]);

  const npcGeometries = useMemo(() => {
    return {
      farmer: createNPCGeometry('farmer'),
      soldier: createNPCGeometry('soldier'),
      noble: createNPCGeometry('noble'),
    };
  }, []);

  useEffect(() => {
    if (!residentMode) {
      npcListRef.current = [];
      return;
    }

    const system = new NPCSystem(params, plotPoints);
    system.setObstacles(buildingPositions);
    system.generateNPCs();
    npcSystemRef.current = system;
    npcListRef.current = system.getNPCs();
  }, [residentMode, params.residentCount, params.farmerRatio, params.soldierRatio, params.nobleRatio, plotPoints, buildingPositions, params]);

  useFrame((_, delta) => {
    if (!residentMode || !npcSystemRef.current) return;

    const clampedDelta = Math.min(delta, 0.1);
    npcSystemRef.current.update(clampedDelta, (x, z) => generator.getTerrainHeight(x, z));
    npcListRef.current = npcSystemRef.current.getNPCs();
  });

  if (!residentMode) return null;

  return (
    <group>
      {npcListRef.current.map((npc) => (
        <NPCMesh
          key={npc.id}
          npc={npc}
          geometry={npcGeometries[npc.type]}
          color={NPC_TYPE_INFO[npc.type].color}
          onClick={() => {
            if (selectedNPCId === npc.id) {
              selectNPC(null, null);
            } else {
              selectNPC(npc.id, npc.type);
            }
          }}
          isSelected={selectedNPCId === npc.id}
        />
      ))}
    </group>
  );
}
