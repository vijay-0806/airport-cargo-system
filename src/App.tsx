import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { CargoPage } from './pages/CargoPage.tsx';
import { ShipmentsPage } from './pages/ShipmentsPage.tsx';
import { WarehousesPage } from './pages/WarehousesPage.tsx';
import { TrackingPage } from './pages/TrackingPage.tsx';
import { UsersPage } from './pages/UsersPage.tsx';
import { DocsPage } from './pages/DocsPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { api } from './services/api.ts';
import { User } from './types/index.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeTrackingCode, setActiveTrackingCode] = useState<string>('CG-10025');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check auth session on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = api.getToken();
        if (token) {
          const res = await api.getMe();
          setCurrentUser(res.user);
        } else {
          // Auto-login with default demo Admin user for effortless live preview
          const res = await api.login('admin@airportcargo.com', 'Admin123!');
          setCurrentUser(res.user);
        }
      } catch (e) {
        console.warn('Initial session check, continuing as guest:', e);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleNavigate = (view: string, param?: string) => {
    if (param && view === 'tracking') {
      setActiveTrackingCode(param);
    }
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickTrack = (code: string) => {
    setActiveTrackingCode(code);
    setCurrentView('tracking');
    setMobileMenuOpen(false);
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset the airport database to default demo records?')) return;
    setIsResetting(true);
    try {
      await api.resetSeedData();
      // Reload current view
      const view = currentView;
      setCurrentView('dashboard');
      setTimeout(() => setCurrentView(view), 50);
    } catch (e: any) {
      alert('Error resetting database: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING AIRPORT CARGO OPERATING SYSTEM...</span>
        </div>
      </div>
    );
  }

  // If on login view
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setCurrentView('dashboard');
        }}
        onNavigateTracking={() => {
          setActiveTrackingCode('CG-10025');
          setCurrentView('tracking');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800 font-sans">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onQuickTrack={handleQuickTrack}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            user={currentUser}
            onResetSeed={handleResetSeed}
            isResetting={isResetting}
          />
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-50 w-64 h-full bg-slate-900">
              <Sidebar
                currentView={currentView}
                onNavigate={handleNavigate}
                user={currentUser}
                onResetSeed={handleResetSeed}
                isResetting={isResetting}
              />
            </div>
          </div>
        )}

        {/* Main Operational View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}

          {currentView === 'cargo' && (
            <CargoPage
              user={currentUser}
              onNavigateTracking={handleQuickTrack}
            />
          )}

          {currentView === 'shipments' && (
            <ShipmentsPage
              user={currentUser}
              onNavigateTracking={handleQuickTrack}
            />
          )}

          {currentView === 'warehouses' && (
            <WarehousesPage
              user={currentUser}
              onNavigateTracking={handleQuickTrack}
            />
          )}

          {currentView === 'tracking' && (
            <TrackingPage initialCargoCode={activeTrackingCode} />
          )}

          {currentView === 'users' && (
            <UsersPage
              currentUser={currentUser}
              onResetSeed={handleResetSeed}
              isResetting={isResetting}
            />
          )}

          {currentView === 'docs' && <DocsPage />}
        </main>
      </div>
    </div>
  );
}
