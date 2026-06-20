import { create } from 'zustand';
import { SiegeState, WEAPON_CONFIGS, Projectile, WeakPoint, DefensePosition } from '@/types/siege';

let nextWeaponId = 1;
let nextProjectileId = 1;
let nextImpactId = 1;

export const useSiegeStore = create<SiegeState>((set, get) => ({
  siegeMode: false,
  placementMode: false,
  selectedWeaponType: 'catapult',
  weapons: [],
  wallSegments: [],
  weakPoints: [],
  defensePositions: [],
  projectiles: [],
  impacts: [],
  selectedWeaponId: null,
  showAnalysis: false,

  setSiegeMode: (mode) => set({
    siegeMode: mode,
    placementMode: false,
    selectedWeaponId: null,
    showAnalysis: false,
    projectiles: [],
    impacts: [],
  }),

  setPlacementMode: (mode) => set({ placementMode: mode, selectedWeaponId: mode ? null : get().selectedWeaponId }),

  setSelectedWeaponType: (type) => set({ selectedWeaponType: type }),

  addWeapon: (weapon) => {
    const newWeapon = {
      ...weapon,
      id: `weapon_${nextWeaponId++}`,
      cooldown: 0,
      isAttacking: false,
      health: 100,
      maxHealth: 100,
    };
    set((state) => ({ weapons: [...state.weapons, newWeapon] }));
  },

  removeWeapon: (id) => set((state) => ({
    weapons: state.weapons.filter((w) => w.id !== id),
    selectedWeaponId: state.selectedWeaponId === id ? null : state.selectedWeaponId,
  })),

  selectWeapon: (id) => set({ selectedWeaponId: id, placementMode: false }),

  attackWithWeapon: (id, targetPosition) => {
    const state = get();
    const weapon = state.weapons.find((w) => w.id === id);
    if (!weapon || weapon.cooldown > 0 || weapon.isAttacking) return;

    const config = WEAPON_CONFIGS[weapon.type];
    const dx = targetPosition[0] - weapon.position[0];
    const dz = targetPosition[2] - weapon.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > config.range) return;

    const projectile: Projectile = {
      id: `proj_${nextProjectileId++}`,
      weaponId: id,
      startPosition: [weapon.position[0], weapon.position[1] + 3, weapon.position[2]],
      targetPosition,
      progress: 0,
      speed: weapon.type === 'ballista' ? 2.0 : 1.0,
      damage: config.damage,
      type: weapon.type,
    };

    set((state) => ({
      weapons: state.weapons.map((w) =>
        w.id === id ? { ...w, isAttacking: true, cooldown: config.attackSpeed } : w
      ),
      projectiles: [...state.projectiles, projectile],
    }));
  },

  updateWallSegments: (segments) => set({ wallSegments: segments }),

  analyzeDefense: () => {
    const state = get();
    const { weapons, wallSegments } = state;

    if (wallSegments.length === 0) return;

    const weakPoints: WeakPoint[] = [];
    const defensePositions: DefensePosition[] = [];

    wallSegments.forEach((segment) => {
      const healthRatio = segment.health / segment.maxHealth;

      let threatLevel = 0;
      weapons.forEach((weapon) => {
        const dx = segment.centerPosition[0] - weapon.position[0];
        const dz = segment.centerPosition[2] - weapon.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        const config = WEAPON_CONFIGS[weapon.type];

        if (distance <= config.range) {
          threatLevel += config.damage / Math.max(distance, 1);
        }
      });

      if (threatLevel > 0.5 || healthRatio < 0.7) {
        weakPoints.push({
          position: [
            segment.centerPosition[0] + segment.normal[0] * 0.5,
            segment.centerPosition[1] + segment.height * 0.6,
            segment.centerPosition[2] + segment.normal[2] * 0.5,
          ],
          severity: Math.min(1, threatLevel + (1 - healthRatio)),
          wallSegmentId: segment.id,
          description: healthRatio < 0.5
            ? '城墙严重受损'
            : threatLevel > 1.5
              ? '遭受集中火力攻击'
              : '防御薄弱区域',
        });
      }

      const segDx = segment.endPosition[0] - segment.startPosition[0];
      const segDz = segment.endPosition[2] - segment.startPosition[2];
      const segLen = Math.sqrt(segDx * segDx + segDz * segDz);

      const nearWeapons = weapons.filter((weapon) => {
        const dx = segment.centerPosition[0] - weapon.position[0];
        const dz = segment.centerPosition[2] - weapon.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance <= 20;
      });

      if (nearWeapons.length > 0 && segLen > 4) {
        const normalX = segment.normal[0];
        const normalZ = segment.normal[2];
        defensePositions.push({
          position: [
            segment.centerPosition[0] - normalX * 2,
            segment.centerPosition[1] + segment.height * 0.8,
            segment.centerPosition[2] - normalZ * 2,
          ],
          coverage: Math.min(1, nearWeapons.length * 0.3 + (1 - healthRatio) * 0.4),
          wallSegmentId: segment.id,
          description: nearWeapons.length >= 3
            ? '重点防御位置 - 可覆盖多个攻城武器'
            : '建议增援防守',
        });
      }
    });

    set({ weakPoints, defensePositions, showAnalysis: true });
  },

  setShowAnalysis: (show) => set({ showAnalysis: show }),

  updateProjectiles: (delta) => {
    const state = get();
    const updatedProjectiles: Projectile[] = [];
    const newImpacts = [...state.impacts];
    const updatedWeapons = [...state.weapons];
    const updatedSegments = [...state.wallSegments];

    state.projectiles.forEach((proj) => {
      const newProgress = proj.progress + delta * proj.speed * 0.3;

      if (newProgress >= 1) {
        const targetSeg = updatedSegments.find((seg) => {
          const dx = seg.centerPosition[0] - proj.targetPosition[0];
          const dz = seg.centerPosition[2] - proj.targetPosition[2];
          return Math.sqrt(dx * dx + dz * dz) < 10;
        });

        if (targetSeg) {
          const segIdx = updatedSegments.indexOf(targetSeg);
          updatedSegments[segIdx] = {
            ...targetSeg,
            health: Math.max(0, targetSeg.health - proj.damage),
          };
        }

        newImpacts.push({
          id: `impact_${nextImpactId++}`,
          position: proj.targetPosition,
          progress: 0,
          damage: proj.damage,
        });

        const weaponIdx = updatedWeapons.findIndex((w) => w.id === proj.weaponId);
        if (weaponIdx !== -1) {
          updatedWeapons[weaponIdx] = { ...updatedWeapons[weaponIdx], isAttacking: false };
        }
      } else {
        updatedProjectiles.push({ ...proj, progress: newProgress });
      }
    });

    const updatedWeaponsWithCooldown = updatedWeapons.map((w) => ({
      ...w,
      cooldown: Math.max(0, w.cooldown - delta),
    }));

    const updatedImpacts = newImpacts
      .map((imp) => ({ ...imp, progress: imp.progress + delta * 2 }))
      .filter((imp) => imp.progress < 1);

    set({
      projectiles: updatedProjectiles,
      impacts: updatedImpacts,
      weapons: updatedWeaponsWithCooldown,
      wallSegments: updatedSegments,
    });
  },

  clearWeapons: () => set({
    weapons: [],
    projectiles: [],
    impacts: [],
    weakPoints: [],
    defensePositions: [],
    selectedWeaponId: null,
  }),
}));
