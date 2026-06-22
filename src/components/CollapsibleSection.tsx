import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  groupId?: string;
  locked?: boolean;
  onToggleLock?: () => void;
  showLockButton?: boolean;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  groupId,
  locked = false,
  onToggleLock,
  showLockButton = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-amber-900/30 last:border-b-0">
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between px-4 py-3 text-left hover:bg-amber-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-600">{icon}</span>
            <span className={cn(
              "font-semibold text-sm tracking-wide",
              locked ? "text-stone-500" : "text-stone-200"
            )}>
              {title}
            </span>
            {locked && (
              <span className="px-1.5 py-0.5 bg-amber-600/20 rounded text-[9px] text-amber-400 font-medium">
                已锁定
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>
        {showLockButton && onToggleLock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            className={cn(
              "p-2 mr-2 rounded-lg transition-colors",
              locked
                ? "text-amber-500 bg-amber-600/20 hover:bg-amber-600/30"
                : "text-stone-500 hover:text-stone-300 hover:bg-stone-700/50"
            )}
            title={locked ? "解锁分组参数" : "锁定分组参数"}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className={cn(
          "px-4 pb-4 space-y-3",
          locked && "opacity-60"
        )}>{children}</div>
      </div>
    </div>
  );
}
