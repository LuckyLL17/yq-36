import { useMemo } from 'react';
import * as THREE from 'three';
import { WeatherType } from '@/types/castle';

interface DynamicLightingProps {
  weather: WeatherType;
  timeOfDay: number;
}

interface LightingConfig {
  ambientColor: string;
  ambientIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  fillColor: string;
  fillIntensity: number;
  fillPosition: [number, number, number];
  bloomIntensity: number;
}

interface EnvironmentConfig {
  bgColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  const result = c1.clone().lerp(c2, t);
  return `#${result.getHexString()}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getTimePhase(time: number): { phase: string; t: number } {
  if (time < 5) return { phase: 'night', t: time / 5 };
  if (time < 7) return { phase: 'dawn', t: (time - 5) / 2 };
  if (time < 10) return { phase: 'morning', t: (time - 7) / 3 };
  if (time < 14) return { phase: 'noon', t: (time - 10) / 4 };
  if (time < 17) return { phase: 'afternoon', t: (time - 14) / 3 };
  if (time < 19) return { phase: 'sunset', t: (time - 17) / 2 };
  return { phase: 'night', t: (time - 19) / 5 };
}

function getSunAngle(time: number): { x: number; y: number; z: number } {
  const normalizedTime = ((time - 6) / 12) * Math.PI;
  const clampedAngle = Math.max(0, Math.min(Math.PI, normalizedTime));
  const height = Math.sin(clampedAngle);
  const horizontal = Math.cos(clampedAngle);
  const sideAngle = ((time - 6) / 24) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(sideAngle) * horizontal * 40,
    y: height * 50 + 5,
    z: Math.sin(sideAngle) * horizontal * 40,
  };
}

const TIME_LIGHTING: Record<string, { ambient: string; sky: string; ground: string; sun: string; fill: string }> = {
  night: { ambient: '#0a0a1a', sky: '#0d1033', ground: '#1a1a2e', sun: '#2a2a4a', fill: '#1a1a3a' },
  dawn: { ambient: '#4a3a5a', sky: '#ff8866', ground: '#3d3040', sun: '#ffaa55', fill: '#ff9977' },
  morning: { ambient: '#ffeedd', sky: '#88ccff', ground: '#3d5c3d', sun: '#fff5e6', fill: '#aaccff' },
  noon: { ambient: '#fffff0', sky: '#aaddff', ground: '#4a6a4a', sun: '#ffffff', fill: '#ccddff' },
  afternoon: { ambient: '#fff5e0', sky: '#99ccf0', ground: '#4a6040', sun: '#fff0cc', fill: '#bbccff' },
  sunset: { ambient: '#6a4a3a', sky: '#ff5533', ground: '#403030', sun: '#ff7744', fill: '#ff6655' },
};

const WEATHER_MODIFIERS: Record<WeatherType, { intensityMult: number; saturationMult: number; fogBoost: number; shadowSoft: number }> = {
  sunny: { intensityMult: 1.0, saturationMult: 1.0, fogBoost: 0, shadowSoft: 1.0 },
  rainy: { intensityMult: 0.4, saturationMult: 0.6, fogBoost: 0.3, shadowSoft: 0.3 },
  snowy: { intensityMult: 0.8, saturationMult: 0.5, fogBoost: 0.15, shadowSoft: 0.5 },
  foggy: { intensityMult: 0.5, saturationMult: 0.4, fogBoost: 0.6, shadowSoft: 0.1 },
};

export function getLightingConfig(weather: WeatherType, timeOfDay: number): LightingConfig {
  const { phase, t } = getTimePhase(timeOfDay);
  const nextPhases: Record<string, string> = {
    night: 'dawn',
    dawn: 'morning',
    morning: 'noon',
    noon: 'afternoon',
    afternoon: 'sunset',
    sunset: 'night',
  };
  const current = TIME_LIGHTING[phase];
  const next = TIME_LIGHTING[nextPhases[phase]];
  const weatherMod = WEATHER_MODIFIERS[weather];

  const sunPos = getSunAngle(timeOfDay);
  const isNight = phase === 'night' || (phase === 'sunset' && t > 0.8) || (phase === 'dawn' && t < 0.2);
  const baseSunIntensity = isNight ? 0.05 : lerp(0.3, 1.2, Math.sin(Math.PI * Math.max(0, (timeOfDay - 6) / 12)));

  const config: LightingConfig = {
    ambientColor: lerpColor(current.ambient, next.ambient, t),
    ambientIntensity: (isNight ? 0.15 : 0.4) * weatherMod.intensityMult,
    hemiSkyColor: lerpColor(current.sky, next.sky, t),
    hemiGroundColor: lerpColor(current.ground, next.ground, t),
    hemiIntensity: (isNight ? 0.1 : 0.5) * weatherMod.intensityMult,
    sunColor: lerpColor(current.sun, next.sun, t),
    sunIntensity: baseSunIntensity * weatherMod.intensityMult,
    sunPosition: [sunPos.x, sunPos.y, sunPos.z],
    fillColor: lerpColor(current.fill, next.fill, t),
    fillIntensity: (isNight ? 0.05 : 0.3) * weatherMod.intensityMult,
    fillPosition: [-sunPos.x * 0.5, Math.max(10, sunPos.y * 0.3), -sunPos.z * 0.5],
    bloomIntensity: isNight ? 0.2 : 0.5 * weatherMod.intensityMult,
  };

  return config;
}

export function getEnvironmentConfig(weather: WeatherType, timeOfDay: number): EnvironmentConfig {
  const { phase, t } = getTimePhase(timeOfDay);
  const nextPhases: Record<string, string> = {
    night: 'dawn',
    dawn: 'morning',
    morning: 'noon',
    noon: 'afternoon',
    afternoon: 'sunset',
    sunset: 'night',
  };
  const current = TIME_LIGHTING[phase];
  const next = TIME_LIGHTING[nextPhases[phase]];
  const weatherMod = WEATHER_MODIFIERS[weather];

  const isNight = phase === 'night' || (phase === 'sunset' && t > 0.8) || (phase === 'dawn' && t < 0.2);
  const baseBg = lerpColor(current.sky, next.sky, t);

  const foggyTint = weather === 'foggy' ? '#cccccc' : weather === 'rainy' ? '#556677' : weather === 'snowy' ? '#ddeeff' : baseBg;
  const finalBg = lerpColor(baseBg, foggyTint, weatherMod.fogBoost * 0.7);

  const baseFogNear = 80;
  const baseFogFar = 180;
  const fogReduction = 1 - weatherMod.fogBoost;

  return {
    bgColor: isNight && weather === 'sunny' ? baseBg : finalBg,
    fogColor: finalBg,
    fogNear: baseFogNear * fogReduction,
    fogFar: baseFogFar * fogReduction,
  };
}

export function DynamicLighting({ weather, timeOfDay }: DynamicLightingProps) {
  const config = useMemo(() => getLightingConfig(weather, timeOfDay), [weather, timeOfDay]);

  return (
    <>
      <ambientLight intensity={config.ambientIntensity} color={config.ambientColor} />
      <hemisphereLight args={[config.hemiSkyColor, config.hemiGroundColor, config.hemiIntensity]} />
      <directionalLight
        position={config.sunPosition}
        intensity={config.sunIntensity}
        color={config.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0001}
        shadow-radius={WEATHER_MODIFIERS[weather].shadowSoft * 4}
      />
      <directionalLight
        position={config.fillPosition}
        intensity={config.fillIntensity}
        color={config.fillColor}
      />
    </>
  );
}
