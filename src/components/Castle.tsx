import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CastleParams, ViewMode } from '@/types/castle';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { MaterialFactory } from '@/utils/MaterialFactory';
import { UVUnwrapper, UVIsland } from '@/utils/UVUnwrapper';
import { useCastleStore } from '@/store/useCastleStore';
import { getInterpolatedStyle } from '@/data/historicalEras';

interface CastleProps {
  params: CastleParams;
  viewMode: ViewMode;
}

export function Castle({ params, viewMode }: CastleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const setCastleGeometries = useCastleStore((state) => state.setCastleGeometries);

  const { walls, towers, gate, moat, buildings, ground, uvGeometries } = useMemo(() => {
    const generator = new CastleGenerator(params);
    const style = getInterpolatedStyle(params.eraYear);
    const result = generator.generateAll(style.crenellationHeightMultiplier);
    
    const uvGeos: THREE.BufferGeometry[] = [];
    const islands: UVIsland[] = [];
    
    result.walls.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `wall_${i}`);
      islands.push(island);
      uvGeos.push(uvGeo);
    });
    result.towers.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `tower_${i}`);
      islands.push(island);
      uvGeos.push(uvGeo);
    });
    const gateUvGeo = result.gate.clone();
    islands.push(UVUnwrapper.unwrapGeometry(gateUvGeo, 'gate'));
    uvGeos.push(gateUvGeo);
    if (result.moat) {
      const moatUvGeo = result.moat.clone();
      islands.push(UVUnwrapper.unwrapGeometry(moatUvGeo, 'moat'));
      uvGeos.push(moatUvGeo);
    }
    result.buildings.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `building_${i}`);
      islands.push(island);
      uvGeos.push(uvGeo);
    });
    
    UVUnwrapper.packIslands(islands, 0.02);
    
    return { ...result, uvGeometries: uvGeos };
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

  const renderWalls = () => {
    const geos = viewMode === 'uv' ? uvGeometries.slice(0, walls.length) : walls;
    return geos.map((geo, i) => (
      <mesh key={`wall_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name={`wall_${i}`} />
    ));
  };

  const renderTowers = () => {
    const startIdx = walls.length;
    const geos = viewMode === 'uv' ? uvGeometries.slice(startIdx, startIdx + towers.length) : towers;
    return geos.map((geo, i) => (
      <mesh key={`tower_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name={`tower_${i}`} />
    ));
  };

  const renderGate = () => {
    const idx = walls.length + towers.length;
    const geo = viewMode === 'uv' ? uvGeometries[idx] : gate;
    return <mesh geometry={geo} material={getMaterial('wood')} castShadow receiveShadow name="gate" />;
  };

  const renderMoat = () => {
    if (!moat) return null;
    const idx = walls.length + towers.length + 1;
    const geo = viewMode === 'uv' ? uvGeometries[idx] : moat;
    return <mesh geometry={geo} material={getMaterial('water')} receiveShadow name="moat" />;
  };

  const renderBuildings = () => {
    const startIdx = walls.length + towers.length + 1 + (moat ? 1 : 0);
    const geos = viewMode === 'uv' ? uvGeometries.slice(startIdx, startIdx + buildings.length) : buildings;
    return geos.map((geo, i) => (
      <mesh key={`building_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name={`building_${i}`} />
    ));
  };

  return (
    <group ref={groupRef}>
      {renderWalls()}
      {renderTowers()}
      {renderGate()}
      {renderMoat()}
      {renderBuildings()}
      <mesh geometry={ground} material={getMaterial('ground')} receiveShadow name="ground" />
    </group>
  );
}
