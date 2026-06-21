import { Castle, Shield, Building2, Droplets, DoorOpen, Hash, Palette, Mountain, CloudSun, Clock, Users, Layers } from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';
import { CollapsibleSection } from './CollapsibleSection';
import { SliderControl } from './SliderControl';
import { ToggleControl } from './ToggleControl';
import { TerrainType, TERRAIN_PRESETS, WeatherType, WEATHER_PRESETS, NPC_TYPE_INFO, NPCType, WallStyle, WALL_STYLE_PRESETS } from '@/types/castle';

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
  const { params, setParams, applyTerrainType, applyWallStyle, applyWeather, setTimeOfDay } = useCastleStore();

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

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
        <CollapsibleSection title="地形设置" icon={<Mountain className="w-4 h-4" />}>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择地形类型</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TERRAIN_PRESETS) as TerrainType[]).map((type) => {
                const preset = TERRAIN_PRESETS[type];
                const isSelected = params.terrainType === type;
                return (
                  <button
                    key={type}
                    onClick={() => applyTerrainType(type)}
                    className={`p-2 rounded-lg border transition-all text-center ${
                      isSelected
                        ? 'bg-amber-600/30 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    }`}
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
          />
          <SliderControl
            label="地形频率"
            value={params.terrainFrequency}
            min={0.5}
            max={6}
            step={0.1}
            onChange={(v) => setParams({ terrainFrequency: v })}
          />
          <SliderControl
            label="地形粗糙度"
            value={params.terrainScale}
            min={0.01}
            max={0.1}
            step={0.005}
            onChange={(v) => setParams({ terrainScale: v })}
          />
        </CollapsibleSection>

        <CollapsibleSection title="天气环境" icon={<CloudSun className="w-4 h-4" />}>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择天气类型</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(WEATHER_PRESETS) as WeatherType[]).map((type) => {
                const preset = WEATHER_PRESETS[type];
                const isSelected = params.weather === type;
                return (
                  <button
                    key={type}
                    onClick={() => applyWeather(type)}
                    className={`p-2 rounded-lg border transition-all text-center ${
                      isSelected
                        ? 'bg-sky-600/30 border-sky-500 ring-1 ring-sky-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    }`}
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
              <label className="text-stone-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                时间滑块
              </label>
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
                  onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-amber-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-amber-500/30
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-amber-500
                    [&::-moz-range-thumb]:border-none
                    [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #312e81 0%, #f97316 25%, #fcd34d 50%, #f97316 75%, #312e81 100%)`,
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
                onClick={() => setTimeOfDay(preset.value)}
                className={`px-2 py-1.5 rounded border text-xs transition-all ${
                  Math.abs(params.timeOfDay - preset.value) < 0.5
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-700/50 hover:border-stone-600 hover:text-stone-300'
                }`}
              >
                <div className="text-sm">{preset.emoji}</div>
                <div className="text-[10px]">{preset.label}</div>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="城墙风格" icon={<Layers className="w-4 h-4" />}>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-stone-400">选择城墙建筑风格</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(WALL_STYLE_PRESETS) as WallStyle[]).map((style) => {
                const preset = WALL_STYLE_PRESETS[style];
                const isSelected = params.wallStyle === style;
                return (
                  <button
                    key={style}
                    onClick={() => applyWallStyle(style)}
                    className={`p-2 rounded-lg border transition-all text-center ${
                      isSelected
                        ? 'bg-amber-600/30 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-stone-800/50 border-stone-700 hover:bg-stone-700/50 hover:border-stone-600'
                    }`}
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

        <CollapsibleSection title="地块设置" icon={<Shield className="w-4 h-4" />}>
          <SliderControl
            label="地块宽度"
            value={params.plotWidth}
            min={20}
            max={80}
            step={1}
            onChange={(v) => setParams({ plotWidth: v })}
            unit="m"
          />
          <SliderControl
            label="地块深度"
            value={params.plotDepth}
            min={15}
            max={60}
            step={1}
            onChange={(v) => setParams({ plotDepth: v })}
            unit="m"
          />
        </CollapsibleSection>

        <CollapsibleSection title="城墙设置" icon={<Building2 className="w-4 h-4" />}>
          <SliderControl
            label="城墙高度"
            value={params.wallHeight}
            min={4}
            max={20}
            step={0.5}
            onChange={(v) => setParams({ wallHeight: v })}
            unit="m"
          />
          <SliderControl
            label="城墙厚度"
            value={params.wallThickness}
            min={1}
            max={5}
            step={0.5}
            onChange={(v) => setParams({ wallThickness: v })}
            unit="m"
          />
        </CollapsibleSection>

        <CollapsibleSection title="塔楼设置" icon={<Castle className="w-4 h-4" />}>
          <SliderControl
            label="塔楼数量"
            value={params.towerCount}
            min={4}
            max={12}
            step={1}
            onChange={(v) => setParams({ towerCount: v })}
            unit="座"
          />
          <SliderControl
            label="塔楼高度"
            value={params.towerHeight}
            min={8}
            max={25}
            step={1}
            onChange={(v) => setParams({ towerHeight: v })}
            unit="m"
          />
          <SliderControl
            label="塔楼半径"
            value={params.towerRadius}
            min={2}
            max={6}
            step={0.5}
            onChange={(v) => setParams({ towerRadius: v })}
            unit="m"
          />
        </CollapsibleSection>

        <CollapsibleSection title="城门设置" icon={<DoorOpen className="w-4 h-4" />}>
          <SliderControl
            label="城门宽度"
            value={params.gateWidth}
            min={2}
            max={10}
            step={0.5}
            onChange={(v) => setParams({ gateWidth: v })}
            unit="m"
          />
          <SliderControl
            label="城门高度"
            value={params.gateHeight}
            min={3}
            max={12}
            step={0.5}
            onChange={(v) => setParams({ gateHeight: v })}
            unit="m"
          />
        </CollapsibleSection>

        <CollapsibleSection title="护城河" icon={<Droplets className="w-4 h-4" />}>
          <ToggleControl
            label="启用护城河"
            checked={params.hasMoat}
            onChange={(v) => setParams({ hasMoat: v })}
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
              />
              <SliderControl
                label="护城河深度"
                value={params.moatDepth}
                min={1}
                max={8}
                step={0.5}
                onChange={(v) => setParams({ moatDepth: v })}
                unit="m"
              />
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="内部建筑" icon={<Building2 className="w-4 h-4" />}>
          <SliderControl
            label="建筑数量"
            value={params.buildingCount}
            min={1}
            max={15}
            step={1}
            onChange={(v) => setParams({ buildingCount: v })}
            unit="栋"
          />
          <SliderControl
            label="建筑高度"
            value={params.buildingHeight}
            min={3}
            max={15}
            step={0.5}
            onChange={(v) => setParams({ buildingHeight: v })}
            unit="m"
          />
        </CollapsibleSection>

        <CollapsibleSection title="居民模式" icon={<Users className="w-4 h-4" />}>
          <ToggleControl
            label="启用居民模式"
            checked={params.residentMode}
            onChange={(v) => setParams({ residentMode: v })}
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
                />
                <SliderControl
                  label="士兵比例"
                  value={params.soldierRatio}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setParams({ soldierRatio: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <SliderControl
                  label="贵族比例"
                  value={params.nobleRatio}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setParams({ nobleRatio: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-[10px] text-stone-500 italic">
                  提示：不同类型的居民有不同的活动区域和行为特征
                </p>
              </div>
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="随机种子" icon={<Hash className="w-4 h-4" />} defaultOpen={false}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={params.seed}
                onChange={(e) => setParams({ seed: parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-stone-800 border border-stone-600 rounded text-sm text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <p className="text-xs text-stone-500">
              相同种子生成相同城堡，用于复现设计
            </p>
          </div>
        </CollapsibleSection>
      </div>

      <div className="p-3 border-t border-amber-900/30 bg-stone-900">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Palette className="w-3 h-3" />
          <span>拖动旋转 · 滚轮缩放 · 右键平移</span>
        </div>
      </div>
    </div>
  );
}
