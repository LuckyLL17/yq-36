import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-amber-900/30 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-600">{icon}</span>
          <span className="font-semibold text-stone-200 text-sm tracking-wide">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pb-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}
