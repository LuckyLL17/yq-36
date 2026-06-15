import { Castle, Shield, Building2, Droplets, DoorOpen, Hash, Palette } from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';
import { CollapsibleSection } from './CollapsibleSection';
import { SliderControl } from './SliderControl';
import { ToggleControl } from './ToggleControl';

export function ControlPanel() {
  const { params, setParams } = useCastleStore();

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
