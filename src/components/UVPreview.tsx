import { useMemo, useRef, useEffect, useState } from 'react';
import {
  X, Maximize2, Download, Minimize2, Eye,
  Scissors, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { UVUnwrapper, UVIsland } from '@/utils/UVUnwrapper';
import { UVMappingMode, UV_MAPPING_MODES } from '@/types/castle';
import { cn } from '@/lib/utils';

interface UVPreviewProps {
  onClose: () => void;
}

const COMPONENT_COLORS = [
  { prefix: 'wall', label: '城墙', color: '#e74c3c' },
  { prefix: 'tower', label: '塔楼', color: '#3498db' },
  { prefix: 'gate', label: '城门', color: '#2ecc71' },
  { prefix: 'gatehouse', label: '门楼', color: '#1abc9c' },
  { prefix: 'moat', label: '护城河', color: '#9b59b6' },
  { prefix: 'building', label: '建筑', color: '#f39c12' },
  { prefix: 'ground', label: '地面', color: '#34495e' },
];

function getComponentCategory(name: string): { label: string; color: string } {
  const match = COMPONENT_COLORS.find((c) => name.startsWith(c.prefix));
  return match || { label: '其他', color: '#7f8c8d' };
}

export function UVPreview({ onClose }: UVPreviewProps) {
  const { params, uvMappingMode, showSeams, setUVMappingMode, toggleShowSeams } = useCastleStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [highlightedIsland, setHighlightedIsland] = useState<number | null>(null);
  const [componentsExpanded, setComponentsExpanded] = useState(true);
  const [hoveredIsland, setHoveredIsland] = useState<number | null>(null);

  const { allGeometries, uvIslands } = useMemo(() => {
    const generator = new CastleGenerator(params);
    const result = generator.generateAll();

    const geos: THREE.BufferGeometry[] = [];
    const islands: UVIsland[] = [];

    result.walls.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `wall_${i}`, uvMappingMode);
      islands.push(island);
      geos.push(uvGeo);
    });
    result.towers.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `tower_${i}`, uvMappingMode);
      islands.push(island);
      geos.push(uvGeo);
    });
    const gateUvGeo = result.gate.clone();
    const gateIsland = UVUnwrapper.unwrapGeometry(gateUvGeo, 'gate', uvMappingMode);
    islands.push(gateIsland);
    geos.push(gateUvGeo);
    if (result.gatehouse) {
      const gatehouseUvGeo = result.gatehouse.clone();
      islands.push(UVUnwrapper.unwrapGeometry(gatehouseUvGeo, 'gatehouse', uvMappingMode));
      geos.push(gatehouseUvGeo);
    }
    if (result.moat) {
      const moatUvGeo = result.moat.clone();
      islands.push(UVUnwrapper.unwrapGeometry(moatUvGeo, 'moat', uvMappingMode));
      geos.push(moatUvGeo);
    }
    result.buildings.forEach((geo, i) => {
      const uvGeo = geo.clone();
      const island = UVUnwrapper.unwrapGeometry(uvGeo, `building_${i}`, uvMappingMode);
      islands.push(island);
      geos.push(uvGeo);
    });
    const groundUvGeo = result.ground.clone();
    islands.push(UVUnwrapper.unwrapGeometry(groundUvGeo, 'ground', uvMappingMode));
    geos.push(groundUvGeo);

    UVUnwrapper.packIslands(islands, 0.02);

    return { allGeometries: geos, uvIslands: islands };
  }, [params, uvMappingMode]);

  const canvasSize = isExpanded ? 600 : 380;

  useEffect(() => {
    if (canvasRef.current) {
      const previewCanvas = UVUnwrapper.generateUVPreview(uvIslands, canvasSize, {
        showSeams,
        showLabels,
        highlightIslandIndex: hoveredIsland !== null ? hoveredIsland : highlightedIsland,
      });
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(previewCanvas, 0, 0);
    }
  }, [allGeometries, uvIslands, showSeams, showLabels, hoveredIsland, highlightedIsland, canvasSize]);

  const handleExportUV = (size: number = 1024) => {
    const canvas = UVUnwrapper.generateUVPreview(uvIslands, size, {
      showSeams,
      showLabels,
    });
    const link = document.createElement('a');
    link.download = `castle_uv_${params.seed}_${size}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const islandCount = uvIslands.length;
  const totalSeams = uvIslands.reduce((sum, i) => sum + (i.seams?.length || 0), 0);

  const categories = useMemo(() => {
    const map = new Map<string, { label: string; color: string; count: number; indices: number[] }>();
    uvIslands.forEach((island, idx) => {
      const cat = getComponentCategory(island.name);
      const existing = map.get(cat.label);
      if (existing) {
        existing.count++;
        existing.indices.push(idx);
      } else {
        map.set(cat.label, { ...cat, count: 1, indices: [idx] });
      }
    });
    return Array.from(map.values());
  }, [uvIslands]);

  return (
    <div
      className={cn(
        'absolute bottom-4 right-4 z-10 bg-stone-900/95 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-2xl overflow-hidden transition-all duration-300',
        isExpanded ? 'w-[680px]' : 'w-96'
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/30 bg-stone-800/50">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-stone-200">UV 展开预览</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-amber-600/20 text-amber-400 rounded">
            {UV_MAPPING_MODES[uvMappingMode].name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
            title={isExpanded ? '缩小' : '放大'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleExportUV(512)}
            className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-amber-400 transition-colors"
            title="导出小图 (512px)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExportUV(2048)}
            className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-amber-400 transition-colors"
            title="导出大图 (2048px)"
          >
            <Download className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 text-black text-[8px] font-bold rounded-full flex items-center justify-center">HD</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(UV_MAPPING_MODES) as UVMappingMode[]).map((mode) => {
            const cfg = UV_MAPPING_MODES[mode];
            const active = uvMappingMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setUVMappingMode(mode)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all border',
                  active
                    ? 'bg-amber-600/30 border-amber-500/50 text-amber-200'
                    : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-700/50 hover:text-stone-200'
                )}
                title={cfg.description}
              >
                <span className="text-sm">{cfg.icon}</span>
                <span className="font-medium">{cfg.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleShowSeams}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all border flex-1',
              showSeams
                ? 'bg-fuchsia-600/30 border-fuchsia-500/50 text-fuchsia-200'
                : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-700/50'
            )}
            title="显示UV接缝（洋红色虚线）"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="font-medium">接缝</span>
            <span className="ml-auto px-1.5 py-0.5 bg-black/30 rounded text-[10px] font-mono">
              {totalSeams}
            </span>
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all border flex-1',
              showLabels
                ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200'
                : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-700/50'
            )}
            title="显示组件名称标签"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="font-medium">标签</span>
          </button>
        </div>

        <div className="relative bg-stone-950 rounded overflow-hidden border border-stone-700">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="w-full aspect-square cursor-crosshair"
          />
          {highlightedIsland !== null && (
            <button
              onClick={() => setHighlightedIsland(null)}
              className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-stone-200 hover:bg-black/80 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              清除高亮
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="text-stone-400">
              组件: <span className="text-amber-400 font-mono">{islandCount}</span>
            </div>
            <div className="text-stone-400">
              接缝: <span className="text-fuchsia-400 font-mono">{totalSeams}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-stone-500">
            {hoveredIsland !== null && (
              <span className="text-amber-400 font-mono mr-1">
                {uvIslands[hoveredIsland]?.name}
              </span>
            )}
            <span>{isExpanded ? '大图模式' : '小图模式'}</span>
          </div>
        </div>

        <div className="border border-stone-700 rounded overflow-hidden">
          <button
            onClick={() => setComponentsExpanded(!componentsExpanded)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-stone-800/50 hover:bg-stone-800 transition-colors text-xs"
          >
            <span className="font-semibold text-stone-200 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              组件列表
              <span className="text-stone-500">({categories.reduce((s, c) => s + c.count, 0)})</span>
            </span>
            {componentsExpanded ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {componentsExpanded && (
            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.label} className="space-y-0.5">
                  <div className="flex items-center gap-2 px-1.5 py-1 bg-stone-800/30 rounded text-[11px]">
                    <div
                      className="w-2.5 h-2.5 rounded-sm border"
                      style={{ backgroundColor: cat.color + '60', borderColor: cat.color }}
                    />
                    <span className="text-stone-300 font-medium">{cat.label}</span>
                    <span className="ml-auto text-stone-500 font-mono">{cat.count}</span>
                  </div>
                  <div className="pl-4 space-y-0.5">
                    {cat.indices.map((idx) => {
                      const island = uvIslands[idx];
                      const seamCount = island.seams?.length || 0;
                      const isHighlighted = highlightedIsland === idx;
                      const isHovered = hoveredIsland === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setHighlightedIsland(isHighlighted ? null : idx)
                          }
                          onMouseEnter={() => setHoveredIsland(idx)}
                          onMouseLeave={() => setHoveredIsland(null)}
                          className={cn(
                            'w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] transition-colors text-left',
                            isHighlighted
                              ? 'bg-amber-600/30 border border-amber-500/50'
                              : isHovered
                                ? 'bg-stone-700/60'
                                : 'hover:bg-stone-700/40'
                          )}
                        >
                          <span className="text-stone-500 font-mono w-5 text-right">{idx + 1}.</span>
                          <span
                            className={cn(
                              'font-mono truncate flex-1',
                              isHighlighted ? 'text-amber-200' : 'text-stone-400'
                            )}
                          >
                            {island.name}
                          </span>
                          {seamCount > 0 && (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-fuchsia-600/20 text-fuchsia-400 rounded font-mono">
                              <Scissors className="w-2.5 h-2.5" />
                              {seamCount}
                            </span>
                          )}
                          {isHighlighted && (
                            <Eye className="w-3 h-3 text-amber-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: cat.color + '60', borderColor: cat.color }}
              />
              <span className="text-stone-400">
                {cat.label} <span className="text-stone-600">({cat.count})</span>
              </span>
            </div>
          ))}
          {showSeams && (
            <div className="flex items-center gap-2 col-span-2 border-t border-stone-700 pt-2 mt-1">
              <div className="w-4 h-0.5 bg-fuchsia-500" style={{ borderStyle: 'dashed' }} />
              <span className="text-fuchsia-400">UV 接缝（洋红色虚线）</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
