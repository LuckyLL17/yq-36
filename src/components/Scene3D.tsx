import { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Castle } from './Castle';
import { SiegeScene } from './SiegeScene';
import { Flag3D } from './Flag3D';
import { HeraldryDecoration } from './HeraldryDecoration';
import { useCastleStore } from '@/store/useCastleStore';
import { useSiegeStore } from '@/store/useSiegeStore';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { getInterpolatedStyle } from '@/data/historicalEras';
import { ViewMode } from '@/types/castle';

function CameraController() {
  const { params } = useCastleStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={10}
      maxDistance={150}
      maxPolarAngle={Math.PI / 2.1}
      target={[0, params.wallHeight / 2, 0]}
    />
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#ffeedd" />
      <hemisphereLight args={['#ffeedd', '#3d5c3d', 0.5]} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-20, 20, -30]} intensity={0.3} color="#aaccff" />
    </>
  );
}

function SceneContent({ viewMode }: { viewMode: ViewMode }) {
  const { params } = useCastleStore();
  const siegeMode = useSiegeStore((s) => s.siegeMode);

  const plotPoints = useMemo(() => {
    const generator = new CastleGenerator(params);
    return generator.generatePlotPoints();
  }, [params]);

  const towerInfo = useMemo(() => {
    const style = getInterpolatedStyle(params.eraYear);
    const towerH = params.towerHeight * style.towerHeightMultiplier;
    const towerR = params.towerRadius * style.towerRadiusMultiplier;
    const roofHeight = towerR * 1.2;
    const generator = new CastleGenerator(params);

    const towers: { position: [number, number, number]; rotation: [number, number, number] }[] = [];

    for (let i = 0; i < plotPoints.length; i++) {
      const point = plotPoints[i];
      const nextPoint = plotPoints[(i + 1) % plotPoints.length];
      const dx = nextPoint.x - point.x;
      const dy = nextPoint.y - point.y;
      const angle = Math.atan2(dy, dx);

      const dirX = point.x === 0 ? 0 : (point.x > 0 ? 1 : -1);
      const dirZ = point.y === 0 ? 0 : (point.y > 0 ? 1 : -1);
      const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;

      const terrainH = generator.getTerrainHeight(point.x, point.y);
      const baseY = terrainH + towerH + roofHeight;
      towers.push({
        position: [
          point.x + (dirX / len) * towerR * 0.3,
          baseY,
          point.y + (dirZ / len) * towerR * 0.3,
        ],
        rotation: [0, -angle + Math.PI / 2, 0],
      });
    }

    const additionalTowers = Math.max(0, params.towerCount - plotPoints.length);
    for (let i = 0; i < additionalTowers; i++) {
      const segIndex = i % plotPoints.length;
      const p1 = plotPoints[segIndex];
      const p2 = plotPoints[(segIndex + 1) % plotPoints.length];
      const t = 0.5;
      const midX = p1.x + (p2.x - p1.x) * t;
      const midZ = p1.y + (p2.y - p1.y) * t;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angle = Math.atan2(dy, dx);

      const wx = dx;
      const wz = dy;
      const n1x = -wz;
      const n1z = wx;
      const midVecX = midX;
      const midVecZ = midZ;
      const dot = n1x * midVecX + n1z * midVecZ;
      const outwardX = dot >= 0 ? n1x : -n1x;
      const outwardZ = dot >= 0 ? n1z : -n1z;
      const nLen = Math.sqrt(outwardX * outwardX + outwardZ * outwardZ) || 1;

      const h = towerH * 0.9;
      const r = towerR * 0.9;
      const rH = r * 1.2;

      const terrainH = generator.getTerrainHeight(midX, midZ);

      towers.push({
        position: [
          midX + (outwardX / nLen) * r * 0.3,
          terrainH + h + rH,
          midZ + (outwardZ / nLen) * r * 0.3,
        ],
        rotation: [0, -angle + Math.PI / 2, 0],
      });
    }

    return towers;
  }, [plotPoints, params]);

  const gateFlagInfo = useMemo(() => {
    const p1 = plotPoints[0];
    const p2 = plotPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.y + p2.y) / 2;
    const generator = new CastleGenerator(params);
    const terrainH = generator.getTerrainHeight(midX, midZ);

    const wx = dx;
    const wz = dy;
    const n1x = -wz;
    const n1z = wx;
    const midVecX = midX;
    const midVecZ = midZ;
    const dot = n1x * midVecX + n1z * midVecZ;
    const outwardX = dot >= 0 ? n1x : -n1x;
    const outwardZ = dot >= 0 ? n1z : -n1z;
    const nLen = Math.sqrt(outwardX * outwardX + outwardZ * outwardZ) || 1;

    const gateTopY = terrainH + params.gateHeight + 2;
    const offset = params.wallThickness * 0.6 + 0.5;

    return {
      position: [
        midX + (outwardX / nLen) * offset,
        gateTopY + 0.5,
        midZ + (outwardZ / nLen) * offset,
      ] as [number, number, number],
      rotation: [0, -angle + Math.PI / 2, 0] as [number, number, number],
    };
  }, [plotPoints, params]);

  return (
    <>
      <Castle params={params} viewMode={viewMode} />
      <HeraldryDecoration params={params} />
      {towerInfo.map((info, i) => (
        <Flag3D
          key={`flag_${i}`}
          position={info.position}
          rotation={info.rotation}
          poleHeight={3.5}
          flagWidth={2.2}
          flagHeight={1.4}
        />
      ))}
      <Flag3D
        position={gateFlagInfo.position}
        rotation={gateFlagInfo.rotation}
        poleHeight={3}
        flagWidth={2.8}
        flagHeight={1.8}
      />
      <SiegeScene viewMode={viewMode} />
      <Grid
        position={[0, -0.5, 0]}
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor={siegeMode ? '#4a3535' : '#4a5568'}
        sectionSize={25}
        sectionThickness={1}
        sectionColor={siegeMode ? '#715050' : '#718096'}
        fadeDistance={100}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.3}
        scale={200}
        blur={3}
        far={30}
        color="#000000"
      />
    </>
  );
}

export function Scene3D({ viewMode }: { viewMode: ViewMode }) {
  const siegeMode = useSiegeStore((s) => s.siegeMode);
  const bgColor = siegeMode ? '#1a0e0e' : '#1a1a2e';
  const fogColor = siegeMode ? '#1a0e0e' : '#1a1a2e';

  return (
    <Canvas
      shadows
      camera={{ position: [50, 40, 50], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[fogColor, 80, 180]} />
      
      <Lighting />
      <CameraController />
      <SceneContent viewMode={viewMode} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.5} />
      </EffectComposer>
    </Canvas>
  );
}
