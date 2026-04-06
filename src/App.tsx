import React, { useEffect, useState } from "react";
import { useAppStore } from "./store";
import { TodayPage } from "./pages/TodayPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DistractionsPage } from "./pages/DistractionsPage";
import { BottomNav } from "./components/BottomNav";
import { ActiveSessionBar } from "./components/ActiveSessionBar";
import { useTimer } from "./hooks/useTimer";
import { useNotificationScheduler } from "./hooks/useNotificationScheduler";
import {
  stopActiveReminderAlert,
  type TaskReminderEventDetail,
} from "./utils/notifications";
import type { AppView } from "./types";

const pages: Record<AppView, React.ReactNode> = {
  today: <TodayPage />,
  history: <HistoryPage />,
  analytics: <AnalyticsPage />,
  distractions: <DistractionsPage />,
};

export default function App() {
  const currentView = useAppStore((s) => s.currentView);
  const [reminderBanner, setReminderBanner] =
    useState<TaskReminderEventDetail | null>(null);

  // Global hooks
  useTimer();
  useNotificationScheduler();

  useEffect(() => {
    const handleReminder = (event: Event) => {
      const customEvent = event as CustomEvent<TaskReminderEventDetail>;
      setReminderBanner(customEvent.detail);
    };

    window.addEventListener("task-reminder", handleReminder as EventListener);

    return () => {
      window.removeEventListener(
        "task-reminder",
        handleReminder as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "dev-rebirth-tracker") return;
      void useAppStore.persist.rehydrate();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopActiveReminderAlert();
    };
  }, []);

  const handleStopReminder = () => {
    stopActiveReminderAlert();
    setReminderBanner(null);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col max-w-md mx-auto relative">
      {/* Dot grid texture */}
      <div className="fixed inset-0 dot-bg pointer-events-none opacity-40" />

      {/* Active session sticky bar */}
      <ActiveSessionBar />

      {reminderBanner && (
        <div className="fixed top-2 left-2 right-2 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[calc(100%-1rem)] sm:max-w-md">
          <div className="bg-brand-card border border-white rounded-sm p-3 shadow-lg">
            <p className="font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-1">
              Reminder
            </p>
            <p className="text-sm text-white font-medium">
              {reminderBanner.title}
            </p>
            <p className="text-xs text-brand-light mt-1">
              {reminderBanner.body}
            </p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleStopReminder}
                className="rounded-sm border border-white bg-white px-3 py-2 text-xs font-mono uppercase tracking-wide text-black transition-colors hover:bg-brand-white"
              >
                Stop Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-28 relative z-10">
        {pages[currentView]}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
