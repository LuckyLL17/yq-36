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
  const waterRef = useRef<THREE.Mesh>(null);
  const waterSegmentsRef = useRef<THREE.Group>(null);
  const drawbridgeRef = useRef<THREE.Group>(null);
  const setCastleGeometries = useCastleStore((state) => state.setCastleGeometries);

  const generatorData = useMemo(() => {
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

  const { walls, towers, gate, moat, moatSegments, water, waterSegments, drawbridge, portcullis, buildings, ground, uvGeometries } = generatorData;

  useEffect(() => {
    setCastleGeometries({
      walls,
      towers,
      gate,
      moat,
      moatSegments,
      water,
      waterSegments,
      drawbridge,
      portcullis,
      buildings,
      ground,
    });
  }, [walls, towers, gate, moat, moatSegments, water, waterSegments, drawbridge, portcullis, buildings, ground, setCastleGeometries]);

  const getMaterial = (type: 'stone' | 'wood' | 'roof' | 'ground' | 'water' | 'metal') => {
    if (viewMode === 'wireframe') {
      return MaterialFactory.getWireframeMaterial();
    }
    if (viewMode === 'uv') {
      return MaterialFactory.getCheckerboardMaterial();
    }
    switch (type) {
      case 'stone':
        return MaterialFactory.getStoneMaterial(false, params.wallStyle);
      case 'wood':
        return MaterialFactory.getWoodMaterial();
      case 'roof':
        return MaterialFactory.getRoofMaterial();
      case 'ground':
        return MaterialFactory.getGroundMaterial();
      case 'water':
        return MaterialFactory.getWaterMaterial();
      case 'metal':
        return new THREE.MeshStandardMaterial({
          color: 0x3a3a3a,
          metalness: 0.9,
          roughness: 0.3,
          wireframe: (viewMode as string) === 'wireframe',
        });
    }
  };

  useFrame((state) => {
    if (groupRef.current && viewMode === 'solid') {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }

    if (waterRef.current && viewMode === 'solid' && params.moatWaterParams.isAnimated) {
      const time = state.clock.elapsedTime * params.moatWaterParams.flowSpeed;
      const positions = (waterRef.current.geometry as THREE.BufferGeometry).attributes.position;
      if (positions) {
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const z = positions.getZ(i);
          const originalY = (positions as any)._originalY !== undefined
            ? (positions as any)._originalY[i]
            : positions.getY(i);
          if ((positions as any)._originalY === undefined) {
            (positions as any)._originalY = new Float32Array(positions.count);
          }
          (positions as any)._originalY[i] = originalY;
          const wave = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time * 0.7) * params.moatWaterParams.waveHeight;
          positions.setY(i, originalY + wave);
        }
        positions.needsUpdate = true;
      }
    }

    if (waterSegmentsRef.current && viewMode === 'solid' && params.moatWaterParams.isAnimated) {
      const time = state.clock.elapsedTime * params.moatWaterParams.flowSpeed;
      waterSegmentsRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          const positions = (mesh.geometry as THREE.BufferGeometry).attributes.position;
          if (positions) {
            for (let i = 0; i < positions.count; i++) {
              const x = positions.getX(i);
              const z = positions.getZ(i);
              const originalY = (positions as any)._originalY !== undefined
                ? (positions as any)._originalY[i]
                : positions.getY(i);
              if ((positions as any)._originalY === undefined) {
                (positions as any)._originalY = new Float32Array(positions.count);
              }
              (positions as any)._originalY[i] = originalY;
              const wave = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time * 0.7) * params.moatWaterParams.waveHeight;
              positions.setY(i, originalY + wave);
            }
            positions.needsUpdate = true;
          }
        }
      });
    }

    if (drawbridgeRef.current) {
      drawbridgeRef.current.rotation.x = -params.drawbridgeAngle * (Math.PI / 180);
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
    return <mesh geometry={geo} material={getMaterial('ground')} receiveShadow name="moat" />;
  };

  const renderMoatSegments = () => {
    return moatSegments.map((geo, i) => (
      <mesh key={`moat_seg_${i}`} geometry={geo} material={getMaterial('ground')} receiveShadow name={`moat_seg_${i}`} />
    ));
  };

  const renderWater = () => {
    if (!water) return null;
    return (
      <mesh ref={waterRef} geometry={water} material={getMaterial('water')} receiveShadow name="water" />
    );
  };

  const renderWaterSegments = () => {
    return (
      <group ref={waterSegmentsRef}>
        {waterSegments.map((geo, i) => (
          <mesh key={`water_seg_${i}`} geometry={geo} material={getMaterial('water')} receiveShadow name={`water_seg_${i}`} />
        ))}
      </group>
    );
  };

  const renderDrawbridge = () => {
    if (!drawbridge) return null;
    return (
      <group ref={drawbridgeRef} name="drawbridge_group">
        <mesh geometry={drawbridge} material={getMaterial('wood')} castShadow receiveShadow name="drawbridge" />
      </group>
    );
  };

  const renderPortcullis = () => {
    if (!portcullis) return null;
    return <mesh geometry={portcullis} material={getMaterial('metal')} castShadow receiveShadow name="portcullis" />;
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
      {renderMoatSegments()}
      {renderWater()}
      {renderWaterSegments()}
      {renderDrawbridge()}
      {renderPortcullis()}
      {renderBuildings()}
      <mesh geometry={ground} material={getMaterial('ground')} receiveShadow name="ground" />
    </group>
  );
}
