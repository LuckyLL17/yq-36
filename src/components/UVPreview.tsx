import { useMemo, useRef, useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';
import * as THREE from 'three';
import { useCastleStore } from '@/store/useCastleStore';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { UVUnwrapper } from '@/utils/UVUnwrapper';

interface UVPreviewProps {
  onClose: () => void;
}

export function UVPreview({ onClose }: UVPreviewProps) {
  const { params } = useCastleStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const allGeometries = useMemo(() => {
    const generator = new CastleGenerator(params);
    const result = generator.generateAll();
    
    const geos: THREE.BufferGeometry[] = [];
    
    result.walls.forEach((geo, i) => {
      UVUnwrapper.unwrapGeometry(geo, `wall_${i}`);
      geos.push(geo);
    });
    result.towers.forEach((geo, i) => {
      UVUnwrapper.unwrapGeometry(geo, `tower_${i}`);
      geos.push(geo);
    });
    UVUnwrapper.unwrapGeometry(result.gate, 'gate');
    geos.push(result.gate);
    if (result.moat) {
      UVUnwrapper.unwrapGeometry(result.moat, 'moat');
      geos.push(result.moat);
    }
    result.buildings.forEach((geo, i) => {
      UVUnwrapper.unwrapGeometry(geo, `building_${i}`);
      geos.push(geo);
    });
    
    return geos;
  }, [params]);

  useEffect(() => {
    if (canvasRef.current) {
      const previewCanvas = UVUnwrapper.generateUVPreview(allGeometries, 400);
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(previewCanvas, 0, 0);
    }
  }, [allGeometries]);

  return (
    <div className="absolute bottom-4 right-4 z-10 w-96 bg-stone-900/95 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/30 bg-stone-800/50">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-stone-200">UV 展开预览</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
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
