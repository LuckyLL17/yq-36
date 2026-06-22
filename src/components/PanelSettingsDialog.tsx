import { X, Eye, EyeOff, Mountain, CloudSun, Layers, Hash, Building2, Shield, Castle, DoorOpen, Droplets, Users, Palette } from 'lucide-react';
import { PanelGroupId } from '@/types/castle';
import { cn } from '@/lib/utils';

interface PanelSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  panelGroups: Record<PanelGroupId, boolean>;
  onTogglePanel: (groupId: PanelGroupId) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const PANEL_GROUP_CONFIG: { id: PanelGroupId; title: string; icon: React.ReactNode }[] = [
  { id: 'terrain', title: '地形设置', icon: <Mountain className="w-4 h-4" /> },
  { id: 'weather', title: '天气环境', icon: <CloudSun className="w-4 h-4" /> },
  { id: 'wallStyle', title: '城墙风格', icon: <Layers className="w-4 h-4" /> },
  { id: 'plot', title: '地块设置', icon: <Hash className="w-4 h-4" /> },
  { id: 'walls', title: '城墙设置', icon: <Building2 className="w-4 h-4" /> },
  { id: 'towers', title: '塔楼设置', icon: <Castle className="w-4 h-4" /> },
  { id: 'gates', title: '城门设置', icon: <DoorOpen className="w-4 h-4" /> },
  { id: 'moat', title: '护城河系统', icon: <Droplets className="w-4 h-4" /> },
  { id: 'buildings', title: '内部建筑', icon: <Building2 className="w-4 h-4" /> },
  { id: 'residents', title: '居民模式', icon: <Users className="w-4 h-4" /> },
  { id: 'materials', title: '材质效果', icon: <Palette className="w-4 h-4" /> },
  { id: 'seed', title: '随机种子', icon: <Hash className="w-4 h-4" /> },
];

export function PanelSettingsDialog({
  isOpen,
  onClose,
  panelGroups,
  onTogglePanel,
  onShowAll,
  onHideAll,
}: PanelSettingsDialogProps) {
  if (!isOpen) return null;

  const visibleCount = Object.values(panelGroups).filter(Boolean).length;
  const totalCount = Object.keys(panelGroups).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-96 bg-stone-900 border border-amber-900/50 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-amber-900/30 bg-gradient-to-r from-stone-900 to-stone-800">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-amber-100">面板显示设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-700/50 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-stone-400">
              显示 {visibleCount} / {totalCount} 个面板
            </p>
            <div className="flex gap-2">
              <button
                onClick={onShowAll}
                className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 rounded text-xs text-amber-300 transition-colors"
              >
                全部显示
              </button>
              <button
                onClick={onHideAll}
                className="px-3 py-1.5 bg-stone-700/50 hover:bg-stone-600/50 border border-stone-600 rounded text-xs text-stone-300 transition-colors"
              >
                全部隐藏
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {PANEL_GROUP_CONFIG.map(({ id, title, icon }) => {
              const isVisible = panelGroups[id];
              return (
                <button
                  key={id}
                  onClick={() => onTogglePanel(id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                    isVisible
                      ? "bg-amber-600/20 border-amber-500/50 hover:bg-amber-600/30"
                      : "bg-stone-800/50 border-stone-700 hover:bg-stone-700/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={isVisible ? "text-amber-500" : "text-stone-500"}>
                      {icon}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      isVisible ? "text-amber-200" : "text-stone-400"
                    )}>
                      {title}
                    </span>
                  </div>
                  {isVisible ? (
                    <Eye className="w-4 h-4 text-amber-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-stone-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-amber-900/30 bg-stone-900/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
