import { useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSiegeStore } from '@/store/useSiegeStore';
import { useCastleStore } from '@/store/useCastleStore';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { WEAPON_CONFIGS } from '@/types/siege';
import { SiegeWeapons } from './SiegeWeapons';
import { AttackEffects } from './AttackEffects';
import { DefenseAnalysis } from './DefenseAnalysis';

function GroundClickHandler() {
  const { raycaster, camera, gl } = useThree();
  const { placementMode, selectedWeaponType, addWeapon, setPlacementMode } = useSiegeStore();
  const { params } = useCastleStore();

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!placementMode) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );

      raycaster.setFromCamera(mouse, camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersection);

      if (!intersection) return;

      const halfW = params.plotWidth / 2 + 2;
      const halfD = params.plotDepth / 2 + 2;
      const insideCastle = Math.abs(intersection.x) < halfW && Math.abs(intersection.z) < halfD;

      if (insideCastle) return;

      const dir = new THREE.Vector2(intersection.x, intersection.z).normalize();
      const rotation = Math.atan2(dir.x, dir.y);

      addWeapon({
        type: selectedWeaponType,
        position: [intersection.x, 0, intersection.z],
        rotation,
      });
      setPlacementMode(false);
    },
    [placementMode, selectedWeaponType, addWeapon, setPlacementMode, raycaster, camera, gl, params],
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [handleClick, gl]);

  return null;
}

function WallClickHandler() {
  const { raycaster, camera, gl } = useThree();
  const { selectedWeaponId, attackWithWeapon, weapons, wallSegments } = useSiegeStore();
  const { params } = useCastleStore();

  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (!selectedWeaponId) return;

      const weapon = weapons.find((w) => w.id === selectedWeaponId);
      if (!weapon) return;

      const config = WEAPON_CONFIGS[weapon.type];
      if (config.range <= 5) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );

      raycaster.setFromCamera(mouse, camera);

      let closestSegment = null;
      let closestDist = Infinity;

      for (const segment of wallSegments) {
        const center = new THREE.Vector3(...segment.centerPosition);
        const dist = raycaster.ray.distanceToPoint(center);
        if (dist < 5 && dist < closestDist) {
          closestDist = dist;
          closestSegment = segment;
        }
      }

      if (closestSegment) {
        const targetPos: [number, number, number] = [
          closestSegment.centerPosition[0],
          closestSegment.centerPosition[1] + closestSegment.height * 0.5,
          closestSegment.centerPosition[2],
        ];
        attackWithWeapon(selectedWeaponId, targetPos);
      } else {
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, intersection);
        if (intersection) {
          attackWithWeapon(selectedWeaponId, [intersection.x, params.wallHeight * 0.5, intersection.z]);
        }
      }
    },
    [selectedWeaponId, weapons, wallSegments, attackWithWeapon, raycaster, camera, gl, params],
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('dblclick', handleDoubleClick);
    return () => canvas.removeEventListener('dblclick', handleDoubleClick);
  }, [handleDoubleClick, gl]);

  return null;
}

function WallSegmentGenerator() {
  const { params } = useCastleStore();
  const { updateWallSegments, wallSegments } = useSiegeStore();

  useEffect(() => {
    const generator = new CastleGenerator(params);
    const plotPoints = generator.generatePlotPoints();
    const segments = [];

    for (let i = 0; i < plotPoints.length; i++) {
      const p1 = plotPoints[i];
      const p2 = plotPoints[(i + 1) % plotPoints.length];

      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.y + p2.y) / 2;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / length;
      const ny = dx / length;

      const existingSegment = wallSegments.find((s) => s.id === `wall_seg_${i}`);

      segments.push({
        id: `wall_seg_${i}`,
        startPosition: [p1.x, 0, p1.y] as [number, number, number],
        endPosition: [p2.x, 0, p2.y] as [number, number, number],
        centerPosition: [midX, params.wallHeight / 2, midZ] as [number, number, number],
        normal: [nx, 0, ny] as [number, number, number],
        health: existingSegment ? existingSegment.health : 100,
        maxHealth: 100,
        thickness: params.wallThickness,
        height: params.wallHeight,
      });

      const subSegments = Math.max(1, Math.floor(length / 5));
      for (let j = 0; j < subSegments; j++) {
        const t1 = j / subSegments;
        const t2 = (j + 1) / subSegments;
        const sx = p1.x + dx * t1;
        const sz = p1.y + dy * t1;
        const ex = p1.x + dx * t2;
        const ez = p1.y + dy * t2;
        const cx = (sx + ex) / 2;
        const cz = (sz + ez) / 2;

        const subId = `wall_seg_${i}_${j}`;
        const existingSub = wallSegments.find((s) => s.id === subId);

        segments.push({
          id: subId,
          startPosition: [sx, 0, sz] as [number, number, number],
          endPosition: [ex, 0, ez] as [number, number, number],
          centerPosition: [cx, params.wallHeight / 2, cz] as [number, number, number],
          normal: [nx, 0, ny] as [number, number, number],
          health: existingSub ? existingSub.health : 100,
          maxHealth: 100,
          thickness: params.wallThickness,
          height: params.wallHeight,
        });
      }
    }

    updateWallSegments(segments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, updateWallSegments]);

  return null;
}

function ProjectileUpdater() {
  const updateProjectiles = useSiegeStore((s) => s.updateProjectiles);

  useFrame((_, delta) => {
    updateProjectiles(Math.min(delta, 0.05));
  });

  return null;
}

function CursorStyleUpdater() {
  const placementMode = useSiegeStore((s) => s.placementMode);
  const selectedWeaponId = useSiegeStore((s) => s.selectedWeaponId);

  useEffect(() => {
    document.body.style.cursor = placementMode ? 'crosshair' : selectedWeaponId ? 'pointer' : 'default';
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [placementMode, selectedWeaponId]);

  return null;
}

export function SiegeScene() {
  const siegeMode = useSiegeStore((s) => s.siegeMode);

  if (!siegeMode) return null;

  return (
    <>
      <GroundClickHandler />
      <WallClickHandler />
      <WallSegmentGenerator />
      <ProjectileUpdater />
      <CursorStyleUpdater />
      <SiegeWeapons />
      <AttackEffects />
      <DefenseAnalysis />
    </>
  );
}
