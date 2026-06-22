import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CastleParams, ViewMode, UVMappingMode } from '@/types/castle';
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
  const portcullisRef = useRef<THREE.Group>(null);
  const barLatchRef = useRef<THREE.Group>(null);
  const setCastleGeometries = useCastleStore((state) => state.setCastleGeometries);
  const uvMappingMode = useCastleStore((s) => s.uvMappingMode as UVMappingMode);
  const showSeams = useCastleStore((s) => s.showSeams);
  const [, setAnimProgress] = useState(0);
  const animTargetRef = useRef(0);
  const animCurrentRef = useRef(0);

  const generatorData = useMemo(() => {
    const generator = new CastleGenerator(params);
    const style = getInterpolatedStyle(params.eraYear);
    const result = generator.generateAll(style.crenellationHeightMultiplier);

    const uvGeos: THREE.BufferGeometry[] = [];
    const islands: UVIsland[] = [];

    result.walls.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `wall_${i}`, uvMappingMode);
      islands.push(island);
      uvGeos.push(uvGeo);
    });
    result.towers.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `tower_${i}`, uvMappingMode);
      islands.push(island);
      uvGeos.push(uvGeo);
    });
    const gateUvGeo = result.gate.clone();
    islands.push(UVUnwrapper.unwrapGeometry(gateUvGeo, 'gate', uvMappingMode));
    uvGeos.push(gateUvGeo);
    if (result.gatehouse) {
      const gatehouseUvGeo = result.gatehouse.clone();
      islands.push(UVUnwrapper.unwrapGeometry(gatehouseUvGeo, 'gatehouse', uvMappingMode));
      uvGeos.push(gatehouseUvGeo);
    }
    if (result.moat) {
      const moatUvGeo = result.moat.clone();
      islands.push(UVUnwrapper.unwrapGeometry(moatUvGeo, 'moat', uvMappingMode));
      uvGeos.push(moatUvGeo);
    }
    result.buildings.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `building_${i}`, uvMappingMode);
      islands.push(island);
      uvGeos.push(uvGeo);
    });
    const groundUvGeo = result.ground.clone();
    islands.push(UVUnwrapper.unwrapGeometry(groundUvGeo, 'ground', uvMappingMode));
    uvGeos.push(groundUvGeo);

    UVUnwrapper.packIslands(islands, 0.02);

    const seamGeometry = UVUnwrapper.buildSeamLineSegments(islands);

    return { ...result, uvGeometries: uvGeos, uvIslands: islands, seamGeometry };
  }, [params, uvMappingMode]);

  const { walls, towers, gate, gatehouse, barLatch, moat, moatSegments, water, waterSegments, drawbridge, portcullis, buildings, buildingTypes, ground, uvGeometries, seamGeometry } = generatorData;

  useEffect(() => {
    setCastleGeometries({
      walls,
      towers,
      gate,
      gatehouse,
      barLatch,
      moat,
      moatSegments,
      water,
      waterSegments,
      drawbridge,
      portcullis,
      buildings,
      buildingTypes,
      ground,
    });
  }, [walls, towers, gate, gatehouse, barLatch, moat, moatSegments, water, waterSegments, drawbridge, portcullis, buildings, buildingTypes, ground, setCastleGeometries]);

  const getMaterial = (type: 'stone' | 'wood' | 'roof' | 'ground' | 'water' | 'metal') => {
    if (viewMode === 'wireframe') {
      return MaterialFactory.getWireframeMaterial();
    }
    if (viewMode === 'uv') {
      return MaterialFactory.getCheckerboardMaterial();
    }
    const materialParams = params.materialParams;
    switch (type) {
      case 'stone':
        return MaterialFactory.getStoneMaterial(false, params.wallStyle, materialParams);
      case 'wood':
        return MaterialFactory.getWoodMaterial(false, materialParams);
      case 'roof':
        return MaterialFactory.getRoofMaterial();
      case 'ground':
        return MaterialFactory.getGroundMaterial(materialParams);
      case 'water':
        return MaterialFactory.getWaterMaterial(materialParams);
      case 'metal':
        return new THREE.MeshStandardMaterial({
          color: 0x3a3a3a,
          metalness: 0.9,
          roughness: 0.3,
          wireframe: (viewMode as string) === 'wireframe',
        });
    }
  };

  useFrame((state, delta) => {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const originalY = (positions as any)._originalY !== undefined
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (positions as any)._originalY[i]
            : positions.getY(i);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((positions as any)._originalY === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (positions as any)._originalY = new Float32Array(positions.count);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const originalY = (positions as any)._originalY !== undefined
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? (positions as any)._originalY[i]
                : positions.getY(i);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((positions as any)._originalY === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (positions as any)._originalY = new Float32Array(positions.count);
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (positions as any)._originalY[i] = originalY;
              const wave = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time * 0.7) * params.moatWaterParams.waveHeight;
              positions.setY(i, originalY + wave);
            }
            positions.needsUpdate = true;
          }
        }
      });
    }

    if (params.gateAnimationSync) {
      const speed = 0.3;
      const target = params.drawbridgeAngle > 0 ? 1 : 0;
      animTargetRef.current = target;

      const diff = animTargetRef.current - animCurrentRef.current;
      if (Math.abs(diff) > 0.001) {
        animCurrentRef.current += diff * speed * delta * 2;
        animCurrentRef.current = Math.max(0, Math.min(1, animCurrentRef.current));
        setAnimProgress(animCurrentRef.current);
      }

      const p = animCurrentRef.current;

      if (drawbridgeRef.current) {
        const bridgeAngle = Math.max(0, (p - 0.4) / 0.6) * 75;
        drawbridgeRef.current.rotation.x = -bridgeAngle * (Math.PI / 180);
      }

      if (portcullisRef.current) {
        const portcullisP = Math.max(0, (p - 0.2) / 0.5);
        portcullisRef.current.position.y = portcullisP * params.gateHeight * 0.9;
      }

      if (barLatchRef.current) {
        const latchP = Math.max(0, p / 0.2);
        barLatchRef.current.position.x = latchP * 1.5;
      }
    } else {
      if (drawbridgeRef.current) {
        drawbridgeRef.current.rotation.x = -params.drawbridgeAngle * (Math.PI / 180);
      }
      animCurrentRef.current = params.drawbridgeAngle / 75;
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

  const renderGatehouse = () => {
    if (!gatehouse) return null;
    const idx = walls.length + towers.length + 1;
    const geo = viewMode === 'uv' ? uvGeometries[idx] : gatehouse;
    return <mesh geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name="gatehouse" />;
  };

  const renderBarLatch = () => {
    if (!barLatch) return null;
    return (
      <group ref={barLatchRef} name="bar_latch_group">
        <mesh geometry={barLatch} material={getMaterial('wood')} castShadow receiveShadow name="bar_latch" />
      </group>
    );
  };

  const renderMoat = () => {
    if (!moat) return null;
    const idx = walls.length + towers.length + 1 + (gatehouse ? 1 : 0);
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
    return (
      <group ref={portcullisRef} name="portcullis_group">
        <mesh geometry={portcullis} material={getMaterial('metal')} castShadow receiveShadow name="portcullis" />
      </group>
    );
  };

  const renderBuildings = () => {
    const startIdx = walls.length + towers.length + 1 + (gatehouse ? 1 : 0) + (moat ? 1 : 0);
    const geos = viewMode === 'uv' ? uvGeometries.slice(startIdx, startIdx + buildings.length) : buildings;
    return geos.map((geo, i) => (
      <mesh key={`building_${i}`} geometry={geo} material={getMaterial('stone')} castShadow receiveShadow name={`building_${buildingTypes[i] || i}`} />
    ));
  };

  const renderGround = () => {
    const idx = walls.length + towers.length + 1 + (gatehouse ? 1 : 0) + (moat ? 1 : 0) + buildings.length;
    const geo = viewMode === 'uv' ? uvGeometries[idx] : ground;
    return <mesh geometry={geo} material={getMaterial('ground')} receiveShadow name="ground" />;
  };

  const renderSeams = () => {
    if (!showSeams || !seamGeometry) return null;
    return (
      <lineSegments geometry={seamGeometry} material={MaterialFactory.getSeamLineMaterial()} name="uv_seams" />
    );
  };

  return (
    <group ref={groupRef}>
      {renderWalls()}
      {renderTowers()}
      {renderGate()}
      {renderGatehouse()}
      {renderMoat()}
      {renderMoatSegments()}
      {renderWater()}
      {renderWaterSegments()}
      {renderDrawbridge()}
      {renderPortcullis()}
      {renderBarLatch()}
      {renderBuildings()}
      {renderGround()}
      {renderSeams()}
    </group>
  );
}
