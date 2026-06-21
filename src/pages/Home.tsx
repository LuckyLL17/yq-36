import { useState, useEffect } from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { Scene3D } from '@/components/Scene3D';
import { Toolbar } from '@/components/Toolbar';
import { UVPreview } from '@/components/UVPreview';
import { ExportDialog } from '@/components/ExportDialog';
import { SiegeControlPanel } from '@/components/SiegeControlPanel';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { InteriorLayoutEditor } from '@/components/InteriorLayoutEditor';
import { RoomPanel } from '@/components/RoomPanel';
import { RoomPropertyPanel } from '@/components/RoomPropertyPanel';
import { HeraldryPanel } from '@/components/HeraldryPanel';
import { useCastleStore } from '@/store/useCastleStore';
import { useSiegeStore } from '@/store/useSiegeStore';
import { useHeraldryStore } from '@/store/useHeraldryStore';
import { NPC_TYPE_INFO } from '@/types/castle';
import { X } from 'lucide-react';

export default function Home() {
  const [showUVPreview, setShowUVPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { params, viewMode, selectedNPCId, selectedNPCType, selectNPC } = useCastleStore();
  const { siegeMode, setSiegeMode } = useSiegeStore();
  const showHeraldryPanel = useHeraldryStore((s) => s.showPanel);
  const heraldryApplied = useHeraldryStore((s) => s.config.applied);

  useEffect(() => {
    setShowUVPreview(viewMode === 'uv');
  }, [viewMode]);

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleToggleSiegeMode = () => {
    setSiegeMode(!siegeMode);
  };

  const getSidePanel = () => {
    if (showHeraldryPanel) return <HeraldryPanel />;
    if (viewMode === 'interior') return <RoomPanel onDragStart={() => {}} />;
    if (siegeMode) return <SiegeControlPanel />;
    return <ControlPanel />;
  };

  return (
    <div className="w-full h-screen flex bg-stone-950 overflow-hidden">
      {getSidePanel()}
      
      <div className="flex-1 relative">
        <Toolbar
          onExport={handleExport}
          siegeMode={siegeMode}
          onToggleSiegeMode={handleToggleSiegeMode}
        />
        
        {viewMode === 'interior' ? (
          <InteriorLayoutEditor />
        ) : (
          <Scene3D viewMode={viewMode} />
        )}
        
        {viewMode !== 'interior' && !siegeMode && <HistoryTimeline />}
        
        {showUVPreview && (
          <UVPreview onClose={() => setShowUVPreview(false)} />
        )}
        
        {viewMode !== 'interior' && (
          <div className="absolute bottom-4 left-4 text-xs bg-stone-900/80 px-3 py-2 rounded backdrop-blur-sm"
            style={{ color: siegeMode ? '#ef4444' : '#78716c' }}>
            <div className="flex items-center gap-4 flex-wrap">
              <span>种子: {params.seed}</span>
              <span>|</span>
              <span>塔楼: {params.towerCount}</span>
              <span>|</span>
              <span>建筑: {params.buildingCount}</span>
              {!siegeMode && (
                <>
                  <span>|</span>
                  <span className="text-sky-400">
                    {params.weather === 'sunny' ? '☀️ 晴天' : params.weather === 'rainy' ? '🌧️ 雨天' : params.weather === 'snowy' ? '❄️ 雪天' : '🌫️ 雾天'}
                  </span>
                  <span>|</span>
                  <span className="text-amber-500">
                    {(() => {
                      const h = Math.floor(params.timeOfDay);
                      const m = Math.floor((params.timeOfDay - h) * 60);
                      const emoji = params.timeOfDay < 5 || params.timeOfDay >= 20 ? '🌙' : params.timeOfDay < 7 ? '🌅' : params.timeOfDay < 10 ? '🌄' : params.timeOfDay < 17 ? '☀️' : params.timeOfDay < 19 ? '🌇' : '🌆';
                      return `${emoji} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    })()}
                  </span>
                  <span>|</span>
                  <span className="text-amber-500">📜 {params.eraYear}年</span>
                </>
              )}
              {siegeMode && (
                <>
                  <span>|</span>
                  <span className="text-red-400">⚔️ 攻防模式</span>
                </>
              )}
              {heraldryApplied && (
                <>
                  <span>|</span>
                  <span className="text-purple-400">🛡️ 纹章已应用</span>
                </>
              )}
              {params.residentMode && !siegeMode && (
                <>
                  <span>|</span>
                  <span className="text-green-400">👥 居民模式 ({params.residentCount}人)</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'interior' && <RoomPropertyPanel />}

      {selectedNPCId && selectedNPCType && viewMode !== 'interior' && (
        <div className="absolute bottom-4 right-4 bg-stone-900/95 backdrop-blur-sm border border-amber-900/30 rounded-lg p-4 w-64 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{NPC_TYPE_INFO[selectedNPCType].icon}</span>
              <div>
                <h3 className="text-amber-200 font-bold text-sm">
                  {NPC_TYPE_INFO[selectedNPCType].name}
                </h3>
                <p className="text-[10px] text-stone-500 font-mono">ID: {selectedNPCId}</p>
              </div>
            </div>
            <button
              onClick={() => selectNPC(null, null)}
              className="p-1 hover:bg-stone-700/50 rounded transition-colors"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">类型</span>
              <span className="text-stone-200">{NPC_TYPE_INFO[selectedNPCType].name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">描述</span>
              <span className="text-stone-300 text-right">{NPC_TYPE_INFO[selectedNPCType].description}</span>
            </div>
            <div className="pt-2 border-t border-stone-700/50">
              <p className="text-[10px] text-stone-500">
                💡 点击其他居民可以切换查看
              </p>
            </div>
          </div>
        </div>
      )}

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}
