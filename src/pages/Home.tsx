import { useState } from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { Scene3D } from '@/components/Scene3D';
import { Toolbar } from '@/components/Toolbar';
import { UVPreview } from '@/components/UVPreview';
import { ExportDialog } from '@/components/ExportDialog';
import { SiegeControlPanel } from '@/components/SiegeControlPanel';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { ViewMode } from '@/types/castle';
import { useCastleStore } from '@/store/useCastleStore';
import { useSiegeStore } from '@/store/useSiegeStore';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('solid');
  const [showUVPreview, setShowUVPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { params } = useCastleStore();
  const { siegeMode, setSiegeMode } = useSiegeStore();

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setShowUVPreview(mode === 'uv');
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleToggleSiegeMode = () => {
    setSiegeMode(!siegeMode);
  };

  return (
    <div className="w-full h-screen flex bg-stone-950 overflow-hidden">
      {siegeMode ? <SiegeControlPanel /> : <ControlPanel />}
      
      <div className="flex-1 relative">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onExport={handleExport}
          siegeMode={siegeMode}
          onToggleSiegeMode={handleToggleSiegeMode}
        />
        
        <Scene3D viewMode={viewMode} />
        
        {!siegeMode && <HistoryTimeline />}
        
        {showUVPreview && (
          <UVPreview onClose={() => setShowUVPreview(false)} />
        )}
        
        <div className="absolute bottom-4 left-4 text-xs bg-stone-900/80 px-3 py-2 rounded backdrop-blur-sm"
          style={{ color: siegeMode ? '#ef4444' : '#78716c' }}>
          <div className="flex items-center gap-4">
            <span>种子: {params.seed}</span>
            <span>|</span>
            <span>塔楼: {params.towerCount}</span>
            <span>|</span>
            <span>建筑: {params.buildingCount}</span>
            {!siegeMode && (
              <>
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
          </div>
        </div>
      </div>

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}
