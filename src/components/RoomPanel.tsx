import { ROOM_TEMPLATE_LIST } from '@/data/roomTemplates';
import { RoomType } from '@/types/castle';
import { Trash2, LayoutGrid } from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';

interface RoomPanelProps {
  onDragStart: (type: RoomType) => void;
}

export function RoomPanel({ onDragStart }: RoomPanelProps) {
  const { clearAllRooms, interiorLayout } = useCastleStore();

  const handleDragStart = (e: React.DragEvent, type: RoomType) => {
    e.dataTransfer.setData('roomType', type);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(type);
  };

  return (
    <div className="w-64 bg-stone-900/95 backdrop-blur-sm border-r border-amber-900/30 flex flex-col h-full">
      <div className="p-4 border-b border-amber-900/30 bg-gradient-to-r from-stone-900 to-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600/20 rounded-lg">
            <LayoutGrid className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-100">房间库</h2>
            <p className="text-xs text-stone-400">拖拽放置到城堡内</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {ROOM_TEMPLATE_LIST.map((template) => (
          <div
            key={template.type}
            draggable
            onDragStart={(e) => handleDragStart(e, template.type)}
            className="flex items-center gap-3 p-3 bg-stone-800/80 rounded-lg cursor-grab hover:bg-stone-700/80 transition-all border border-stone-700 hover:border-amber-600/50 active:cursor-grabbing group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner"
              style={{ backgroundColor: template.color + '30' }}
            >
              {template.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-stone-200">{template.name}</div>
              <div className="text-xs text-stone-500">
                {template.defaultWidth}×{template.defaultHeight}m
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-stone-800 space-y-2">
        <div className="text-xs text-stone-500">
          已放置 {interiorLayout.rooms.length} 个房间
        </div>
        <button
          onClick={clearAllRooms}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-800 hover:bg-red-900/30 text-stone-400 hover:text-red-400 rounded text-xs font-medium transition-all border border-stone-700 hover:border-red-900/50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          清空全部
        </button>
      </div>
    </div>
  );
}
