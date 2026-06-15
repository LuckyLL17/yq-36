import { useMemo, useRef, useEffect } from 'react';
import { X, Maximize2, Download } from 'lucide-react';
import * as THREE from 'three';
import { useCastleStore } from '@/store/useCastleStore';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { UVUnwrapper, UVIsland } from '@/utils/UVUnwrapper';

interface UVPreviewProps {
  onClose: () => void;
}

export function UVPreview({ onClose }: UVPreviewProps) {
  const { params } = useCastleStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { allGeometries, uvIslands } = useMemo(() => {
    const generator = new CastleGenerator(params);
    const result = generator.generateAll();
    
    const geos: THREE.BufferGeometry[] = [];
    const islands: UVIsland[] = [];
    
    result.walls.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `wall_${i}`);
      islands.push(island);
      geos.push(geo);
    });
    result.towers.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `tower_${i}`);
      islands.push(island);
      geos.push(geo);
    });
    islands.push(UVUnwrapper.unwrapGeometry(result.gate, 'gate'));
    geos.push(result.gate);
    if (result.moat) {
      islands.push(UVUnwrapper.unwrapGeometry(result.moat, 'moat'));
      geos.push(result.moat);
    }
    result.buildings.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `building_${i}`);
      islands.push(island);
      geos.push(geo);
    });
    
    UVUnwrapper.packIslands(islands, 0.03);
    
    return { allGeometries: geos, uvIslands: islands };
  }, [params]);

  useEffect(() => {
    if (canvasRef.current) {
      const previewCanvas = UVUnwrapper.generateUVPreview(allGeometries, 400);
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(previewCanvas, 0, 0);
    }
  }, [allGeometries]);

  const handleExportUV = () => {
    const canvas = UVUnwrapper.generateUVPreview(allGeometries, 1024);
    const link = document.createElement('a');
    link.download = `castle_uv_${params.seed}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const islandCount = uvIslands.length;

  return (
    <div className="absolute bottom-4 right-4 z-10 w-96 bg-stone-900/95 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/30 bg-stone-800/50">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-stone-200">UV 展开预览</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExportUV}
            className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-amber-400 transition-colors"
            title="导出UV图"
          >
            <Download className="w-4 h-4" />
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
      <div className="p-4">
        <div className="relative bg-stone-950 rounded overflow-hidden border border-stone-700">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full aspect-square"
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="text-stone-400">
            UV 岛数量: <span className="text-amber-400 font-mono">{islandCount}</span>
          </div>
          <div className="text-stone-400">
            布局: <span className="text-green-400">自动打包</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/60 border border-red-500"></div>
            <span className="text-stone-400">城墙</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/60 border border-blue-500"></div>
            <span className="text-stone-400">塔楼</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/60 border border-green-500"></div>
            <span className="text-stone-400">城门</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500/60 border border-purple-500"></div>
            <span className="text-stone-400">建筑</span>
          </div>
        </div>
      </div>
    </div>
  );
}
