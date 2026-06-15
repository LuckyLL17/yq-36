import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CastleParams } from '@/types/castle';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { MaterialFactory } from '@/utils/MaterialFactory';
import { UVUnwrapper } from '@/utils/UVUnwrapper';

interface CastleProps {
  params: CastleParams;
  viewMode: 'solid' | 'wireframe' | 'uv';
}

export function Castle({ params, viewMode }: CastleProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { walls, towers, gate, moat, buildings, ground } = useMemo(() => {
    const generator = new CastleGenerator(params);
    const result = generator.generateAll();
    
    result.walls.forEach((geo, i) => {
      UVUnwrapper.unwrapGeometry(geo, `wall_${i}`);
    });
    result.towers.forEach((geo, i) => {
      UVUnwrapper.unwrapGeometry(geo, `tower_${i}`);
    });
    UVUnwrapper.unwrapGeometry(result.gate, 'gate');
    if (result.moat) {
      UVUnwrapper.unwrapGeometry(result.moat, 'moat');
    }
    result.buildings.forEach((geo, i) => {
      UVUnwrapper.unwrapGeometry(geo, `building_${i}`);
    });
    
    return result;
  }, [params]);

  const getMaterial = (type: 'stone' | 'wood' | 'roof' | 'ground' | 'water') => {
    if (viewMode === 'wireframe') {
      return MaterialFactory.getWireframeMaterial();
    }
    if (viewMode === 'uv') {
      return MaterialFactory.getCheckerboardMaterial();
    }
    switch (type) {
      case 'stone':
        return MaterialFactory.getStoneMaterial();
      case 'wood':
        return MaterialFactory.getWoodMaterial();
      case 'roof':
        return MaterialFactory.getRoofMaterial();
      case 'ground':
        return MaterialFactory.getGroundMaterial();
      case 'water':
        return MaterialFactory.getWaterMaterial();
    }
  };

  useFrame((state) => {
    if (groupRef.current && viewMode === 'solid') {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {walls.map((geo, i) => (
        <mesh key={`wall_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow />
      ))}
      
      {towers.map((geo, i) => (
        <mesh key={`tower_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow />
      ))}
      
      <mesh geometry={gate} material={getMaterial('wood')} castShadow receiveShadow />
      
      {moat && (
        <mesh geometry={moat} material={getMaterial('water')} receiveShadow />
      )}
      
      {buildings.map((geo, i) => (
        <mesh key={`building_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow />
      ))}
      
      <mesh geometry={ground} material={getMaterial('ground')} receiveShadow rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}
