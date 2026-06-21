import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeatherType } from '@/types/castle';

interface WeatherParticlesProps {
  weather: WeatherType;
}

const PARTICLE_COUNT = 5000;
const AREA_SIZE = 200;
const FALL_HEIGHT = 80;

export function WeatherParticles({ weather }: WeatherParticlesProps) {
  const rainRef = useRef<THREE.Points>(null);
  const snowRef = useRef<THREE.Points>(null);

  const { rainGeometry, snowGeometry } = useMemo(() => {
    const rainPositions = new Float32Array(PARTICLE_COUNT * 3);
    const rainVelocities = new Float32Array(PARTICLE_COUNT);
    const snowPositions = new Float32Array(PARTICLE_COUNT * 3);
    const snowVelocities = new Float32Array(PARTICLE_COUNT);
    const snowSizes = new Float32Array(PARTICLE_COUNT);
    const snowPhases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      rainPositions[i3] = (Math.random() - 0.5) * AREA_SIZE;
      rainPositions[i3 + 1] = Math.random() * FALL_HEIGHT;
      rainPositions[i3 + 2] = (Math.random() - 0.5) * AREA_SIZE;
      rainVelocities[i] = 30 + Math.random() * 20;

      snowPositions[i3] = (Math.random() - 0.5) * AREA_SIZE;
      snowPositions[i3 + 1] = Math.random() * FALL_HEIGHT;
      snowPositions[i3 + 2] = (Math.random() - 0.5) * AREA_SIZE;
      snowVelocities[i] = 3 + Math.random() * 4;
      snowSizes[i] = 0.15 + Math.random() * 0.25;
      snowPhases[i] = Math.random() * Math.PI * 2;
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    (rGeo as unknown as { _velocities: Float32Array })._velocities = rainVelocities;

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    sGeo.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));
    (sGeo as unknown as { _velocities: Float32Array; _phases: Float32Array })._velocities = snowVelocities;
    (sGeo as unknown as { _velocities: Float32Array; _phases: Float32Array })._phases = snowPhases;

    return { rainGeometry: rGeo, snowGeometry: sGeo };
  }, []);

  useFrame((_, delta) => {
    if (weather === 'rainy' && rainRef.current) {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = (rainRef.current.geometry as unknown as { _velocities: Float32Array })._velocities;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        positions[i3 + 1] -= velocities[i] * delta;
        positions[i3] -= 10 * delta;

        if (positions[i3 + 1] < -5) {
          positions[i3] = (Math.random() - 0.5) * AREA_SIZE;
          positions[i3 + 1] = FALL_HEIGHT;
          positions[i3 + 2] = (Math.random() - 0.5) * AREA_SIZE;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (weather === 'snowy' && snowRef.current) {
      const positions = snowRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = (snowRef.current.geometry as unknown as { _velocities: Float32Array })._velocities;
      const phases = (snowRef.current.geometry as unknown as { _phases: Float32Array })._phases;
      const time = performance.now() * 0.001;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        positions[i3 + 1] -= velocities[i] * delta;
        positions[i3] += Math.sin(time * 2 + phases[i]) * 0.5 * delta;
        positions[i3 + 2] += Math.cos(time * 1.5 + phases[i]) * 0.3 * delta;

        if (positions[i3 + 1] < -5) {
          positions[i3] = (Math.random() - 0.5) * AREA_SIZE;
          positions[i3 + 1] = FALL_HEIGHT;
          positions[i3 + 2] = (Math.random() - 0.5) * AREA_SIZE;
        }
      }
      snowRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const showRain = weather === 'rainy';
  const showSnow = weather === 'snowy';

  return (
    <>
      {showRain && (
        <points ref={rainRef} geometry={rainGeometry} frustumCulled={false}>
          <pointsMaterial
            size={0.12}
            color="#a8c8e8"
            transparent
            opacity={0.6}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
      {showSnow && (
        <points ref={snowRef} geometry={snowGeometry} frustumCulled={false}>
          <pointsMaterial
            size={0.3}
            color="#ffffff"
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
            map={createSnowflakeTexture()}
            alphaTest={0.1}
          />
        </points>
      )}
    </>
  );
}

function createSnowflakeTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
