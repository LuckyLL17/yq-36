import { useState } from 'react';
import { useCastleStore } from '@/store/useCastleStore';
import { ROOM_TEMPLATES } from '@/data/roomTemplates';
import { Settings, Trash2, RotateCw, Maximize2 } from 'lucide-react';

export function RoomPropertyPanel() {
  const { interiorLayout, updateRoom, deleteRoom } = useCastleStore();
  const selectedRoom = interiorLayout.rooms.find((r) => r.id === interiorLayout.selectedRoomId);
  const [toast, setToast] = useState<{ type: 'error'; message: string } | null>(null);

  const showError = (message: string) => {
    setToast({ type: 'error', message });
    setTimeout(() => setToast(null), 2000);
  };

  if (!selectedRoom) {
    return (
      <div className="w-64 bg-stone-900/95 backdrop-blur-sm border-l border-amber-900/30 flex flex-col h-full">
        <div className="p-4 border-b border-amber-900/30 bg-gradient-to-l from-stone-900 to-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-700/50 rounded-lg">
              <Settings className="w-5 h-5 text-stone-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-400">属性</h2>
              <p className="text-xs text-stone-600">选择房间编辑</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-stone-600">
            <Maximize2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">点击房间进行编辑</p>
          </div>
        </div>
      </div>
    );
  }

  const template = ROOM_TEMPLATES[selectedRoom.type];

  const handleWidthChange = (value: number) => {
    const success = updateRoom(selectedRoom.id, { width: Math.max(2, value) });
    if (!success) showError('宽度调整失败：与其他房间重叠');
  };

  const handleHeightChange = (value: number) => {
    const success = updateRoom(selectedRoom.id, { height: Math.max(2, value) });
    if (!success) showError('高度调整失败：与其他房间重叠');
  };

  const handleRotationChange = (value: number) => {
    const success = updateRoom(selectedRoom.id, { rotation: value });
    if (!success) showError('旋转失败：与其他房间重叠');
  };

  const handleNameChange = (value: string) => {
    updateRoom(selectedRoom.id, { name: value });
  };

  return (
    <div className="w-64 bg-stone-900/95 backdrop-blur-sm border-l border-amber-900/30 flex flex-col h-full relative">
      {toast && (
        <div className="absolute top-2 left-2 right-2 z-20 px-3 py-2 rounded bg-red-900/95 text-red-200 border border-red-700/50 text-xs font-medium shadow-lg">
          ⚠️ {toast.message}
        </div>
      )}

      <div className="p-4 border-b border-amber-900/30 bg-gradient-to-l from-stone-900 to-stone-800">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: template.color + '30' }}
          >
            <span className="text-xl">{template.icon}</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-100">{template.name}</h2>
            <p className="text-xs text-stone-400">属性编辑</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2">
            房间名称
          </label>
          <input
            type="text"
            value={selectedRoom.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={template.name}
            className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-sm text-stone-200 focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2">
            宽度: {selectedRoom.width.toFixed(1)}m
          </label>
          <input
            type="range"
            min="2"
            max="25"
            step="0.5"
            value={selectedRoom.width}
            onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2">
            高度: {selectedRoom.height.toFixed(1)}m
          </label>
          <input
            type="range"
            min="2"
            max="25"
            step="0.5"
            value={selectedRoom.height}
            onChange={(e) => handleHeightChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2">
            朝向: {selectedRoom.rotation}°
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={selectedRoom.rotation}
              onChange={(e) => handleRotationChange(parseInt(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <button
              onClick={() => handleRotationChange((selectedRoom.rotation + 90) % 360)}
              className="p-2 bg-stone-800 hover:bg-stone-700 rounded text-stone-400 hover:text-amber-400 transition-all"
              title="旋转90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-800">
          <div className="text-xs text-stone-500 mb-2">位置信息</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-800/50 rounded p-2">
              <div className="text-stone-500">X</div>
              <div className="text-stone-300 font-mono">{selectedRoom.x.toFixed(1)}</div>
            </div>
            <div className="bg-stone-800/50 rounded p-2">
              <div className="text-stone-500">Y</div>
              <div className="text-stone-300 font-mono">{selectedRoom.y.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={() => deleteRoom(selectedRoom.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded text-sm font-medium transition-all border border-red-900/50"
        >
          <Trash2 className="w-4 h-4" />
          删除房间
        </button>
      </div>
    </div>
  );
}
