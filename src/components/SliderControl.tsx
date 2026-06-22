import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  format?: (value: number) => string;
  locked?: boolean;
  paramKey?: string;
  onToggleLock?: (paramKey: string) => void;
  showLockButton?: boolean;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  format,
  locked = false,
  paramKey,
  onToggleLock,
  showLockButton = true,
}: SliderControlProps) {
  const displayValue = format ? format(value) : `${value.toFixed(step < 1 ? 1 : 0)}${unit}`;

  return (
    <div className={cn("space-y-1.5", locked && "opacity-60")}>
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5">
          <label className={cn("font-medium", locked ? "text-stone-500" : "text-stone-400")}>{label}</label>
          {showLockButton && paramKey && onToggleLock && (
            <button
              onClick={() => onToggleLock(paramKey)}
              className={cn(
                "p-0.5 rounded transition-colors",
                locked
                  ? "text-amber-500"
                  : "text-stone-600 hover:text-stone-400"
              )}
              title={locked ? "解锁参数" : "锁定参数"}
            >
              {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}
        </div>
        <span className="text-amber-500 font-mono tabular-nums">
          {displayValue}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => !locked && onChange(parseFloat(e.target.value))}
          disabled={locked}
          className={cn(
            "w-full h-2 bg-stone-700 rounded-full appearance-none",
            locked ? "cursor-not-allowed" : "cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-amber-500",
            "[&::-webkit-slider-thumb]:shadow-lg",
            "[&::-webkit-slider-thumb]:shadow-amber-500/30",
            "[&::-webkit-slider-thumb]:transition-transform",
            !locked && "[&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:h-4",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-amber-500",
            "[&::-moz-range-thumb]:border-none"
          )}
          style={{
            background: `linear-gradient(to right, #b45309 0%, #b45309 ${((value - min) / (max - min)) * 100}%, #44403c ${((value - min) / (max - min)) * 100}%, #44403c 100%)`,
            opacity: locked ? 0.5 : 1,
          }}
        />
      </div>
    </div>
  );
}
