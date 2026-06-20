import { Download, Grid3X3, Box, Shuffle, RotateCcw, Eye, Swords, LayoutGrid } from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';
import { ViewMode } from '@/types/castle';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExport: () => void;
  siegeMode: boolean;
  onToggleSiegeMode: () => void;
}

export function Toolbar({ viewMode, onViewModeChange, onExport, siegeMode, onToggleSiegeMode }: ToolbarProps) {
  const { resetParams, randomizeSeed } = useCastleStore();

  const viewModes: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'solid', label: '实体', icon: <Box className="w-4 h-4" /> },
    { mode: 'wireframe', label: '线框', icon: <Grid3X3 className="w-4 h-4" /> },
    { mode: 'uv', label: 'UV', icon: <Eye className="w-4 h-4" /> },
    { mode: 'interior', label: '内部布局', icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1.5 bg-stone-900/90 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-xl">
      <div className="flex items-center gap-0.5 pr-2 border-r border-stone-700">
        <button
          onClick={onToggleSiegeMode}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
            siegeMode
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'text-stone-400 hover:text-red-400 hover:bg-stone-800'
          )}
          title="攻防沙盘"
        >
          <Swords className="w-4 h-4" />
          <span className="hidden sm:inline">攻防</span>
        </button>
      </div>

      <div className="flex items-center gap-0.5 pr-2 border-r border-stone-700">
        {viewModes.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
              viewMode === mode
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            )}
            title={label}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 px-2 border-r border-stone-700">
        <button
          onClick={randomizeSeed}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-all"
          title="随机种子"
        >
          <Shuffle className="w-4 h-4" />
          <span className="hidden sm:inline">随机</span>
        </button>
        <button
          onClick={resetParams}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-all"
          title="重置参数"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">重置</span>
        </button>
      </div>

      <div className="flex items-center gap-0.5 pl-2">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-amber-600 text-white hover:bg-amber-500 transition-all shadow-md shadow-amber-600/20"
          title="导出模型"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">导出</span>
        </button>
      </div>
    </div>
  );
}
