import { create } from 'zustand';
import {
  HeraldryConfig,
  HeraldryBaseColor,
  HeraldryBorderStyle,
  HeraldryCenterPattern,
  HeraldryColorScheme,
} from '@/types/castle';

const defaultConfig: HeraldryConfig = {
  baseColor: 'crimson',
  borderStyle: 'simple',
  centerPattern: 'lion',
  colorScheme: 'classic',
  applied: false,
};

interface HeraldryState {
  config: HeraldryConfig;
  showPanel: boolean;
  setBaseColor: (color: HeraldryBaseColor) => void;
  setBorderStyle: (style: HeraldryBorderStyle) => void;
  setCenterPattern: (pattern: HeraldryCenterPattern) => void;
  setColorScheme: (scheme: HeraldryColorScheme) => void;
  apply: () => void;
  reset: () => void;
  togglePanel: () => void;
  setShowPanel: (show: boolean) => void;
}

export const useHeraldryStore = create<HeraldryState>((set) => ({
  config: { ...defaultConfig },
  showPanel: false,
  setBaseColor: (baseColor) =>
    set((state) => ({ config: { ...state.config, baseColor } })),
  setBorderStyle: (borderStyle) =>
    set((state) => ({ config: { ...state.config, borderStyle } })),
  setCenterPattern: (centerPattern) =>
    set((state) => ({ config: { ...state.config, centerPattern } })),
  setColorScheme: (colorScheme) =>
    set((state) => ({ config: { ...state.config, colorScheme } })),
  apply: () =>
    set((state) => ({ config: { ...state.config, applied: true }, showPanel: false })),
  reset: () => set({ config: { ...defaultConfig } }),
  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),
  setShowPanel: (showPanel) => set({ showPanel }),
}));
