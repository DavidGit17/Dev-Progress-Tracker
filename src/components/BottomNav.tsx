import React from 'react';
import { CalendarDays, History, BarChart2, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import type { AppView } from '../types';

const NAV_ITEMS: { view: AppView; icon: React.ReactNode; label: string }[] = [
  { view: 'today', icon: <CalendarDays size={20} />, label: 'Today' },
  { view: 'history', icon: <History size={20} />, label: 'History' },
  { view: 'analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
  { view: 'distractions', icon: <Zap size={20} />, label: 'Focus' },
];

export function BottomNav() {
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);
  const activeSession = useAppStore((s) => s.activeSession);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 max-w-md mx-auto">
      {/* glass border top */}
      <div className="h-px bg-brand-border" />
      <div className="bg-brand-dark/95 backdrop-blur-md">
        <div className="flex items-stretch">
          {NAV_ITEMS.map(({ view, icon, label }) => {
            const isActive = currentView === view;
            return (
              <button
                key={view}
                onClick={() => setView(view)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${
                  isActive ? 'text-white' : 'text-brand-gray hover:text-brand-light'
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
                )}
                {/* Session pulse on Today tab */}
                {view === 'today' && activeSession && !isActive && (
                  <span className="absolute top-1.5 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
                <span className={isActive ? 'text-white' : ''}>{icon}</span>
                <span className="font-mono text-[9px] tracking-widest uppercase">{label}</span>
              </button>
            );
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-bottom pb-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
}
