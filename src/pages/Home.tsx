import { useState } from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { Scene3D } from '@/components/Scene3D';
import { Toolbar } from '@/components/Toolbar';
import { UVPreview } from '@/components/UVPreview';
import { ViewMode } from '@/types/castle';
import { useCastleStore } from '@/store/useCastleStore';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('solid');
  const [showUVPreview, setShowUVPreview] = useState(false);
  const { params } = useCastleStore();

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setShowUVPreview(mode === 'uv');
  };

  const handleExport = () => {
    alert('导出功能开发中...');
  };

  return (
    <div className="w-full h-screen flex bg-stone-950 overflow-hidden">
      <ControlPanel />
      
      <div className="flex-1 relative">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onExport={handleExport}
        />
        
        <Scene3D viewMode={viewMode} />
        
        {showUVPreview && (
          <UVPreview onClose={() => setShowUVPreview(false)} />
        )}
        
        <div className="absolute bottom-4 left-4 text-xs text-stone-500 bg-stone-900/80 px-3 py-2 rounded backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <span>种子: {params.seed}</span>
            <span>|</span>
            <span>塔楼: {params.towerCount}</span>
            <span>|</span>
            <span>建筑: {params.buildingCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
