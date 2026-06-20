import { Crosshair, Swords, Shield, Trash2, Target, Zap, BarChart3, Info } from 'lucide-react';
import { useSiegeStore } from '@/store/useSiegeStore';
import { WEAPON_CONFIGS, WeaponType } from '@/types/siege';
import { CollapsibleSection } from './CollapsibleSection';
import { cn } from '@/lib/utils';

const WEAPON_ICONS: Record<WeaponType, string> = {
  catapult: '🪨',
  trebuchet: '⚔️',
  siege_tower: '🗼',
  battering_ram: '🐏',
  ballista: '🏹',
};

export function SiegeControlPanel() {
  const {
    placementMode,
    setPlacementMode,
    selectedWeaponType,
    setSelectedWeaponType,
    weapons,
    selectedWeaponId,
    selectWeapon,
    removeWeapon,
    analyzeDefense,
    showAnalysis,
    setShowAnalysis,
    weakPoints,
    defensePositions,
    wallSegments,
  } = useSiegeStore();

  const selectedWeapon = weapons.find((w) => w.id === selectedWeaponId);
  const weaponTypes = Object.values(WEAPON_CONFIGS);

  return (
    <div className="w-80 bg-stone-900/95 backdrop-blur-sm border-r border-red-900/30 flex flex-col h-full">
      <div className="p-4 border-b border-red-900/30 bg-gradient-to-r from-stone-900 to-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/20 rounded-lg">
            <Swords className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-red-100 tracking-wide">
              城堡攻防沙盘
            </h1>
            <p className="text-xs text-stone-400">部署武器 · 分析防御 · 发起进攻</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
        <CollapsibleSection title="武器选择" icon={<Crosshair className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-2">
            {weaponTypes.map((config) => (
              <button
                key={config.type}
                onClick={() => {
                  setSelectedWeaponType(config.type);
                  setPlacementMode(true);
                }}
                className={cn(
                  'flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all text-center',
                  selectedWeaponType === config.type && placementMode
                    ? 'border-red-500 bg-red-900/30 text-red-200 shadow-lg shadow-red-500/10'
                    : 'border-stone-700 bg-stone-800/50 text-stone-300 hover:border-red-500/50 hover:bg-stone-800'
                )}
              >
                <span className="text-xl">{WEAPON_ICONS[config.type]}</span>
                <span className="text-xs font-medium">{config.name}</span>
                <span className="text-[10px] text-stone-500">
                  {config.range > 5 ? `射程 ${config.range}m` : '近战'}
                </span>
              </button>
            ))}
          </div>

          {placementMode && (
            <div className="mt-3 p-2.5 bg-red-900/20 border border-red-800/40 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <Target className="w-3.5 h-3.5 animate-pulse" />
                <span>点击城堡周围地面放置{WEAPON_CONFIGS[selectedWeaponType].name}</span>
              </div>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="已部署武器" icon={<Swords className="w-4 h-4" />} defaultOpen={true}>
          {weapons.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-3">尚未部署任何武器</p>
          ) : (
            <div className="space-y-2">
              {weapons.map((weapon) => {
                const config = WEAPON_CONFIGS[weapon.type];
                const healthPercent = (weapon.health / weapon.maxHealth) * 100;

                return (
                  <div
                    key={weapon.id}
                    onClick={() => selectWeapon(weapon.id)}
                    className={cn(
                      'p-2.5 rounded-lg border cursor-pointer transition-all',
                      selectedWeaponId === weapon.id
                        ? 'border-red-500 bg-red-900/20'
                        : 'border-stone-700 bg-stone-800/50 hover:border-stone-600'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{WEAPON_ICONS[weapon.type]}</span>
                        <span className="text-xs font-medium text-stone-200">{config.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {weapon.cooldown > 0 && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            CD {weapon.cooldown.toFixed(1)}s
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWeapon(weapon.id);
                          }}
                          className="p-1 text-stone-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${healthPercent}%`,
                            backgroundColor: healthPercent > 60 ? '#22cc44' : healthPercent > 30 ? '#ccaa22' : '#cc2222',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>

        {selectedWeapon && (
          <CollapsibleSection title="武器控制" icon={<Zap className="w-4 h-4" />} defaultOpen={true}>
            <div className="space-y-3">
              <div className="p-2.5 bg-stone-800/80 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">武器</span>
                  <span className="text-xs text-stone-200 font-medium">
                    {WEAPON_ICONS[selectedWeapon.type]} {WEAPON_CONFIGS[selectedWeapon.type].name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">射程</span>
                  <span className="text-xs text-amber-400">{WEAPON_CONFIGS[selectedWeapon.type].range}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">伤害</span>
                  <span className="text-xs text-red-400">{WEAPON_CONFIGS[selectedWeapon.type].damage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">位置</span>
                  <span className="text-xs text-stone-300 font-mono">
                    ({selectedWeapon.position[0].toFixed(1)}, {selectedWeapon.position[2].toFixed(1)})
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                选中武器后，点击城墙上的目标位置发起攻击
              </p>
            </div>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="防御分析" icon={<Shield className="w-4 h-4" />} defaultOpen={false}>
          <div className="space-y-3">
            <button
              onClick={analyzeDefense}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                showAnalysis
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-stone-700 text-stone-200 hover:bg-red-600 hover:text-white'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              {showAnalysis ? '重新分析' : '分析防御'}
            </button>

            {showAnalysis && (
              <div className="space-y-2">
                {weakPoints.length > 0 && (
                  <div className="p-2.5 bg-red-900/20 border border-red-800/30 rounded-lg">
                    <h4 className="text-xs font-semibold text-red-400 mb-2">⚠️ 防御薄弱点 ({weakPoints.length})</h4>
                    <div className="space-y-1.5">
                      {weakPoints.slice(0, 5).map((wp, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className="w-2 h-2 mt-1 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: wp.severity > 0.7 ? '#ff2200' : wp.severity > 0.4 ? '#ff6600' : '#ffaa00',
                            }}
                          />
                          <div>
                            <span className="text-[11px] text-stone-300">{wp.description}</span>
                            <span className="text-[10px] text-stone-500 ml-1">
                              危险度 {(wp.severity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {defensePositions.length > 0 && (
                  <div className="p-2.5 bg-green-900/20 border border-green-800/30 rounded-lg">
                    <h4 className="text-xs font-semibold text-green-400 mb-2">🛡️ 最佳防守位置 ({defensePositions.length})</h4>
                    <div className="space-y-1.5">
                      {defensePositions.slice(0, 5).map((dp, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-2 h-2 mt-1 rounded-full bg-green-400 flex-shrink-0" />
                          <div>
                            <span className="text-[11px] text-stone-300">{dp.description}</span>
                            <span className="text-[10px] text-stone-500 ml-1">
                              覆盖率 {(dp.coverage * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {weakPoints.length === 0 && defensePositions.length === 0 && (
                  <p className="text-xs text-stone-500 text-center py-2">
                    放置武器后点击分析查看防御评估
                  </p>
                )}

                <button
                  onClick={() => setShowAnalysis(false)}
                  className="w-full text-xs text-stone-500 hover:text-stone-300 py-1 transition-colors"
                >
                  隐藏分析标注
                </button>
              </div>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="战况统计" icon={<BarChart3 className="w-4 h-4" />} defaultOpen={false}>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">城墙总段数</span>
              <span className="text-stone-200">{wallSegments.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">已受损段数</span>
              <span className="text-red-400">
                {wallSegments.filter((s) => s.health < s.maxHealth).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">平均耐久</span>
              <span className={cn(
                wallSegments.length === 0
                  ? 'text-stone-200'
                  : wallSegments.reduce((a, s) => a + s.health / s.maxHealth, 0) / wallSegments.length > 0.6
                    ? 'text-green-400'
                    : 'text-red-400'
              )}>
                {wallSegments.length === 0
                  ? '-'
                  : `${((wallSegments.reduce((a, s) => a + s.health / s.maxHealth, 0) / wallSegments.length) * 100).toFixed(0)}%`
                }
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">攻城武器数</span>
              <span className="text-amber-400">{weapons.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">薄弱点数</span>
              <span className="text-red-400">{weakPoints.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">防守位置数</span>
              <span className="text-green-400">{defensePositions.length}</span>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div className="p-3 border-t border-red-900/30 bg-stone-900">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Swords className="w-3 h-3" />
          <span>点击地面放置武器 · 点击武器选中 · 点击城墙攻击</span>
        </div>
      </div>
    </div>
  );
}
