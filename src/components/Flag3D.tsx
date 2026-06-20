import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHeraldryStore } from '@/store/useHeraldryStore';
import { renderHeraldryToCanvas } from '@/utils/HeraldryRenderer';

const vertexShader = `
  uniform float uTime;
  uniform float uWindStrength;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave1 = sin(pos.x * 1.5 + uTime * 2.0) * 0.12 * uWindStrength;
    float wave2 = sin(pos.x * 3.0 + uTime * 3.5) * 0.06 * uWindStrength;
    float wave3 = sin(pos.y * 2.0 + uTime * 1.5) * 0.04 * uWindStrength;

    float distFromPole = uv.x;
    pos.z += (wave1 + wave2 + wave3) * distFromPole * distFromPole;

    float sag = -0.15 * distFromPole * (1.0 - distFromPole) * uWindStrength * 0.3;
    pos.y += sag * sin(uTime * 0.8);

    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec3 uLightDir;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);

    vec3 normal = normalize(vNormal);
    float diffuse = max(dot(normal, normalize(uLightDir)), 0.0);
    float ambient = 0.45;
    float light = ambient + diffuse * 0.55;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfDir = normalize(normalize(uLightDir) + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0) * 0.2;

    gl_FragColor = vec4(texColor.rgb * light + vec3(spec), texColor.a);
  }
`;

interface Flag3DProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  poleHeight?: number;
  flagWidth?: number;
  flagHeight?: number;
}

export function Flag3D({
  position,
  rotation = [0, 0, 0],
  poleHeight = 6,
  flagWidth = 3,
  flagHeight = 2,
}: Flag3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const config = useHeraldryStore((s) => s.config);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    if (config.applied) {
      renderHeraldryToCanvas(ctx, 512, 512, config);
    } else {
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚜', 256, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [config]);

  useEffect(() => {
    if (meshRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      if (config.applied) {
        renderHeraldryToCanvas(ctx, 512, 512, config);
      } else {
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚜', 256, 256);
      }
      texture.image = canvas;
      texture.needsUpdate = true;
    }
  }, [config, texture]);

  const flagGeometry = useMemo(() => {
    const segW = 24;
    const segH = 16;
    const geo = new THREE.PlaneGeometry(flagWidth, flagHeight, segW, segH);
    geo.translate(flagWidth / 2, 0, 0);
    return geo;
  }, [flagWidth, flagHeight]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWindStrength: { value: 1.0 },
      uTexture: { value: texture },
      uLightDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
    }),
    [texture]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uWindStrength.value =
        0.8 + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  const poleGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.04, 0.06, poleHeight, 8);
    geo.translate(0, poleHeight / 2, 0);
    return geo;
  }, [poleHeight]);

  const topGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.12, 8, 8);
    geo.translate(0, poleHeight + 0.08, 0);
    return geo;
  }, [poleHeight]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={poleGeo}>
        <meshStandardMaterial color="#5C4033" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh geometry={topGeo}>
        <meshStandardMaterial color="#DAA520" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh
        ref={meshRef}
        geometry={flagGeometry}
        position={[0, poleHeight - flagHeight / 2 - 0.3, 0.06]}
      >
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
}
