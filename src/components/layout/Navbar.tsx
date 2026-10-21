import React, { useState } from 'react';
import { Plane, Search, Shield, User, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { User as UserType } from '../../types/index.ts';

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  onQuickTrack: (code: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onNavigate,
  onQuickTrack,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [trackInput, setTrackInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onQuickTrack(trackInput.trim());
      setTrackInput('');
    }
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Airport Hub */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  AERO<span className="text-blue-400">CARGO</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    FRA HUB
                  </span>
                </span>
                <span className="text-[11px] block text-slate-400 font-mono">
                  Cargo &amp; Warehouse Terminal
                </span>
              </div>
            </button>
          </div>

          {/* Center: Quick Tracking Input */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleTrackSubmit} className="w-full relative">
              <input
                type="text"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder="Quick Track Cargo (e.g. CG-10025)..."
                className="w-full bg-slate-800/80 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-8 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="submit"
                aria-label="Track cargo"
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Right: User status & Logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                  <span className="text-[10px] flex items-center justify-end gap-1 font-mono text-slate-400">
                    <Shield className="w-3 h-3 text-blue-400" />
                    {user.role === 'ADMIN' ? 'Administrator' : 'Warehouse Staff'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                Staff Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
