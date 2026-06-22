import { useState } from 'react';
import { Castle, Shield, Building2, Droplets, DoorOpen, Hash, Palette, Mountain, CloudSun, Clock, Users, Layers, ChevronDown, ChevronUp, Anchor, Waves, TrendingUp, Castle as CastleIcon, Lock, Unlock, Unlink, Link2, TreeDeciduous, Droplet, Scissors, Fan, Leaf, RotateCcw, Shuffle, Eye, Settings, Dna, Grid3x3, GitBranch, Play } from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';
import { CollapsibleSection } from './CollapsibleSection';
import { SliderControl } from './SliderControl';
import { ToggleControl } from './ToggleControl';
import { PanelSettingsDialog } from './PanelSettingsDialog';
import { cn } from '@/lib/utils';
import { TerrainType, TERRAIN_PRESETS, WeatherType, WEATHER_PRESETS, NPC_TYPE_INFO, NPCType, WallStyle, WALL_STYLE_PRESETS, TowerType, TOWER_TYPE_INFO, MoatSegment, BuildingType, BUILDING_TYPE_INFO, PanelGroupId, GenerationAlgorithm, GENERATION_ALGORITHM_INFO, LSystemConfig, CellularAutomataConfig, EvolutionConfig, DEFAULT_LSYSTEM_CONFIG, DEFAULT_CELLULAR_AUTOMATA_CONFIG, DEFAULT_EVOLUTION_CONFIG } from '@/types/castle';
import { LSystemEngine } from '@/utils/generation/LSystemEngine';
import { CellularAutomataEngine } from '@/utils/generation/CellularAutomataEngine';

const GROUP_PARAMS: Record<PanelGroupId, string[]> = {
  terrain: ['terrainType', 'terrainAmplitude', 'terrainFrequency', 'terrainScale'],
  weather: ['weather', 'timeOfDay'],
  wallStyle: ['wallStyle'],
  plot: ['plotWidth', 'plotDepth'],
  walls: ['wallHeight', 'wallThickness'],
  towers: ['towerType', 'towerCount', 'towerHeight', 'towerRadius',
    'towerSpecificParams.squareFort.crenellationHeight',
    'towerSpecificParams.squareFort.buttressCount',
    'towerSpecificParams.squareFort.windowRows',
    'towerSpecificParams.polygonTower.sides',
    'towerSpecificParams.polygonTower.pinnacleCount',
    'towerSpecificParams.polygonTower.turretHeight',
    'towerSpecificParams.spiralStair.stairWidth',
    'towerSpecificParams.spiralStair.stairTurns',
    'towerSpecificParams.spiralStair.centralColumnRadius',
    'towerSpecificParams.gatehouse.archWidth',
    'towerSpecificParams.gatehouse.archHeight',
    'towerSpecificParams.gatehouse.towerSpacing',
    'towerSpecificParams.gatehouse.gatehouseDepth',
    'towerSpecificParams.gatehouse.hasBattlements',
    'towerSpecificParams.gatehouse.hasMurderHoles',
    'towerSpecificParams.gatehouse.hasBarbican'],
  gates: ['gateWidth', 'gateHeight', 'hasGatehouse', 'hasBarLatch', 'barLatchPosition', 'gateAnimationSync'],
  moat: ['hasMoat', 'moatWidth', 'moatDepth', 'hasDrawbridge', 'drawbridgeAngle',
    'hasPortcullis', 'portcullisPosition',
    'moatWaterParams.globalWaterLevel',
    'moatWaterParams.waveHeight',
    'moatWaterParams.flowSpeed',
    'moatWaterParams.isAnimated'],
  buildings: ['buildingHeight', 'buildingTypeDistribution.main_keep',
    'buildingTypeDistribution.great_hall',
    'buildingTypeDistribution.chapel',
    'buildingTypeDistribution.stable',
    'buildingTypeDistribution.barracks'],
  residents: ['residentMode', 'residentCount', 'farmerRatio', 'soldierRatio', 'nobleRatio'],
  materials: ['materialParams.agingLevel',
    'materialParams.mossCoverage',
    'materialParams.stoneCrackLevel',
    'materialParams.stoneStainLevel',
    'materialParams.woodGrainLevel',
    'materialParams.woodRingLevel',
    'materialParams.waterRippleLevel',
    'materialParams.waterClarity'],
  seed: ['seed'],
  generation: ['generationAlgorithm'],
};

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getTimeEmoji(hours: number): string {
  if (hours < 5 || hours >= 20) return '🌙';
  if (hours < 7) return '🌅';
  if (hours < 10) return '🌄';
  if (hours < 17) return '☀️';
  if (hours < 19) return '🌇';
  return '🌆';
}

