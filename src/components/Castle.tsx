import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CastleParams } from '@/types/castle';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { MaterialFactory } from '@/utils/MaterialFactory';
import { UVUnwrapper, UVIsland } from '@/utils/UVUnwrapper';
import { useCastleStore } from '@/store/useCastleStore';

interface CastleProps {
  params: CastleParams;
  viewMode: 'solid' | 'wireframe' | 'uv';
}

export function Castle({ params, viewMode }: CastleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const setCastleGeometries = useCastleStore((state) => state.setCastleGeometries);

  const { walls, towers, gate, moat, buildings, ground, uvIslands } = useMemo(() => {
    const generator = new CastleGenerator(params);
    const result = generator.generateAll();
    
    const islands: UVIsland[] = [];
    
    result.walls.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `wall_${i}`);
      islands.push(island);
    });
    result.towers.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `tower_${i}`);
      islands.push(island);
    });
    islands.push(UVUnwrapper.unwrapGeometry(result.gate, 'gate'));
    if (result.moat) {
      islands.push(UVUnwrapper.unwrapGeometry(result.moat, 'moat'));
    }
    result.buildings.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `building_${i}`);
      islands.push(island);
    });
    
    UVUnwrapper.packIslands(islands, 0.02);
    
    return { ...result, uvIslands: islands };
  }, [params]);

  useEffect(() => {
    setCastleGeometries({
      walls,
      towers,
      gate,
      moat,
      buildings,
      ground,
    });
  }, [walls, towers, gate, moat, buildings, ground, setCastleGeometries]);

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
        <mesh key={`wall_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name={`wall_${i}`} />
      ))}
      
      {towers.map((geo, i) => (
        <mesh key={`tower_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name={`tower_${i}`} />
      ))}
      
      <mesh geometry={gate} material={getMaterial('wood')} castShadow receiveShadow name="gate" />
      
      {moat && (
        <mesh geometry={moat} material={getMaterial('water')} receiveShadow name="moat" />
      )}
      
      {buildings.map((geo, i) => (
        <mesh key={`building_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name={`building_${i}`} />
      ))}
      
      <mesh geometry={ground} material={getMaterial('ground')} receiveShadow name="ground" />
    </group>
  );
}
