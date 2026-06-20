import { RoomTemplate, RoomType } from '@/types/castle';

export const ROOM_TEMPLATES: Record<RoomType, RoomTemplate> = {
  hall: {
    type: 'hall',
    name: '大厅',
    icon: '🏛️',
    defaultWidth: 12,
    defaultHeight: 8,
    color: '#d97706',
  },
  bedroom: {
    type: 'bedroom',
    name: '卧室',
    icon: '🛏️',
    defaultWidth: 6,
    defaultHeight: 5,
    color: '#7c3aed',
  },
  kitchen: {
    type: 'kitchen',
    name: '厨房',
    icon: '🍳',
    defaultWidth: 8,
    defaultHeight: 6,
    color: '#dc2626',
  },
  armory: {
    type: 'armory',
    name: '军械库',
    icon: '⚔️',
    defaultWidth: 8,
    defaultHeight: 7,
    color: '#6b7280',
  },
  church: {
    type: 'church',
    name: '教堂',
    icon: '⛪',
    defaultWidth: 10,
    defaultHeight: 12,
    color: '#0891b2',
  },
  dungeon: {
    type: 'dungeon',
    name: '地牢',
    icon: '🔒',
    defaultWidth: 6,
    defaultHeight: 8,
    color: '#374151',
  },
  library: {
    type: 'library',
    name: '图书馆',
    icon: '📚',
    defaultWidth: 8,
    defaultHeight: 6,
    color: '#92400e',
  },
  garden: {
    type: 'garden',
    name: '花园',
    icon: '🌿',
    defaultWidth: 10,
    defaultHeight: 8,
    color: '#16a34a',
  },
};

export const ROOM_TEMPLATE_LIST: RoomTemplate[] = [
  ROOM_TEMPLATES.hall,
  ROOM_TEMPLATES.bedroom,
  ROOM_TEMPLATES.kitchen,
  ROOM_TEMPLATES.armory,
  ROOM_TEMPLATES.church,
  ROOM_TEMPLATES.dungeon,
  ROOM_TEMPLATES.library,
  ROOM_TEMPLATES.garden,
];