export function ControlPanel() {
  const [showPanelSettings, setShowPanelSettings] = useState(false);
  const {
    params,
    setParams,
    applyTerrainType,
    applyWallStyle,
    applyWeather,
    setTimeOfDay,
    applyTowerType,
    updateTowerSpecificParams,
    setDrawbridgeAngle,
    setPortcullisPosition,
    updateMoatSegment,
    setBarLatchPosition,
    setBuildingTypeDistribution,
    toggleGateAnimationSync,
    openGateSequence,
    closeGateSequence,
    setMaterialParams,
    resetMaterialParams,
    lockedParams,
    panelGroups,
    toggleParamLock,
    isParamLocked,
    togglePanelGroup,
    setPanelGroupVisible,
    randomizeAllParams,
    lockAllParams,
    unlockAllParams,
    setGenerationAlgorithm,
    updateLSystemConfig,
    updateCellularAutomataConfig,
    updateEvolutionConfig,
    runEvolution,
    evolutionStats,
  } = useCastleStore();

  const isGroupLocked = (groupId: PanelGroupId): boolean => {
    const params = GROUP_PARAMS[groupId];
    return params.length > 0 && params.every(p => lockedParams.has(p));
  };

  const toggleGroupLock = (groupId: PanelGroupId) => {
    const params = GROUP_PARAMS[groupId];
    const allLocked = isGroupLocked(groupId);
    params.forEach(p => {
      if (allLocked && lockedParams.has(p)) {
        toggleParamLock(p);
      } else if (!allLocked && !lockedParams.has(p)) {
        toggleParamLock(p);
      }
    });
  };

  const handleShowAllPanels = () => {
    (Object.keys(panelGroups) as PanelGroupId[]).forEach(id => {
      setPanelGroupVisible(id, true);
    });
  };

  const handleHideAllPanels = () => {
    (Object.keys(panelGroups) as PanelGroupId[]).forEach(id => {
      setPanelGroupVisible(id, false);
    });
  };

  const lockedCount = lockedParams.size;

  return (
    <div className="w-80 bg-stone-900/95 backdrop-blur-sm border-r border-amber-900/30 flex flex-col h-full">
      <div className="p-4 border-b border-amber-900/30 bg-gradient-to-r from-stone-900 to-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600/20 rounded-lg">
            <Castle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-100 tracking-wide">
              城堡生成器
            </h1>
            <p className="text-xs text-stone-400">程序化中世纪城堡</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-amber-900/30 bg-stone-800/50">
        <div className="flex gap-2">
          <button
            onClick={randomizeAllParams}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-xs font-medium transition-colors"
            title="一键随机所有未锁定的参数"
          >
            <Shuffle className="w-3.5 h-3.5" />
            随机化
          </button>
          <button
            onClick={lockAllParams}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-stone-200 text-xs font-medium transition-colors"
            title="锁定所有参数"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={unlockAllParams}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-stone-200 text-xs font-medium transition-colors"
            title="解锁所有参数"
          >
            <Unlock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowPanelSettings(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-stone-200 text-xs font-medium transition-colors"
            title="设置面板显示"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
        {lockedCount > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-amber-400">
            <Lock className="w-3 h-3" />
            <span>已锁定 {lockedCount} 个参数</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
        {panelGroups.terrain && (
        <CollapsibleSection
          title="地形设置"
          icon={<Mountain className="w-4 h-4" />}
          locked={isGroupLocked('terrain')}
          onToggleLock={() => toggleGroupLock('terrain')}
        >
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择地形类型</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TERRAIN_PRESETS) as TerrainType[]).map((type) => {
                const preset = TERRAIN_PRESETS[type];
                const isSelected = params.terrainType === type;
                const locked = isParamLocked('terrainType');
                return (
                  <button
                    key={type}
                    onClick={() => !locked && applyTerrainType(type)}
                    disabled={locked}
                    className={cn(
                      'p-2 rounded-lg border transition-all text-center',
                      locked ? 'opacity-50 cursor-not-allowed' : '',
                      isSelected
                        ? 'bg-amber-600/30 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    )}
                  >
                    <div className="text-lg mb-0.5">{preset.icon}</div>
                    <div className={`text-xs font-medium ${isSelected ? 'text-amber-300' : 'text-stone-300'}`}>
                      {preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 italic">
              {TERRAIN_PRESETS[params.terrainType].description}
            </p>
          </div>
          <SliderControl
            label="地形起伏"
            value={params.terrainAmplitude}
            min={0}
            max={15}
            step={0.2}
            onChange={(v) => setParams({ terrainAmplitude: v })}
            unit="m"
            locked={isParamLocked('terrainAmplitude')}
            paramKey="terrainAmplitude"
            onToggleLock={toggleParamLock}
          />
          <SliderControl
            label="地形频率"
            value={params.terrainFrequency}
            min={0.5}
            max={6}
            step={0.1}
            onChange={(v) => setParams({ terrainFrequency: v })}
            locked={isParamLocked('terrainFrequency')}
            paramKey="terrainFrequency"
            onToggleLock={toggleParamLock}
          />
          <SliderControl
            label="地形粗糙度"
            value={params.terrainScale}
            min={0.01}
            max={0.1}
            step={0.005}
            onChange={(v) => setParams({ terrainScale: v })}
            locked={isParamLocked('terrainScale')}
            paramKey="terrainScale"
            onToggleLock={toggleParamLock}
          />
        </CollapsibleSection>
        )}

        {panelGroups.weather && (
        <CollapsibleSection
          title="天气环境"
          icon={<CloudSun className="w-4 h-4" />}
          locked={isGroupLocked('weather')}
          onToggleLock={() => toggleGroupLock('weather')}
        >
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择天气类型</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(WEATHER_PRESETS) as WeatherType[]).map((type) => {
                const preset = WEATHER_PRESETS[type];
                const isSelected = params.weather === type;
                const locked = isParamLocked('weather');
                return (
                  <button
                    key={type}
                    onClick={() => !locked && applyWeather(type)}
                    disabled={locked}
                    className={cn(
                      'p-2 rounded-lg border transition-all text-center',
                      locked ? 'opacity-50 cursor-not-allowed' : '',
                      isSelected
                        ? 'bg-sky-600/30 border-sky-500 ring-1 ring-sky-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    )}
                  >
                    <div className="text-lg mb-0.5">{preset.icon}</div>
                    <div className={`text-xs font-medium ${isSelected ? 'text-sky-300' : 'text-stone-300'}`}>
                      {preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 italic">
              {WEATHER_PRESETS[params.weather].description}
            </p>
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <label className={cn(
                  "font-medium flex items-center gap-1.5",
                  isParamLocked('timeOfDay') ? "text-stone-500" : "text-stone-400"
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  时间滑块
                </label>
                <button
                  onClick={() => toggleParamLock('timeOfDay')}
                  className={cn(
                    "p-0.5 rounded transition-colors",
                    isParamLocked('timeOfDay')
                      ? "text-amber-500"
                      : "text-stone-600 hover:text-stone-400"
                  )}
                  title={isParamLocked('timeOfDay') ? "解锁参数" : "锁定参数"}
                >
                  {isParamLocked('timeOfDay') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
              </div>
              <span className="text-amber-500 font-mono tabular-nums">
                {getTimeEmoji(params.timeOfDay)} {formatTime(params.timeOfDay)}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-indigo-400">🌙</span>
              <div className="relative flex-1">
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={0.1}
                  value={params.timeOfDay}
                  onChange={(e) => !isParamLocked('timeOfDay') && setTimeOfDay(parseFloat(e.target.value))}
                  disabled={isParamLocked('timeOfDay')}
                  className={cn(
                    "w-full h-2 rounded-full appearance-none",
                    isParamLocked('timeOfDay') ? "cursor-not-allowed" : "cursor-pointer",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-4",
                    "[&::-webkit-slider-thumb]:h-4",
                    "[&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:bg-amber-500",
                    "[&::-webkit-slider-thumb]:shadow-lg",
                    "[&::-webkit-slider-thumb]:shadow-amber-500/30",
                    "[&::-webkit-slider-thumb]:transition-transform",
                    !isParamLocked('timeOfDay') && "[&::-webkit-slider-thumb]:hover:scale-110",
                    "[&::-moz-range-thumb]:w-4",
                    "[&::-moz-range-thumb]:h-4",
                    "[&::-moz-range-thumb]:rounded-full",
                    "[&::-moz-range-thumb]:bg-amber-500",
                    "[&::-moz-range-thumb]:border-none"
                  )}
                  style={{
                    background: `linear-gradient(to right, #312e81 0%, #f97316 25%, #fcd34d 50%, #f97316 75%, #312e81 100%)`,
                    opacity: isParamLocked('timeOfDay') ? 0.5 : 1,
                  }}
                />
              </div>
              <span className="text-xs text-indigo-400">🌙</span>
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '深夜', value: 2, emoji: '🌙' },
              { label: '日出', value: 6, emoji: '🌅' },
              { label: '正午', value: 12, emoji: '☀️' },
              { label: '日落', value: 18, emoji: '🌇' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => !isParamLocked('timeOfDay') && setTimeOfDay(preset.value)}
                disabled={isParamLocked('timeOfDay')}
                className={cn(
                  'px-2 py-1.5 rounded border text-xs transition-all',
                  isParamLocked('timeOfDay') ? 'opacity-50 cursor-not-allowed' : '',
                  Math.abs(params.timeOfDay - preset.value) < 0.5
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-700/50 hover:border-stone-600 hover:text-stone-300'
                )}
              >
                <div className="text-sm">{preset.emoji}</div>
                <div className="text-[10px]">{preset.label}</div>
              </button>
            ))}
          </div>
        </CollapsibleSection>
        )}

        {panelGroups.wallStyle && (
        <CollapsibleSection
          title="城墙风格"
          icon={<Layers className="w-4 h-4" />}
          locked={isGroupLocked('wallStyle')}
          onToggleLock={() => toggleGroupLock('wallStyle')}
        >
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择城墙建筑风格</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(WALL_STYLE_PRESETS) as WallStyle[]).map((style) => {
                const preset = WALL_STYLE_PRESETS[style];
                const isSelected = params.wallStyle === style;
                const locked = isParamLocked('wallStyle');
                return (
                  <button
                    key={style}
                    onClick={() => !locked && applyWallStyle(style)}
                    disabled={locked}
                    className={cn(
                      'p-2 rounded-lg border transition-all text-center',
                      locked ? 'opacity-50 cursor-not-allowed' : '',
                      isSelected
                        ? 'bg-amber-600/30 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    )}
                  >
                    <div className="text-lg mb-0.5">{preset.icon}</div>
                    <div className={`text-xs font-medium ${isSelected ? 'text-amber-300' : 'text-stone-300'}`}>
                      {preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 italic">
              {WALL_STYLE_PRESETS[params.wallStyle].description}
            </p>
          </div>
        </CollapsibleSection>
        )}

        {panelGroups.plot && (
        <CollapsibleSection
          title="地块设置"
          icon={<Shield className="w-4 h-4" />}
          locked={isGroupLocked('plot')}
          onToggleLock={() => toggleGroupLock('plot')}
        >
          <SliderControl
            label="地块宽度"
            value={params.plotWidth}
            min={20}
            max={80}
            step={1}
            onChange={(v) => setParams({ plotWidth: v })}
            unit="m"
            locked={isParamLocked('plotWidth')}
            paramKey="plotWidth"
            onToggleLock={toggleParamLock}
          />
          <SliderControl
            label="地块深度"
            value={params.plotDepth}
            min={15}
            max={60}
            step={1}
            onChange={(v) => setParams({ plotDepth: v })}
            unit="m"
            locked={isParamLocked('plotDepth')}
            paramKey="plotDepth"
            onToggleLock={toggleParamLock}
          />
        </CollapsibleSection>
        )}

        {panelGroups.walls && (
        <CollapsibleSection
          title="城墙设置"
          icon={<Building2 className="w-4 h-4" />}
          locked={isGroupLocked('walls')}
          onToggleLock={() => toggleGroupLock('walls')}
        >
          <SliderControl
            label="城墙高度"
            value={params.wallHeight}
            min={4}
            max={20}
            step={0.5}
            onChange={(v) => setParams({ wallHeight: v })}
            unit="m"
            locked={isParamLocked('wallHeight')}
            paramKey="wallHeight"
            onToggleLock={toggleParamLock}
          />
          <SliderControl
            label="城墙厚度"
            value={params.wallThickness}
            min={1}
            max={5}
            step={0.5}
            onChange={(v) => setParams({ wallThickness: v })}
            unit="m"
            locked={isParamLocked('wallThickness')}
            paramKey="wallThickness"
            onToggleLock={toggleParamLock}
          />
        </CollapsibleSection>
        )}

        {panelGroups.towers && (
        <CollapsibleSection
          title="塔楼设置"
          icon={<Castle className="w-4 h-4" />}
          defaultOpen
          locked={isGroupLocked('towers')}
          onToggleLock={() => toggleGroupLock('towers')}
        >
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择塔楼类型</p>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(TOWER_TYPE_INFO) as TowerType[]).map((type) => {
                const info = TOWER_TYPE_INFO[type];
                const isSelected = params.towerType === type;
                const locked = isParamLocked('towerType');
                return (
                  <button
                    key={type}
                    onClick={() => !locked && applyTowerType(type)}
                    disabled={locked}
                    className={cn(
                      'p-1.5 rounded-lg border transition-all text-center',
                      locked ? 'opacity-50 cursor-not-allowed' : '',
                      isSelected
                        ? 'bg-purple-600/30 border-purple-500 ring-1 ring-purple-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    )}
                    title={info.description}
                  >
                    <div className="text-base mb-0.5">{info.icon}</div>
                    <div className={`text-[9px] font-medium leading-tight ${isSelected ? 'text-purple-300' : 'text-stone-300'}`}>
                      {info.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 italic">
              {TOWER_TYPE_INFO[params.towerType].description}
            </p>
          </div>

          <SliderControl
            label="塔楼数量"
            value={params.towerCount}
            min={4}
            max={12}
            step={1}
            onChange={(v) => setParams({ towerCount: v })}
            unit="座"
            locked={isParamLocked('towerCount')}
            paramKey="towerCount"
            onToggleLock={toggleParamLock}
          />
          <SliderControl
            label="塔楼高度"
            value={params.towerHeight}
            min={8}
            max={25}
            step={1}
            onChange={(v) => setParams({ towerHeight: v })}
            unit="m"
            locked={isParamLocked('towerHeight')}
            paramKey="towerHeight"
            onToggleLock={toggleParamLock}
          />
          <SliderControl
            label="塔楼半径"
            value={params.towerRadius}
            min={2}
            max={6}
            step={0.5}
            onChange={(v) => setParams({ towerRadius: v })}
            unit="m"
            locked={isParamLocked('towerRadius')}
            paramKey="towerRadius"
            onToggleLock={toggleParamLock}
          />

          {params.towerType === 'square_fort' && (
            <div className="mt-3 p-2 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <p className="text-xs text-purple-300 font-medium mb-2">方形堡垒参数</p>
              <SliderControl
                label="城垛高度"
                value={params.towerSpecificParams.squareFort.crenellationHeight}
                min={0.5}
                max={3}
                step={0.1}
                onChange={(v) => updateTowerSpecificParams('squareFort', { crenellationHeight: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.squareFort.crenellationHeight')}
                paramKey="towerSpecificParams.squareFort.crenellationHeight"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="扶壁数量"
                value={params.towerSpecificParams.squareFort.buttressCount}
                min={0}
                max={8}
                step={1}
                onChange={(v) => updateTowerSpecificParams('squareFort', { buttressCount: v })}
                unit="个"
                locked={isParamLocked('towerSpecificParams.squareFort.buttressCount')}
                paramKey="towerSpecificParams.squareFort.buttressCount"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="窗户排数"
                value={params.towerSpecificParams.squareFort.windowRows}
                min={1}
                max={6}
                step={1}
                onChange={(v) => updateTowerSpecificParams('squareFort', { windowRows: v })}
                unit="排"
                locked={isParamLocked('towerSpecificParams.squareFort.windowRows')}
                paramKey="towerSpecificParams.squareFort.windowRows"
                onToggleLock={toggleParamLock}
              />
            </div>
          )}

          {params.towerType === 'polygon_tower' && (
            <div className="mt-3 p-2 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <p className="text-xs text-purple-300 font-medium mb-2">多边形塔楼参数</p>
              <SliderControl
                label="边数"
                value={params.towerSpecificParams.polygonTower.sides}
                min={5}
                max={12}
                step={1}
                onChange={(v) => updateTowerSpecificParams('polygonTower', { sides: v })}
                unit="边"
                locked={isParamLocked('towerSpecificParams.polygonTower.sides')}
                paramKey="towerSpecificParams.polygonTower.sides"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="小尖塔数"
                value={params.towerSpecificParams.polygonTower.pinnacleCount}
                min={0}
                max={12}
                step={1}
                onChange={(v) => updateTowerSpecificParams('polygonTower', { pinnacleCount: v })}
                unit="座"
                locked={isParamLocked('towerSpecificParams.polygonTower.pinnacleCount')}
                paramKey="towerSpecificParams.polygonTower.pinnacleCount"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="角楼高度"
                value={params.towerSpecificParams.polygonTower.turretHeight}
                min={0.5}
                max={5}
                step={0.5}
                onChange={(v) => updateTowerSpecificParams('polygonTower', { turretHeight: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.polygonTower.turretHeight')}
                paramKey="towerSpecificParams.polygonTower.turretHeight"
                onToggleLock={toggleParamLock}
              />
            </div>
          )}

          {params.towerType === 'spiral_stair' && (
            <div className="mt-3 p-2 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <p className="text-xs text-purple-300 font-medium mb-2">螺旋楼梯塔参数</p>
              <SliderControl
                label="楼梯宽度"
                value={params.towerSpecificParams.spiralStair.stairWidth}
                min={0.5}
                max={2.5}
                step={0.1}
                onChange={(v) => updateTowerSpecificParams('spiralStair', { stairWidth: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.spiralStair.stairWidth')}
                paramKey="towerSpecificParams.spiralStair.stairWidth"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="螺旋圈数"
                value={params.towerSpecificParams.spiralStair.stairTurns}
                min={2}
                max={8}
                step={1}
                onChange={(v) => updateTowerSpecificParams('spiralStair', { stairTurns: v })}
                unit="圈"
                locked={isParamLocked('towerSpecificParams.spiralStair.stairTurns')}
                paramKey="towerSpecificParams.spiralStair.stairTurns"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="中心柱半径"
                value={params.towerSpecificParams.spiralStair.centralColumnRadius}
                min={0.3}
                max={1.5}
                step={0.1}
                onChange={(v) => updateTowerSpecificParams('spiralStair', { centralColumnRadius: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.spiralStair.centralColumnRadius')}
                paramKey="towerSpecificParams.spiralStair.centralColumnRadius"
                onToggleLock={toggleParamLock}
              />
            </div>
          )}

          {params.towerType === 'gatehouse' && (
            <div className="mt-3 p-2 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <p className="text-xs text-purple-300 font-medium mb-2">门楼式塔楼参数</p>
              <SliderControl
                label="拱门宽度"
                value={params.towerSpecificParams.gatehouse.archWidth}
                min={3}
                max={10}
                step={0.5}
                onChange={(v) => updateTowerSpecificParams('gatehouse', { archWidth: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.gatehouse.archWidth')}
                paramKey="towerSpecificParams.gatehouse.archWidth"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="拱门高度"
                value={params.towerSpecificParams.gatehouse.archHeight}
                min={3}
                max={10}
                step={0.5}
                onChange={(v) => updateTowerSpecificParams('gatehouse', { archHeight: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.gatehouse.archHeight')}
                paramKey="towerSpecificParams.gatehouse.archHeight"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="双塔间距"
                value={params.towerSpecificParams.gatehouse.towerSpacing}
                min={5}
                max={15}
                step={0.5}
                onChange={(v) => updateTowerSpecificParams('gatehouse', { towerSpacing: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.gatehouse.towerSpacing')}
                paramKey="towerSpecificParams.gatehouse.towerSpacing"
                onToggleLock={toggleParamLock}
              />
            </div>
          )}
        </CollapsibleSection>
        )}

        {panelGroups.gates && (
        <CollapsibleSection
          title="城门设置"
          icon={<DoorOpen className="w-4 h-4" />}
          locked={isGroupLocked('gates')}
          onToggleLock={() => toggleGroupLock('gates')}
        >
          <SliderControl
            label="城门宽度"
            value={params.gateWidth}
            min={2}
            max={10}
            step={0.5}
            onChange={(v) => setParams({ gateWidth: v })}
            unit="m"
            locked={isParamLocked('gateWidth')}
            paramKey="gateWidth"
            onToggleLock={toggleParamLock}
          />
          <SliderControl
            label="城门高度"
            value={params.gateHeight}
            min={3}
            max={12}
            step={0.5}
            onChange={(v) => setParams({ gateHeight: v })}
            unit="m"
            locked={isParamLocked('gateHeight')}
            paramKey="gateHeight"
            onToggleLock={toggleParamLock}
          />
          <div className="mt-3 pt-3 border-t border-stone-700/50">
            <ToggleControl
              label="启用门楼结构"
              checked={params.hasGatehouse}
              onChange={(v) => setParams({ hasGatehouse: v })}
              locked={isParamLocked('hasGatehouse')}
              paramKey="hasGatehouse"
              onToggleLock={toggleParamLock}
            />
          </div>
          {params.hasGatehouse && params.towerType === 'gatehouse' && (
            <div className="mt-2 p-2 bg-amber-900/20 rounded-lg border border-amber-800/30">
              <p className="text-xs text-amber-300 font-medium mb-2">门楼参数</p>
              <SliderControl
                label="门楼深度"
                value={params.towerSpecificParams.gatehouse.gatehouseDepth}
                min={3}
                max={12}
                step={0.5}
                onChange={(v) => updateTowerSpecificParams('gatehouse', { gatehouseDepth: v })}
                unit="m"
                locked={isParamLocked('towerSpecificParams.gatehouse.gatehouseDepth')}
                paramKey="towerSpecificParams.gatehouse.gatehouseDepth"
                onToggleLock={toggleParamLock}
              />
              <ToggleControl
                label="顶部城垛"
                checked={params.towerSpecificParams.gatehouse.hasBattlements}
                onChange={(v) => updateTowerSpecificParams('gatehouse', { hasBattlements: v })}
                locked={isParamLocked('towerSpecificParams.gatehouse.hasBattlements')}
                paramKey="towerSpecificParams.gatehouse.hasBattlements"
                onToggleLock={toggleParamLock}
              />
              <ToggleControl
                label="谋杀洞"
                checked={params.towerSpecificParams.gatehouse.hasMurderHoles}
                onChange={(v) => updateTowerSpecificParams('gatehouse', { hasMurderHoles: v })}
                locked={isParamLocked('towerSpecificParams.gatehouse.hasMurderHoles')}
                paramKey="towerSpecificParams.gatehouse.hasMurderHoles"
                onToggleLock={toggleParamLock}
              />
              <ToggleControl
                label="外堡 (Barbican)"
                checked={params.towerSpecificParams.gatehouse.hasBarbican}
                onChange={(v) => updateTowerSpecificParams('gatehouse', { hasBarbican: v })}
                locked={isParamLocked('towerSpecificParams.gatehouse.hasBarbican')}
                paramKey="towerSpecificParams.gatehouse.hasBarbican"
                onToggleLock={toggleParamLock}
              />
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-stone-700/50">
            <ToggleControl
              label="门后闩锁"
              checked={params.hasBarLatch}
              onChange={(v) => setParams({ hasBarLatch: v })}
              locked={isParamLocked('hasBarLatch')}
              paramKey="hasBarLatch"
              onToggleLock={toggleParamLock}
            />
          </div>
          {params.hasBarLatch && (
            <div className="mt-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <label className={cn(
                    "font-medium",
                    isParamLocked('barLatchPosition') ? "text-stone-500" : "text-stone-300"
                  )}>
                    闩锁位置
                  </label>
                  <button
                    onClick={() => toggleParamLock('barLatchPosition')}
                    className={cn(
                      "p-0.5 rounded transition-colors",
                      isParamLocked('barLatchPosition')
                        ? "text-amber-500"
                        : "text-stone-600 hover:text-stone-400"
                    )}
                    title={isParamLocked('barLatchPosition') ? "解锁参数" : "锁定参数"}
                  >
                    {isParamLocked('barLatchPosition') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-amber-400 font-mono">{Math.round(params.barLatchPosition * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={params.barLatchPosition}
                onChange={(e) => !isParamLocked('barLatchPosition') && setBarLatchPosition(parseFloat(e.target.value))}
                disabled={isParamLocked('barLatchPosition')}
                className={cn(
                  "w-full h-2 rounded-full appearance-none",
                  isParamLocked('barLatchPosition') ? "cursor-not-allowed" : "cursor-pointer",
                  "[&::-webkit-slider-thumb]:appearance-none",
                  "[&::-webkit-slider-thumb]:w-4",
                  "[&::-webkit-slider-thumb]:h-4",
                  "[&::-webkit-slider-thumb]:rounded-full",
                  "[&::-webkit-slider-thumb]:bg-amber-500",
                  "[&::-webkit-slider-thumb]:shadow-lg",
                  "[&::-webkit-slider-thumb]:shadow-amber-500/30",
                  "[&::-webkit-slider-thumb]:transition-transform",
                  !isParamLocked('barLatchPosition') && "[&::-webkit-slider-thumb]:hover:scale-110",
                  "[&::-moz-range-thumb]:w-4",
                  "[&::-moz-range-thumb]:h-4",
                  "[&::-moz-range-thumb]:rounded-full",
                  "[&::-moz-range-thumb]:bg-amber-500",
                  "[&::-moz-range-thumb]:border-none"
                )}
                style={{
                  background: `linear-gradient(to right, #78350f 0%, #f59e0b ${params.barLatchPosition * 100}%, #78716c ${params.barLatchPosition * 100}%, #57534e 100%)`,
                  opacity: isParamLocked('barLatchPosition') ? 0.5 : 1,
                }}
              />
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-stone-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-teal-400" />
                <div className="flex items-center gap-1.5">
                  <label className={cn(
                    "text-xs font-medium",
                    isParamLocked('gateAnimationSync') ? "text-stone-500" : "text-stone-300"
                  )}>
                    联动动画
                  </label>
                  <button
                    onClick={() => toggleParamLock('gateAnimationSync')}
                    className={cn(
                      "p-0.5 rounded transition-colors",
                      isParamLocked('gateAnimationSync')
                        ? "text-amber-500"
                        : "text-stone-600 hover:text-stone-400"
                    )}
                    title={isParamLocked('gateAnimationSync') ? "解锁参数" : "锁定参数"}
                  >
                    {isParamLocked('gateAnimationSync') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => !isParamLocked('gateAnimationSync') && toggleGateAnimationSync()}
                disabled={isParamLocked('gateAnimationSync')}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium transition-colors",
                  isParamLocked('gateAnimationSync') ? 'opacity-50 cursor-not-allowed' : '',
                  params.gateAnimationSync
                    ? 'bg-teal-600/30 text-teal-300 border border-teal-500'
                    : 'bg-stone-700/50 text-stone-400 border border-stone-600'
                )}
              >
                {params.gateAnimationSync ? '已同步' : '未同步'}
              </button>
            </div>
            {params.gateAnimationSync && (
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <button
                  onClick={openGateSequence}
                  className="px-2 py-1.5 bg-emerald-700/40 hover:bg-emerald-600/40 border border-emerald-600/50 rounded text-[10px] text-emerald-200 transition-colors"
                >
                  ▶ 开门序列
                </button>
                <button
                  onClick={closeGateSequence}
                  className="px-2 py-1.5 bg-red-700/40 hover:bg-red-600/40 border border-red-600/50 rounded text-[10px] text-red-200 transition-colors"
                >
                  ▶ 关门序列
                </button>
              </div>
            )}
            <p className="text-[10px] text-stone-500 italic mt-1.5">
              同步后：闩锁→铁闸门→吊桥 依次联动
            </p>
          </div>
        </CollapsibleSection>
        )}

        {panelGroups.moat && (
        <CollapsibleSection
          title="护城河系统"
          icon={<Droplets className="w-4 h-4" />}
          defaultOpen
          locked={isGroupLocked('moat')}
          onToggleLock={() => toggleGroupLock('moat')}
        >
          <ToggleControl
            label="启用护城河"
            checked={params.hasMoat}
            onChange={(v) => setParams({ hasMoat: v })}
            locked={isParamLocked('hasMoat')}
            paramKey="hasMoat"
            onToggleLock={toggleParamLock}
          />
          {params.hasMoat && (
            <>
              <SliderControl
                label="护城河宽度"
                value={params.moatWidth}
                min={2}
                max={10}
                step={0.5}
                onChange={(v) => setParams({ moatWidth: v })}
                unit="m"
                locked={isParamLocked('moatWidth')}
                paramKey="moatWidth"
                onToggleLock={toggleParamLock}
              />
              <SliderControl
                label="护城河深度"
                value={params.moatDepth}
                min={1}
                max={8}
                step={0.5}
                onChange={(v) => setParams({ moatDepth: v })}
                unit="m"
                locked={isParamLocked('moatDepth')}
                paramKey="moatDepth"
                onToggleLock={toggleParamLock}
              />

              <div className="mt-3 p-2 bg-sky-900/20 rounded-lg border border-sky-800/30">
                <p className="text-xs text-sky-300 font-medium mb-2 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" />
                  水位设置
                </p>
                <SliderControl
                  label="全局水位"
                  value={params.moatWaterParams.globalWaterLevel}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setParams({ moatWaterParams: { ...params.moatWaterParams, globalWaterLevel: v } })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={isParamLocked('moatWaterParams.globalWaterLevel')}
                  paramKey="moatWaterParams.globalWaterLevel"
                  onToggleLock={toggleParamLock}
                />
                <SliderControl
                  label="波浪高度"
                  value={params.moatWaterParams.waveHeight}
                  min={0}
                  max={0.5}
                  step={0.02}
                  onChange={(v) => setParams({ moatWaterParams: { ...params.moatWaterParams, waveHeight: v } })}
                  unit="m"
                  locked={isParamLocked('moatWaterParams.waveHeight')}
                  paramKey="moatWaterParams.waveHeight"
                  onToggleLock={toggleParamLock}
                />
                <SliderControl
                  label="水流速度"
                  value={params.moatWaterParams.flowSpeed}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => setParams({ moatWaterParams: { ...params.moatWaterParams, flowSpeed: v } })}
                  locked={isParamLocked('moatWaterParams.flowSpeed')}
                  paramKey="moatWaterParams.flowSpeed"
                  onToggleLock={toggleParamLock}
                />
                <ToggleControl
                  label="启用水面动画"
                  checked={params.moatWaterParams.isAnimated}
                  onChange={(v) => setParams({ moatWaterParams: { ...params.moatWaterParams, isAnimated: v } })}
                  locked={isParamLocked('moatWaterParams.isAnimated')}
                  paramKey="moatWaterParams.isAnimated"
                  onToggleLock={toggleParamLock}
                />
              </div>

              <div className="mt-3 p-2 bg-amber-900/20 rounded-lg border border-amber-800/30">
                <p className="text-xs text-amber-300 font-medium mb-2 flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5" />
                  塔桥控制
                </p>
                <ToggleControl
                  label="启用塔桥"
                  checked={params.hasDrawbridge}
                  onChange={(v) => setParams({ hasDrawbridge: v })}
                  locked={isParamLocked('hasDrawbridge')}
                  paramKey="hasDrawbridge"
                  onToggleLock={toggleParamLock}
                />
                {params.hasDrawbridge && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <label className={cn(
                          "font-medium",
                          isParamLocked('drawbridgeAngle') ? "text-stone-500" : "text-stone-300"
                        )}>
                          抬起角度
                        </label>
                        <button
                          onClick={() => toggleParamLock('drawbridgeAngle')}
                          className={cn(
                            "p-0.5 rounded transition-colors",
                            isParamLocked('drawbridgeAngle')
                              ? "text-amber-500"
                              : "text-stone-600 hover:text-stone-400"
                          )}
                          title={isParamLocked('drawbridgeAngle') ? "解锁参数" : "锁定参数"}
                        >
                          {isParamLocked('drawbridgeAngle') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                      <span className="text-amber-400 font-mono">{Math.round(params.drawbridgeAngle)}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={1}
                      value={params.drawbridgeAngle}
                      onChange={(e) => !isParamLocked('drawbridgeAngle') && setDrawbridgeAngle(parseFloat(e.target.value))}
                      disabled={isParamLocked('drawbridgeAngle')}
                      className={cn(
                        "w-full h-2 rounded-full appearance-none",
                        isParamLocked('drawbridgeAngle') ? "cursor-not-allowed" : "cursor-pointer",
                        "[&::-webkit-slider-thumb]:appearance-none",
                        "[&::-webkit-slider-thumb]:w-4",
                        "[&::-webkit-slider-thumb]:h-4",
                        "[&::-webkit-slider-thumb]:rounded-full",
                        "[&::-webkit-slider-thumb]:bg-amber-500",
                        "[&::-webkit-slider-thumb]:shadow-lg",
                        "[&::-webkit-slider-thumb]:shadow-amber-500/30",
                        "[&::-webkit-slider-thumb]:transition-transform",
                        !isParamLocked('drawbridgeAngle') && "[&::-webkit-slider-thumb]:hover:scale-110",
                        "[&::-moz-range-thumb]:w-4",
                        "[&::-moz-range-thumb]:h-4",
                        "[&::-moz-range-thumb]:rounded-full",
                        "[&::-moz-range-thumb]:bg-amber-500",
                        "[&::-moz-range-thumb]:border-none"
                      )}
                      style={{
                        background: `linear-gradient(to right, #92400e 0%, #f59e0b ${params.drawbridgeAngle / 90 * 100}%, #78716c ${params.drawbridgeAngle / 90 * 100}%, #57534e 100%)`,
                        opacity: isParamLocked('drawbridgeAngle') ? 0.5 : 1,
                      }}
                    />
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        onClick={() => !isParamLocked('drawbridgeAngle') && setDrawbridgeAngle(0)}
                        disabled={isParamLocked('drawbridgeAngle')}
                        className={cn(
                          "px-2 py-1 border border-stone-600 rounded text-[10px] text-stone-200 transition-colors",
                          isParamLocked('drawbridgeAngle') ? 'opacity-50 cursor-not-allowed bg-stone-700/50' : 'bg-stone-700/50 hover:bg-stone-600/50'
                        )}
                      >
                        ▼ 放下 (0°)
                      </button>
                      <button
                        onClick={() => !isParamLocked('drawbridgeAngle') && setDrawbridgeAngle(75)}
                        disabled={isParamLocked('drawbridgeAngle')}
                        className={cn(
                          "px-2 py-1 border border-stone-600 rounded text-[10px] text-stone-200 transition-colors",
                          isParamLocked('drawbridgeAngle') ? 'opacity-50 cursor-not-allowed bg-stone-700/50' : 'bg-stone-700/50 hover:bg-stone-600/50'
                        )}
                      >
                        ▲ 抬起 (75°)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 p-2 bg-red-900/20 rounded-lg border border-red-800/30">
                <p className="text-xs text-red-300 font-medium mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  铁闸门控制
                </p>
                <ToggleControl
                  label="启用铁闸门"
                  checked={params.hasPortcullis}
                  onChange={(v) => setParams({ hasPortcullis: v })}
                  locked={isParamLocked('hasPortcullis')}
                  paramKey="hasPortcullis"
                  onToggleLock={toggleParamLock}
                />
                {params.hasPortcullis && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <label className={cn(
                          "font-medium",
                          isParamLocked('portcullisPosition') ? "text-stone-500" : "text-stone-300"
                        )}>
                          升起高度
                        </label>
                        <button
                          onClick={() => toggleParamLock('portcullisPosition')}
                          className={cn(
                            "p-0.5 rounded transition-colors",
                            isParamLocked('portcullisPosition')
                              ? "text-red-500"
                              : "text-stone-600 hover:text-stone-400"
                          )}
                          title={isParamLocked('portcullisPosition') ? "解锁参数" : "锁定参数"}
                        >
                          {isParamLocked('portcullisPosition') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                      <span className="text-red-400 font-mono">{Math.round(params.portcullisPosition * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={params.portcullisPosition}
                      onChange={(e) => !isParamLocked('portcullisPosition') && setPortcullisPosition(parseFloat(e.target.value))}
                      disabled={isParamLocked('portcullisPosition')}
                      className={cn(
                        "w-full h-2 rounded-full appearance-none",
                        isParamLocked('portcullisPosition') ? "cursor-not-allowed" : "cursor-pointer",
                        "[&::-webkit-slider-thumb]:appearance-none",
                        "[&::-webkit-slider-thumb]:w-4",
                        "[&::-webkit-slider-thumb]:h-4",
                        "[&::-webkit-slider-thumb]:rounded-full",
                        "[&::-webkit-slider-thumb]:bg-red-500",
                        "[&::-webkit-slider-thumb]:shadow-lg",
                        "[&::-webkit-slider-thumb]:shadow-red-500/30",
                        "[&::-webkit-slider-thumb]:transition-transform",
                        !isParamLocked('portcullisPosition') && "[&::-webkit-slider-thumb]:hover:scale-110",
                        "[&::-moz-range-thumb]:w-4",
                        "[&::-moz-range-thumb]:h-4",
                        "[&::-moz-range-thumb]:rounded-full",
                        "[&::-moz-range-thumb]:bg-red-500",
                        "[&::-moz-range-thumb]:border-none"
                      )}
                      style={{
                        background: `linear-gradient(to right, #7f1d1d 0%, #ef4444 ${params.portcullisPosition * 100}%, #78716c ${params.portcullisPosition * 100}%, #57534e 100%)`,
                        opacity: isParamLocked('portcullisPosition') ? 0.5 : 1,
                      }}
                    />
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        onClick={() => !isParamLocked('portcullisPosition') && setPortcullisPosition(0)}
                        disabled={isParamLocked('portcullisPosition')}
                        className={cn(
                          "px-2 py-1 border border-stone-600 rounded text-[10px] text-stone-200 transition-colors",
                          isParamLocked('portcullisPosition') ? 'opacity-50 cursor-not-allowed bg-stone-700/50' : 'bg-stone-700/50 hover:bg-stone-600/50'
                        )}
                      >
                        ⬇ 关闭
                      </button>
                      <button
                        onClick={() => !isParamLocked('portcullisPosition') && setPortcullisPosition(1)}
                        disabled={isParamLocked('portcullisPosition')}
                        className={cn(
                          "px-2 py-1 border border-stone-600 rounded text-[10px] text-stone-200 transition-colors",
                          isParamLocked('portcullisPosition') ? 'opacity-50 cursor-not-allowed bg-stone-700/50' : 'bg-stone-700/50 hover:bg-stone-600/50'
                        )}
                      >
                        ⬆ 开启
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 p-2 bg-teal-900/20 rounded-lg border border-teal-800/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-teal-300 font-medium flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    分段水位控制
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {params.moatSegments.map((seg: MoatSegment, idx: number) => (
                    <div key={seg.id} className="p-2 bg-stone-800/60 rounded border border-stone-700/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-teal-400 font-medium">
                          分段 {idx + 1} (边 {seg.startIndex}-{seg.endIndex})
                        </span>
                        <div className="flex gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 bg-sky-800/40 text-sky-300 rounded">
                            {seg.hasDrawbridge ? '塔桥' : ''}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-red-800/40 text-red-300 rounded">
                            {seg.hasPortcullis ? '闸门' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400 w-8">水位</span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={seg.waterLevel}
                            onChange={(e) => updateMoatSegment(seg.id, { waterLevel: parseFloat(e.target.value) })}
                            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-3
                              [&::-webkit-slider-thumb]:h-3
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-teal-500
                              [&::-webkit-slider-thumb]:cursor-pointer"
                          />
                          <span className="text-[10px] text-teal-400 w-8 text-right font-mono">
                            {Math.round(seg.waterLevel * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <ToggleControl
                            label="有塔桥"
                            checked={seg.hasDrawbridge}
                            onChange={(v) => updateMoatSegment(seg.id, { hasDrawbridge: v })}
                          />
                          <ToggleControl
                            label="有闸门"
                            checked={seg.hasPortcullis}
                            onChange={(v) => updateMoatSegment(seg.id, { hasPortcullis: v })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CollapsibleSection>
        )}

        {panelGroups.buildings && (
        <CollapsibleSection
          title="内部建筑"
          icon={<Building2 className="w-4 h-4" />}
          locked={isGroupLocked('buildings')}
          onToggleLock={() => toggleGroupLock('buildings')}
        >
          <SliderControl
            label="基础高度"
            value={params.buildingHeight}
            min={3}
            max={15}
            step={0.5}
            onChange={(v) => setParams({ buildingHeight: v })}
            unit="m"
            locked={isParamLocked('buildingHeight')}
            paramKey="buildingHeight"
            onToggleLock={toggleParamLock}
          />
          <div className="mt-3 space-y-2">
            <p className="text-xs text-stone-400">建筑类型分布</p>
            {(Object.keys(BUILDING_TYPE_INFO) as BuildingType[]).map((type) => {
              const info = BUILDING_TYPE_INFO[type];
              const count = params.buildingTypeDistribution[type];
              const paramKey = `buildingTypeDistribution.${type}`;
              const locked = isParamLocked(paramKey);
              return (
                <div
                  key={type}
                  className="p-2 bg-stone-800/50 rounded border border-stone-700/50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{info.icon}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        locked ? "text-stone-500" : "text-stone-200"
                      )}>
                        {info.name}
                      </span>
                      <button
                        onClick={() => toggleParamLock(paramKey)}
                        className={cn(
                          "p-0.5 rounded transition-colors",
                          locked
                            ? "text-amber-500"
                            : "text-stone-600 hover:text-stone-400"
                        )}
                        title={locked ? "解锁参数" : "锁定参数"}
                      >
                        {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => !locked && setBuildingTypeDistribution(type, count - 1)}
                        disabled={locked}
                        className={cn(
                          "w-5 h-5 flex items-center justify-center rounded text-xs transition-colors",
                          locked ? 'opacity-50 cursor-not-allowed bg-stone-700 text-stone-500' : 'bg-stone-700 hover:bg-stone-600 text-stone-300'
                        )}
                      >
                        −
                      </button>
                      <span className={cn(
                        "w-6 text-center text-xs font-mono",
                        locked ? "text-stone-500" : "text-amber-400"
                      )}>
                        {count}
                      </span>
                      <button
                        onClick={() => !locked && setBuildingTypeDistribution(type, count + 1)}
                        disabled={locked}
                        className={cn(
                          "w-5 h-5 flex items-center justify-center rounded text-xs transition-colors",
                          locked ? 'opacity-50 cursor-not-allowed bg-stone-700 text-stone-500' : 'bg-stone-700 hover:bg-stone-600 text-stone-300'
                        )}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500 italic leading-tight">
                    {info.description}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-stone-500 italic mt-2">
            提示：建筑会按尺寸从大到小自动排布，避免重叠
          </p>
        </CollapsibleSection>
        )}

        {panelGroups.residents && (
        <CollapsibleSection
          title="居民模式"
          icon={<Users className="w-4 h-4" />}
          locked={isGroupLocked('residents')}
          onToggleLock={() => toggleGroupLock('residents')}
        >
          <ToggleControl
            label="启用居民模式"
            checked={params.residentMode}
            onChange={(v) => setParams({ residentMode: v })}
            locked={isParamLocked('residentMode')}
            paramKey="residentMode"
            onToggleLock={toggleParamLock}
          />
          {params.residentMode && (
            <>
              <SliderControl
                label="居民数量"
                value={params.residentCount}
                min={3}
                max={50}
                step={1}
                onChange={(v) => setParams({ residentCount: v })}
                unit="人"
                locked={isParamLocked('residentCount')}
                paramKey="residentCount"
                onToggleLock={toggleParamLock}
              />
              <div className="space-y-2 mt-3">
                <p className="text-xs text-stone-400">居民类型分布</p>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {(Object.keys(NPC_TYPE_INFO) as NPCType[]).map((type) => {
                    const info = NPC_TYPE_INFO[type];
                    return (
                      <div
                        key={type}
                        className="text-center p-1.5 rounded bg-stone-800/50 border border-stone-700"
                      >
                        <div className="text-base">{info.icon}</div>
                        <div className="text-[10px] text-stone-300">{info.name}</div>
                      </div>
                    );
                  })}
                </div>
                <SliderControl
                  label="农民比例"
                  value={params.farmerRatio}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setParams({ farmerRatio: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={isParamLocked('farmerRatio')}
                  paramKey="farmerRatio"
                  onToggleLock={toggleParamLock}
                />
                <SliderControl
                  label="士兵比例"
                  value={params.soldierRatio}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setParams({ soldierRatio: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={isParamLocked('soldierRatio')}
                  paramKey="soldierRatio"
                  onToggleLock={toggleParamLock}
                />
                <SliderControl
                  label="贵族比例"
                  value={params.nobleRatio}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setParams({ nobleRatio: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={isParamLocked('nobleRatio')}
                  paramKey="nobleRatio"
                  onToggleLock={toggleParamLock}
                />
                <p className="text-[10px] text-stone-500 italic">
                  提示：不同类型的居民有不同的活动区域和行为特征
                </p>
              </div>
            </>
          )}
        </CollapsibleSection>
        )}

        {panelGroups.materials && (
        <CollapsibleSection
          title="材质效果"
          icon={<Palette className="w-4 h-4" />}
          defaultOpen
          locked={isGroupLocked('materials')}
          onToggleLock={() => toggleGroupLock('materials')}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-400">调整材质细节与老化程度</p>
            <button
              onClick={resetMaterialParams}
              className="flex items-center gap-1 px-2 py-1 bg-stone-700/50 hover:bg-stone-600/50 border border-stone-600 rounded text-[10px] text-stone-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </button>
          </div>

          <div className="p-2 bg-amber-900/20 rounded-lg border border-amber-800/30 mb-3">
            <p className="text-xs text-amber-300 font-medium mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              全局老化程度
            </p>
            <SliderControl
              label="材质老化"
              value={params.materialParams.agingLevel}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ agingLevel: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.agingLevel')}
              paramKey="materialParams.agingLevel"
              onToggleLock={toggleParamLock}
            />
          </div>

          <div className="p-2 bg-emerald-900/20 rounded-lg border border-emerald-800/30 mb-3">
            <p className="text-xs text-emerald-300 font-medium mb-2 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" />
              苔藓覆盖
            </p>
            <SliderControl
              label="苔藓密度"
              value={params.materialParams.mossCoverage}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ mossCoverage: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.mossCoverage')}
              paramKey="materialParams.mossCoverage"
              onToggleLock={toggleParamLock}
            />
          </div>

          <div className="p-2 bg-stone-700/30 rounded-lg border border-stone-600/30 mb-3">
            <p className="text-xs text-stone-300 font-medium mb-2 flex items-center gap-1.5">
              <CastleIcon className="w-3.5 h-3.5" />
              石头材质
            </p>
            <SliderControl
              label="裂缝程度"
              value={params.materialParams.stoneCrackLevel}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ stoneCrackLevel: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.stoneCrackLevel')}
              paramKey="materialParams.stoneCrackLevel"
              onToggleLock={toggleParamLock}
            />
            <SliderControl
              label="污渍程度"
              value={params.materialParams.stoneStainLevel}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ stoneStainLevel: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.stoneStainLevel')}
              paramKey="materialParams.stoneStainLevel"
              onToggleLock={toggleParamLock}
            />
          </div>

          <div className="p-2 bg-amber-900/20 rounded-lg border border-amber-800/30 mb-3">
            <p className="text-xs text-amber-300 font-medium mb-2 flex items-center gap-1.5">
              <TreeDeciduous className="w-3.5 h-3.5" />
              木头材质
            </p>
            <SliderControl
              label="木纹清晰度"
              value={params.materialParams.woodGrainLevel}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ woodGrainLevel: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.woodGrainLevel')}
              paramKey="materialParams.woodGrainLevel"
              onToggleLock={toggleParamLock}
            />
            <SliderControl
              label="年轮明显度"
              value={params.materialParams.woodRingLevel}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ woodRingLevel: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.woodRingLevel')}
              paramKey="materialParams.woodRingLevel"
              onToggleLock={toggleParamLock}
            />
          </div>

          <div className="p-2 bg-sky-900/20 rounded-lg border border-sky-800/30">
            <p className="text-xs text-sky-300 font-medium mb-2 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              水面材质
            </p>
            <SliderControl
              label="波纹强度"
              value={params.materialParams.waterRippleLevel}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ waterRippleLevel: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.waterRippleLevel')}
              paramKey="materialParams.waterRippleLevel"
              onToggleLock={toggleParamLock}
            />
            <SliderControl
              label="水体清澈度"
              value={params.materialParams.waterClarity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMaterialParams({ waterClarity: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              locked={isParamLocked('materialParams.waterClarity')}
              paramKey="materialParams.waterClarity"
              onToggleLock={toggleParamLock}
            />
          </div>
        </CollapsibleSection>
        )}

        {panelGroups.generation && (
        <CollapsibleSection
          title="生成算法"
          icon={<Dna className="w-4 h-4" />}
          defaultOpen
          locked={isGroupLocked('generation')}
          onToggleLock={() => toggleGroupLock('generation')}
        >
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择城堡生成算法</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(GENERATION_ALGORITHM_INFO) as GenerationAlgorithm[]).map((algo) => {
                const info = GENERATION_ALGORITHM_INFO[algo];
                const isSelected = params.generationAlgorithm === algo;
                return (
                  <button
                    key={algo}
                    onClick={() => setGenerationAlgorithm(algo)}
                    className={cn(
                      'p-2 rounded-lg border transition-all text-center',
                      isSelected
                        ? 'bg-emerald-600/30 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    )}
                  >
                    <div className="text-lg mb-0.5">{info.icon}</div>
                    <div className={`text-xs font-medium ${isSelected ? 'text-emerald-300' : 'text-stone-300'}`}>
                      {info.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 italic">
              {GENERATION_ALGORITHM_INFO[params.generationAlgorithm].description}
            </p>
          </div>

          {params.generationAlgorithm === 'lsystem' && (
            <div className="p-2 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
              <p className="text-xs text-emerald-300 font-medium mb-2 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                L-系统参数
              </p>
              <div className="space-y-2 mb-3">
                <p className="text-[10px] text-stone-400">预设规则</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['classic', 'branching', 'organic', 'fortress', 'fractal'] as const).map((preset) => {
                    const presetNames: Record<string, string> = {
                      classic: '经典',
                      branching: '分支',
                      organic: '有机',
                      fortress: '堡垒',
                      fractal: '分形',
                    };
                    const isSelected = params.lsystemConfig.axiom === DEFAULT_LSYSTEM_CONFIG.axiom;
                    return (
                      <button
                        key={preset}
                        onClick={() => {
                          const presetConfig = LSystemEngine.PRESETS[preset];
                          if (presetConfig) updateLSystemConfig(presetConfig);
                        }}
                        className="px-2 py-1.5 bg-stone-800/50 border border-stone-700 hover:bg-stone-700/50 hover:border-stone-600 rounded text-[10px] text-stone-300 transition-colors"
                      >
                        {presetNames[preset]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-stone-400 w-12">公理</label>
                  <input
                    type="text"
                    value={params.lsystemConfig.axiom}
                    onChange={(e) => updateLSystemConfig({ axiom: e.target.value })}
                    className="flex-1 px-2 py-1 bg-stone-800 border border-stone-600 rounded text-xs text-stone-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <SliderControl
                  label="迭代次数"
                  value={params.lsystemConfig.iterations}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(v) => updateLSystemConfig({ iterations: v })}
                  unit="次"
                  locked={false}
                  paramKey="lsystem.iterations"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="分支角度"
                  value={params.lsystemConfig.angle}
                  min={5}
                  max={90}
                  step={1}
                  onChange={(v) => updateLSystemConfig({ angle: v })}
                  unit="°"
                  locked={false}
                  paramKey="lsystem.angle"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="段长度"
                  value={params.lsystemConfig.segmentLength}
                  min={1}
                  max={15}
                  step={0.5}
                  onChange={(v) => updateLSystemConfig({ segmentLength: v })}
                  unit="m"
                  locked={false}
                  paramKey="lsystem.segmentLength"
                  onToggleLock={() => {}}
                />
                <div className="mt-2 space-y-1">
                  <ToggleControl
                    label="城墙分段规则"
                    checked={params.lsystemConfig.wallSegmentRules}
                    onChange={(v) => updateLSystemConfig({ wallSegmentRules: v })}
                    locked={false}
                    paramKey="lsystem.wallSegmentRules"
                    onToggleLock={() => {}}
                  />
                  <ToggleControl
                    label="塔楼分支规则"
                    checked={params.lsystemConfig.towerBranchRules}
                    onChange={(v) => updateLSystemConfig({ towerBranchRules: v })}
                    locked={false}
                    paramKey="lsystem.towerBranchRules"
                    onToggleLock={() => {}}
                  />
                  <ToggleControl
                    label="护城河图案规则"
                    checked={params.lsystemConfig.moatPatternRules}
                    onChange={(v) => updateLSystemConfig({ moatPatternRules: v })}
                    locked={false}
                    paramKey="lsystem.moatPatternRules"
                    onToggleLock={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {params.generationAlgorithm === 'cellular_automata' && (
            <div className="p-2 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
              <p className="text-xs text-emerald-300 font-medium mb-2 flex items-center gap-1.5">
                <Grid3x3 className="w-3.5 h-3.5" />
                细胞自动机参数
              </p>
              <div className="space-y-2 mb-3">
                <p className="text-[10px] text-stone-400">预设规则</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['cave', 'organic', 'maze', 'settlement'] as const).map((preset) => {
                    const presetNames: Record<string, string> = {
                      cave: '洞穴',
                      organic: '有机',
                      maze: '迷宫',
                      settlement: '聚落',
                    };
                    return (
                      <button
                        key={preset}
                        onClick={() => {
                          const presetConfig = CellularAutomataEngine.PRESETS[preset];
                          if (presetConfig) updateCellularAutomataConfig(presetConfig);
                        }}
                        className="px-2 py-1.5 bg-stone-800/50 border border-stone-700 hover:bg-stone-700/50 hover:border-stone-600 rounded text-[10px] text-stone-300 transition-colors"
                      >
                        {presetNames[preset]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <SliderControl
                  label="网格大小"
                  value={params.cellularAutomataConfig.gridSize}
                  min={8}
                  max={64}
                  step={4}
                  onChange={(v) => updateCellularAutomataConfig({ gridSize: v })}
                  locked={false}
                  paramKey="ca.gridSize"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="初始填充率"
                  value={params.cellularAutomataConfig.fillRatio}
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  onChange={(v) => updateCellularAutomataConfig({ fillRatio: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={false}
                  paramKey="ca.fillRatio"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="迭代次数"
                  value={params.cellularAutomataConfig.iterations}
                  min={1}
                  max={12}
                  step={1}
                  onChange={(v) => updateCellularAutomataConfig({ iterations: v })}
                  unit="次"
                  locked={false}
                  paramKey="ca.iterations"
                  onToggleLock={() => {}}
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-stone-400">邻域</span>
                  <button
                    onClick={() => updateCellularAutomataConfig({ neighborhood: 'moore' })}
                    className={cn(
                      'px-2 py-1 rounded text-[10px] transition-colors',
                      params.cellularAutomataConfig.neighborhood === 'moore'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500'
                        : 'bg-stone-800/50 text-stone-400 border border-stone-700'
                    )}
                  >
                    Moore (8邻)
                  </button>
                  <button
                    onClick={() => updateCellularAutomataConfig({ neighborhood: 'vonneumann' })}
                    className={cn(
                      'px-2 py-1 rounded text-[10px] transition-colors',
                      params.cellularAutomataConfig.neighborhood === 'vonneumann'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500'
                        : 'bg-stone-800/50 text-stone-400 border border-stone-700'
                    )}
                  >
                    VonNeumann (4邻)
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <ToggleControl
                    label="应用于地形"
                    checked={params.cellularAutomataConfig.applyToTerrain}
                    onChange={(v) => updateCellularAutomataConfig({ applyToTerrain: v })}
                    locked={false}
                    paramKey="ca.applyToTerrain"
                    onToggleLock={() => {}}
                  />
                  <ToggleControl
                    label="应用于建筑"
                    checked={params.cellularAutomataConfig.applyToBuildings}
                    onChange={(v) => updateCellularAutomataConfig({ applyToBuildings: v })}
                    locked={false}
                    paramKey="ca.applyToBuildings"
                    onToggleLock={() => {}}
                  />
                  <ToggleControl
                    label="应用于城墙"
                    checked={params.cellularAutomataConfig.applyToWalls}
                    onChange={(v) => updateCellularAutomataConfig({ applyToWalls: v })}
                    locked={false}
                    paramKey="ca.applyToWalls"
                    onToggleLock={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {params.generationAlgorithm === 'evolutionary' && (
            <div className="p-2 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
              <p className="text-xs text-emerald-300 font-medium mb-2 flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5" />
                进化算法参数
              </p>
              <div className="space-y-1.5">
                <SliderControl
                  label="种群大小"
                  value={params.evolutionConfig.populationSize}
                  min={10}
                  max={100}
                  step={5}
                  onChange={(v) => updateEvolutionConfig({ populationSize: v })}
                  unit="个"
                  locked={false}
                  paramKey="evo.populationSize"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="进化代数"
                  value={params.evolutionConfig.generations}
                  min={10}
                  max={200}
                  step={10}
                  onChange={(v) => updateEvolutionConfig({ generations: v })}
                  unit="代"
                  locked={false}
                  paramKey="evo.generations"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="变异率"
                  value={params.evolutionConfig.mutationRate}
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  onChange={(v) => updateEvolutionConfig({ mutationRate: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={false}
                  paramKey="evo.mutationRate"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="交叉率"
                  value={params.evolutionConfig.crossoverRate}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateEvolutionConfig({ crossoverRate: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={false}
                  paramKey="evo.crossoverRate"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="精英数量"
                  value={params.evolutionConfig.eliteCount}
                  min={1}
                  max={5}
                  step={1}
                  onChange={(v) => updateEvolutionConfig({ eliteCount: v })}
                  unit="个"
                  locked={false}
                  paramKey="evo.eliteCount"
                  onToggleLock={() => {}}
                />
              </div>

              <div className="mt-3 pt-3 border-t border-stone-700/50">
                <p className="text-xs text-stone-400 mb-2">适应度权重</p>
                <SliderControl
                  label="防御能力"
                  value={params.evolutionConfig.fitnessWeights.defense}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateEvolutionConfig({ fitnessWeights: { ...params.evolutionConfig.fitnessWeights, defense: v } })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={false}
                  paramKey="evo.fitnessDefense"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="美观度"
                  value={params.evolutionConfig.fitnessWeights.aesthetics}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateEvolutionConfig({ fitnessWeights: { ...params.evolutionConfig.fitnessWeights, aesthetics: v } })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={false}
                  paramKey="evo.fitnessAesthetics"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="资源效率"
                  value={params.evolutionConfig.fitnessWeights.resourceEfficiency}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateEvolutionConfig({ fitnessWeights: { ...params.evolutionConfig.fitnessWeights, resourceEfficiency: v } })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={false}
                  paramKey="evo.fitnessResource"
                  onToggleLock={() => {}}
                />
                <SliderControl
                  label="结构完整性"
                  value={params.evolutionConfig.fitnessWeights.structuralIntegrity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateEvolutionConfig({ fitnessWeights: { ...params.evolutionConfig.fitnessWeights, structuralIntegrity: v } })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  locked={false}
                  paramKey="evo.fitnessStructural"
                  onToggleLock={() => {}}
                />
              </div>

              <button
                onClick={runEvolution}
                className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                运行进化
              </button>

              {evolutionStats && (
                <div className="mt-2 p-2 bg-stone-800/60 rounded border border-stone-700/50">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-stone-500">代数</div>
                      <div className="text-xs text-emerald-400 font-mono">{evolutionStats.generation}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-500">最佳适应度</div>
                      <div className="text-xs text-emerald-400 font-mono">{(evolutionStats.bestFitness * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-500">平均适应度</div>
                      <div className="text-xs text-emerald-400 font-mono">{(evolutionStats.avgFitness * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>
        )}

        {panelGroups.seed && (
        <CollapsibleSection
          title="随机种子"
          icon={<Hash className="w-4 h-4" />}
          defaultOpen={false}
          locked={isGroupLocked('seed')}
          onToggleLock={() => toggleGroupLock('seed')}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={params.seed}
                onChange={(e) => !isParamLocked('seed') && setParams({ seed: parseInt(e.target.value) || 0 })}
                disabled={isParamLocked('seed')}
                className={cn(
                  "flex-1 px-3 py-2 bg-stone-800 border border-stone-600 rounded text-sm text-stone-200 focus:outline-none focus:border-amber-500 font-mono",
                  isParamLocked('seed') ? "cursor-not-allowed opacity-50" : ""
                )}
              />
              <button
                onClick={() => toggleParamLock('seed')}
                className={cn(
                  "p-2 rounded transition-colors",
                  isParamLocked('seed')
                    ? "text-amber-500 bg-amber-900/30"
                    : "text-stone-400 hover:text-stone-300 bg-stone-700 hover:bg-stone-600"
                )}
                title={isParamLocked('seed') ? "解锁参数" : "锁定参数"}
              >
                {isParamLocked('seed') ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-stone-500">
              相同种子生成相同城堡，用于复现设计
            </p>
          </div>
        </CollapsibleSection>
        )}
      </div>

      <div className="p-3 border-t border-amber-900/30 bg-stone-900">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Palette className="w-3 h-3" />
          <span>拖动旋转 · 滚轮缩放 · 右键平移</span>
        </div>
      </div>
      <PanelSettingsDialog
        isOpen={showPanelSettings}
        onClose={() => setShowPanelSettings(false)}
        panelGroups={panelGroups}
        onTogglePanel={togglePanelGroup}
        onShowAll={handleShowAllPanels}
        onHideAll={handleHideAllPanels}
      />
    </div>
  );
}
