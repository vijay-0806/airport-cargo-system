import React from 'react';

interface ProgressBarProps {
  value: number; // percentage 0-100
  label?: string;
  sublabel?: string;
  colorClass?: string;
  heightClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  sublabel,
  colorClass,
  heightClass = 'h-2.5',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const getColor = () => {
    if (colorClass) return colorClass;
    if (clamped >= 90) return 'bg-rose-500';
    if (clamped >= 75) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  return (
    <div className="w-full">
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-xs mb-1">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {sublabel && <span className="text-slate-500">{sublabel}</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${getColor()} ${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
