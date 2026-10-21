import React from 'react';
import { ShipmentStatus } from '../../utils/cargo-rules.ts';

interface StatusBadgeProps {
  status: ShipmentStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'Registered':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Received':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Stored':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Loaded':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'In Transit':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = (s: string) => {
    switch (s) {
      case 'Registered':
        return 'bg-slate-400';
      case 'Received':
        return 'bg-cyan-500';
      case 'Stored':
        return 'bg-blue-600';
      case 'Processing':
        return 'bg-amber-500';
      case 'Loaded':
        return 'bg-purple-600';
      case 'In Transit':
        return 'bg-indigo-600 animate-pulse';
      case 'Delivered':
        return 'bg-emerald-600';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${getStyle(
        status
      )} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(status)}`} />
      {status}
    </span>
  );
};
