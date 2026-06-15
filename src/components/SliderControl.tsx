interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: SliderControlProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="text-stone-400 font-medium">{label}</label>
        <span className="text-amber-500 font-mono tabular-nums">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-stone-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-amber-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-amber-500/30
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-amber-500
            [&::-moz-range-thumb]:border-none
            [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #b45309 0%, #b45309 ${((value - min) / (max - min)) * 100}%, #44403c ${((value - min) / (max - min)) * 100}%, #44403c 100%)`
          }}
        />
      </div>
    </div>
  );
}
