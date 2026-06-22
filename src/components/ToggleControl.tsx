import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  locked?: boolean;
  paramKey?: string;
  onToggleLock?: (paramKey: string) => void;
  showLockButton?: boolean;
}

export function ToggleControl({
  label,
  checked,
  onChange,
  description,
  locked = false,
  paramKey,
  onToggleLock,
  showLockButton = true,
}: ToggleControlProps) {
  return (
    <div className={cn("flex items-center justify-between", locked && "opacity-60")}>
      <div className="flex items-center gap-1.5">
        <div>
          <label className={cn("text-sm font-medium", locked ? "text-stone-500" : "text-stone-300")}>{label}</label>
          {description && (
            <p className="text-xs text-stone-500 mt-0.5">{description}</p>
          )}
        </div>
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
      <button
        onClick={() => !locked && onChange(!checked)}
        disabled={locked}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-800",
          locked ? "cursor-not-allowed" : "cursor-pointer",
          checked ? 'bg-amber-600' : 'bg-stone-600'
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200",
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
