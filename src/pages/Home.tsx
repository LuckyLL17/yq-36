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

export default function Home() {
  const [showUVPreview, setShowUVPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { params, viewMode } = useCastleStore();
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
            </div>
          </div>
        )}
      </div>

      {viewMode === 'interior' && <RoomPropertyPanel />}

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}
