import React from 'react';
import {
  LayoutDashboard,
  Package,
  Send,
  Warehouse,
  Search,
  Users,
  FileCode,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../../types/index.ts';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
  onResetSeed: () => void;
  isResetting: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onResetSeed,
  isResetting,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cargo', label: 'Cargo Inventory', icon: Package },
    { id: 'shipments', label: 'Shipment Lifecycle', icon: Send },
    { id: 'warehouses', label: 'Warehouses & Bay', icon: Warehouse },
    { id: 'tracking', label: 'Cargo Tracking', icon: Search, badge: 'Redis' },
    ...(user?.role === 'ADMIN'
      ? [{ id: 'users', label: 'Staff Management', icon: Users }]
      : []),
    { id: 'docs', label: 'Architecture & Docs', icon: FileCode },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Operations
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Airport Status Widget */}
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Terminal Gate Status</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Flight Cargo Ramp: Normal
            <br />
            Customs Clearance: Online
          </div>
        </div>
      </div>

      {/* Footer & Demo Reset */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onResetSeed}
          disabled={isResetting}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Resetting DB...' : 'Reset Demo Data'}
        </button>

        <div className="text-[10px] text-slate-500 text-center font-mono">
          Airport Cargo OS v2.4 (College Project)
        </div>
      </div>
    </aside>
  );
};
