import React from 'react';
import { useAppStore } from './store';
import { TodayPage } from './pages/TodayPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DistractionsPage } from './pages/DistractionsPage';
import { BottomNav } from './components/BottomNav';
import { ActiveSessionBar } from './components/ActiveSessionBar';
import { useTimer } from './hooks/useTimer';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import type { AppView } from './types';

const pages: Record<AppView, React.ReactNode> = {
  today: <TodayPage />,
  history: <HistoryPage />,
  analytics: <AnalyticsPage />,
  distractions: <DistractionsPage />,
};

export default function App() {
  const currentView = useAppStore((s) => s.currentView);

  // Global hooks
  useTimer();
  useNotificationScheduler();

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col max-w-md mx-auto relative">
      {/* Dot grid texture */}
      <div className="fixed inset-0 dot-bg pointer-events-none opacity-40" />

      {/* Active session sticky bar */}
      <ActiveSessionBar />

      {/* Page content */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-28 relative z-10">
        {pages[currentView]}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
