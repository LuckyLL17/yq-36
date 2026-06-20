import { useRef, useEffect, useCallback } from 'react';
import { Shield, X, Check, RotateCcw } from 'lucide-react';
import { useHeraldryStore } from '@/store/useHeraldryStore';
import {
  HeraldryBaseColor,
  HeraldryBorderStyle,
  HeraldryCenterPattern,
  HeraldryColorScheme,
  HeraldryConfig,
  HERALDRY_BASE_COLORS,
  HERALDRY_COLOR_SCHEMES,
} from '@/types/castle';
import { renderHeraldryToCanvas } from '@/utils/HeraldryRenderer';

const BASE_COLOR_OPTIONS: { value: HeraldryBaseColor; label: string }[] = [
  { value: 'crimson', label: '绯红' },
  { value: 'azure', label: '蔚蓝' },
  { value: 'sable', label: '墨黑' },
  { value: 'or', label: '金橙' },
  { value: 'argent', label: '银白' },
  { value: 'gules', label: '赤红' },
  { value: 'purpure', label: '紫罗兰' },
  { value: 'vert', label: '翠绿' },
];

const BORDER_STYLE_OPTIONS: { value: HeraldryBorderStyle; label: string }[] = [
  { value: 'none', label: '无边框' },
  { value: 'simple', label: '简洁' },
  { value: 'double', label: '双层' },
  { value: 'indented', label: '锯齿' },
  { value: 'wavy', label: '波浪' },
  { value: 'lozengy', label: '菱形' },
];

const CENTER_PATTERN_OPTIONS: { value: HeraldryCenterPattern; label: string; icon: string }[] = [
  { value: 'lion', label: '雄狮', icon: '🦁' },
  { value: 'eagle', label: '雄鹰', icon: '🦅' },
  { value: 'cross', label: '十字', icon: '✚' },
  { value: 'fleur_de_lis', label: '鸢尾花', icon: '⚜' },
  { value: 'dragon', label: '巨龙', icon: '🐉' },
  { value: 'sword', label: '宝剑', icon: '⚔' },
  { value: 'crown', label: '王冠', icon: '👑' },
  { value: 'star', label: '星辰', icon: '★' },
];

const COLOR_SCHEME_OPTIONS: { value: HeraldryColorScheme; label: string; desc: string }[] = [
  { value: 'classic', label: '经典', desc: '红金黑' },
  { value: 'royal', label: '皇家', desc: '蓝金紫' },
  { value: 'warlike', label: '尚武', desc: '红黑褐' },
  { value: 'nature', label: '自然', desc: '绿金褐' },
  { value: 'holy', label: '神圣', desc: '白蓝金' },
  { value: 'mystic', label: '神秘', desc: '紫金黑' },
];

function HeraldryPreview({ config }: { config: HeraldryConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderHeraldryToCanvas(ctx, canvas.width, canvas.height, config);
  }, [config]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={340}
      className="w-full rounded-lg border-2 border-amber-700/50 shadow-lg shadow-amber-900/20"
      style={{ imageRendering: 'auto' }}
    />
  );
}

function ColorSwatch({ color, selected, onClick, label }: { color: string; selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-8 h-8 rounded-full border-2 transition-all ${
        selected
          ? 'border-amber-400 scale-110 shadow-lg shadow-amber-400/30'
          : 'border-stone-600 hover:border-stone-400 hover:scale-105'
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

export function HeraldryPanel() {
  const {
    config,
    setBaseColor,
    setBorderStyle,
    setCenterPattern,
    setColorScheme,
    apply,
    reset,
    setShowPanel,
  } = useHeraldryStore();

  return (
    <div className="w-80 bg-stone-900/95 backdrop-blur-sm border-r border-amber-900/30 flex flex-col h-full">
      <div className="p-4 border-b border-amber-900/30 bg-gradient-to-r from-stone-900 to-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-amber-100 tracking-wide">纹章设计</h1>
              <p className="text-xs text-stone-400">自定义城堡纹章</p>
            </div>
          </div>
          <button
            onClick={() => setShowPanel(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
        <div className="p-4 space-y-5">
          <div className="flex justify-center">
            <HeraldryPreview config={config} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200 tracking-wide">纹章底色</label>
            <div className="flex flex-wrap gap-2">
              {BASE_COLOR_OPTIONS.map(({ value, label }) => (
                <ColorSwatch
                  key={value}
                  color={HERALDRY_BASE_COLORS[value]}
                  selected={config.baseColor === value}
                  onClick={() => setBaseColor(value)}
                  label={label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200 tracking-wide">边框样式</label>
            <div className="grid grid-cols-3 gap-2">
              {BORDER_STYLE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setBorderStyle(value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    config.borderStyle === value
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'bg-stone-800 text-stone-300 border border-stone-600 hover:border-amber-600/50 hover:text-stone-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200 tracking-wide">中心图案</label>
            <div className="grid grid-cols-4 gap-2">
              {CENTER_PATTERN_OPTIONS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setCenterPattern(value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs transition-all ${
                    config.centerPattern === value
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'bg-stone-800 text-stone-300 border border-stone-600 hover:border-amber-600/50'
                  }`}
                >
                  <span className="text-lg leading-none">{icon}</span>
                  <span className="text-[10px] leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200 tracking-wide">配色方案</label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_SCHEME_OPTIONS.map(({ value, label, desc }) => {
                const scheme = HERALDRY_COLOR_SCHEMES[value];
                return (
                  <button
                    key={value}
                    onClick={() => setColorScheme(value)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs transition-all ${
                      config.colorScheme === value
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                        : 'bg-stone-800 text-stone-300 border border-stone-600 hover:border-amber-600/50'
                    }`}
                  >
                    <div className="flex gap-0.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.primary }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.secondary }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.accent }} />
                    </div>
                    <span className="font-medium">{label}</span>
                    <span className="text-[10px] opacity-70">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-amber-900/30 bg-stone-900 space-y-2">
        <button
          onClick={apply}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition-all shadow-md shadow-amber-600/20"
        >
          <Check className="w-4 h-4" />
          完成并应用
        </button>
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs hover:bg-stone-700 transition-colors border border-stone-600"
        >
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
      </div>
    </div>
  );
}
