import { useRef, useState, useEffect, useCallback } from 'react';
import { useCastleStore } from '@/store/useCastleStore';
import { ROOM_TEMPLATES } from '@/data/roomTemplates';
import { Room, RoomType } from '@/types/castle';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function roomsOverlap(a: Room, b: Room): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function InteriorLayoutEditor() {
  const { params, interiorLayout, addRoom, selectRoom, moveRoom } = useCastleStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null);
  const [showToast, setShowToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const padding = 30;
  const scale = 10;

  const plotWidth = params.plotWidth;
  const plotDepth = params.plotDepth;
  const wallThickness = params.wallThickness;

  const svgWidth = plotWidth * scale + padding * 2;
  const svgHeight = plotDepth * scale + padding * 2;

  const castleInnerX = padding + wallThickness * scale;
  const castleInnerY = padding + wallThickness * scale;
  const castleInnerWidth = (plotWidth - wallThickness * 2) * scale;
  const castleInnerHeight = (plotDepth - wallThickness * 2) * scale;

  const innerWidth = plotWidth - wallThickness * 2;
  const innerHeight = plotDepth - wallThickness * 2;

  const clampRoom = useCallback((room: Room): Room => {
    return {
      ...room,
      x: Math.max(0, Math.min(innerWidth - room.width, room.x)),
      y: Math.max(0, Math.min(innerHeight - room.height, room.y)),
    };
  }, [innerWidth, innerHeight]);

  const hasOverlap = useCallback((room: Room, excludeId?: string): boolean => {
    return interiorLayout.rooms.some(r => {
      if (excludeId && r.id === excludeId) return false;
      return roomsOverlap(room, r);
    });
  }, [interiorLayout.rooms]);

  const showNotification = (type: 'error' | 'success', message: string) => {
    setShowToast({ type, message });
    setTimeout(() => setShowToast(null), 2000);
  };

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = clientX - rect.left;
      const svgY = clientY - rect.top;
      const worldX = (svgX - castleInnerX) / scale;
      const worldY = (svgY - castleInnerY) / scale;
      return { x: worldX, y: worldY };
    },
    [castleInnerX, castleInnerY, scale]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);

    const roomType = e.dataTransfer.types.includes('roomtype') ? (e.dataTransfer.getData('roomType') as RoomType) : null;
    if (!roomType || !ROOM_TEMPLATES[roomType]) return;

    const template = ROOM_TEMPLATES[roomType];
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    const preview: Room = clampRoom({
      id: 'preview',
      type: roomType,
      x: x - template.defaultWidth / 2,
      y: y - template.defaultHeight / 2,
      width: template.defaultWidth,
      height: template.defaultHeight,
      rotation: 0,
      name: '',
    });

    setPreviewRoom(preview);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragOver(false);
        setPreviewRoom(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const roomType = e.dataTransfer.getData('roomType') as RoomType;
    setPreviewRoom(null);
    if (!roomType) return;

    const template = ROOM_TEMPLATES[roomType];
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    const newRoom: Room = clampRoom({
      id: generateId(),
      type: roomType,
      x: x - template.defaultWidth / 2,
      y: y - template.defaultHeight / 2,
      width: template.defaultWidth,
      height: template.defaultHeight,
      rotation: 0,
      name: '',
    });

    const success = addRoom(newRoom);
    if (success) {
      showNotification('success', `已添加 ${template.name}`);
    } else {
      showNotification('error', '放置失败：房间重叠');
    }
  };

  const handleRoomMouseDown = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    selectRoom(room.id);
    setDraggingRoomId(room.id);

    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setDragOffset({
      x: x - room.x,
      y: y - room.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRoomId) return;

    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const room = interiorLayout.rooms.find((r) => r.id === draggingRoomId);
    if (!room) return;

    let newX = x - dragOffset.x;
    let newY = y - dragOffset.y;

    newX = Math.max(0, Math.min(innerWidth - room.width, newX));
    newY = Math.max(0, Math.min(innerHeight - room.height, newY));

    moveRoom(draggingRoomId, newX, newY);
  };

  const handleMouseUp = () => {
    setDraggingRoomId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || e.target === containerRef.current) {
      selectRoom(null);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggingRoomId(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const renderCorridors = () => {
    return interiorLayout.corridors.map((corridor) => {
      const pathPoints = corridor.path
        .map((p, i) => {
          const sx = castleInnerX + p.x * scale;
          const sy = castleInnerY + p.y * scale;
          return `${i === 0 ? 'M' : 'L'} ${sx} ${sy}`;
        })
        .join(' ');

      return (
        <g key={corridor.id}>
          <path
            d={pathPoints}
            fill="none"
            stroke="#78716c"
            strokeWidth={3 * scale * 0.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
          <path
            d={pathPoints}
            fill="none"
            stroke="#a8a29e"
            strokeWidth={1.5 * scale * 0.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 2"
          />
        </g>
      );
    });
  };

  const renderRooms = () => {
    return interiorLayout.rooms.map((room) => {
      const template = ROOM_TEMPLATES[room.type];
      const isSelected = interiorLayout.selectedRoomId === room.id;

      const cx = castleInnerX + (room.x + room.width / 2) * scale;
      const cy = castleInnerY + (room.y + room.height / 2) * scale;
      const w = room.width * scale;
      const h = room.height * scale;

      return (
        <g
          key={room.id}
          transform={`rotate(${room.rotation} ${cx} ${cy})`}
          onMouseDown={(e) => handleRoomMouseDown(e, room)}
          className="cursor-move"
          style={{ cursor: draggingRoomId === room.id ? 'grabbing' : 'grab' }}
        >
          <rect
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            fill={template.color}
            fillOpacity={0.85}
            stroke={isSelected ? '#fbbf24' : '#57534e'}
            strokeWidth={isSelected ? 3 : 1.5}
            rx={4}
            className="transition-all"
          />

          <rect
            x={cx - w / 2 + 2}
            y={cy - h / 2 + 2}
            width={w - 4}
            height={h - 4}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            rx={3}
          />

          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.min(w, h) * 0.3}
            style={{ pointerEvents: 'none' }}
          >
            {template.icon}
          </text>

          <text
            x={cx}
            y={cy + Math.min(w, h) * 0.25}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={10}
            fontWeight="500"
            style={{ pointerEvents: 'none' }}
          >
            {room.name || template.name}
          </text>

          {isSelected && (
            <>
              <rect
                x={cx - w / 2 - 5}
                y={cy - h / 2 - 5}
                width={w + 10}
                height={h + 10}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={1}
                strokeDasharray="4 3"
                rx={6}
                opacity={0.8}
              />
            </>
          )}
        </g>
      );
    });
  };

  const renderGrid = () => {
    const gridSize = 2 * scale;
    const lines = [];

    for (let x = 0; x <= castleInnerWidth; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={castleInnerX + x}
          y1={castleInnerY}
          x2={castleInnerX + x}
          y2={castleInnerY + castleInnerHeight}
          stroke="#44403c"
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }

    for (let y = 0; y <= castleInnerHeight; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={castleInnerX}
          y1={castleInnerY + y}
          x2={castleInnerX + castleInnerWidth}
          y2={castleInnerY + y}
          stroke="#44403c"
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }

    return lines;
  };

  const renderCastleOutline = () => {
    const outerX = padding;
    const outerY = padding;
    const outerW = plotWidth * scale;
    const outerH = plotDepth * scale;

    return (
      <>
        <rect
          x={outerX}
          y={outerY}
          width={outerW}
          height={outerH}
          fill="#57534e"
          fillOpacity={0.3}
          stroke="#78716c"
          strokeWidth={2}
          rx={8}
        />

        <rect
          x={outerX + wallThickness * scale * 0.3}
          y={outerY + wallThickness * scale * 0.3}
          width={outerW - wallThickness * scale * 0.6}
          height={outerH - wallThickness * scale * 0.6}
          fill="none"
          stroke="#a8a29e"
          strokeWidth={1}
          strokeDasharray="3 3"
          rx={6}
          opacity={0.4}
        />

        <rect
          x={castleInnerX}
          y={castleInnerY}
          width={castleInnerWidth}
          height={castleInnerHeight}
          fill="#292524"
          fillOpacity={0.9}
          stroke="#44403c"
          strokeWidth={1}
          rx={4}
        />
      </>
    );
  };

  const renderTowers = () => {
    const outerX = padding;
    const outerY = padding;
    const outerW = plotWidth * scale;
    const outerH = plotDepth * scale;
    const towerR = params.towerRadius * scale;

    const corners = [
      { x: outerX, y: outerY },
      { x: outerX + outerW, y: outerY },
      { x: outerX + outerW, y: outerY + outerH },
      { x: outerX, y: outerY + outerH },
    ];

    return corners.map((corner, i) => (
      <circle
        key={`tower-${i}`}
        cx={corner.x}
        cy={corner.y}
        r={towerR}
        fill="#78716c"
        stroke="#a8a29e"
        strokeWidth={1.5}
        opacity={0.7}
      />
    ));
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative flex items-center justify-center bg-stone-950 overflow-auto transition-all ${
        isDragOver ? 'bg-amber-950/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    >
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        className={`shadow-2xl transition-all ${isDragOver ? 'scale-105' : ''}`}
        style={{
          filter: isDragOver ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.3))' : 'none',
        }}
      >
        <defs>
          <pattern id="floorPattern" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#292524" />
            <line x1="0" y1="0" x2="10" y2="0" stroke="#3f3f46" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#3f3f46" strokeWidth="0.5" />
          </pattern>
        </defs>

        {renderCastleOutline()}
        {renderTowers()}
        {renderGrid()}
        {renderCorridors()}
        {renderRooms()}
        {previewRoom && (() => {
          const template = ROOM_TEMPLATES[previewRoom.type];
          const cx = castleInnerX + (previewRoom.x + previewRoom.width / 2) * scale;
          const cy = castleInnerY + (previewRoom.y + previewRoom.height / 2) * scale;
          const w = previewRoom.width * scale;
          const h = previewRoom.height * scale;
          const overlap = hasOverlap(previewRoom);
          const color = overlap ? '#ef4444' : '#22c55e';
          return (
            <g transform={`rotate(${previewRoom.rotation} ${cx} ${cy})`} opacity={0.7}>
              <rect
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                fill={color}
                fillOpacity={0.3}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 4"
                rx={4}
              />
              <text
                x={cx}
                y={cy - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(w, h) * 0.25}
                style={{ pointerEvents: 'none' }}
                opacity={0.8}
              >
                {template.icon}
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="absolute bottom-4 left-4 text-xs bg-stone-900/80 px-3 py-2 rounded backdrop-blur-sm text-stone-500">
        <div className="flex items-center gap-4">
          <span>🏰 内部尺寸: {(plotWidth - wallThickness * 2).toFixed(0)}×{(plotDepth - wallThickness * 2).toFixed(0)}m</span>
          <span>|</span>
          <span>📐 比例: 1格 = 2m</span>
        </div>
      </div>

      {interiorLayout.rooms.length === 0 && !isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-5xl mb-3 opacity-30">🏰</div>
            <p className="text-stone-600 text-sm">从左侧拖拽房间到城堡内部</p>
          </div>
        </div>
      )}

      {showToast && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg shadow-2xl backdrop-blur-sm font-medium text-sm transition-all animate-[fadeIn_0.2s_ease-out] ${
          showToast.type === 'error'
            ? 'bg-red-900/90 text-red-200 border border-red-700/50'
            : 'bg-green-900/90 text-green-200 border border-green-700/50'
        }`}>
          {showToast.type === 'error' ? '⚠️ ' : '✅ '}
          {showToast.message}
        </div>
      )}
    </div>
  );
}
