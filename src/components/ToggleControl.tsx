interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function ToggleControl({ label, checked, onChange, description }: ToggleControlProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm text-stone-300 font-medium">{label}</label>
        {description && (
          <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-800 ${
          checked ? 'bg-amber-600' : 'bg-stone-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
