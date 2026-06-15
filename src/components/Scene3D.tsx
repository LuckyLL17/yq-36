import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Castle } from './Castle';
import { useCastleStore } from '@/store/useCastleStore';
import { ViewMode } from '@/types/castle';

function CameraController() {
  const { params } = useCastleStore();
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

  return (
    <>
      <Castle params={params} viewMode={viewMode} />
      <Grid
        position={[0, -0.09, 0]}
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#4a5568"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#718096"
        fadeDistance={100}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={100}
        blur={2}
        far={10}
        color="#000000"
      />
    </>
  );
}

export function Scene3D({ viewMode }: { viewMode: ViewMode }) {
  return (
    <Canvas
      shadows
      camera={{ position: [50, 40, 50], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 80, 180]} />
      
      <Lighting />
      <CameraController />
      <SceneContent viewMode={viewMode} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.5} />
      </EffectComposer>
    </Canvas>
  );
}
