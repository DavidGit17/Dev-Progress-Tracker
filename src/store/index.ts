import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format } from "date-fns";
import type {
  Task,
  DistractionLog,
  ActiveSession,
  AppView,
  TaskStatus,
} from "../types";

interface AppState {
  // Navigation
  currentView: AppView;
  setView: (view: AppView) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "actualDuration" | "status">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  missTask: (id: string) => void;

  // Session
  activeSession: ActiveSession | null;
  startSession: (taskId: string) => void;
  stopSession: (taskId: string) => void;
  tickSession: () => void;

  // Distractions
  distractions: DistractionLog[];
  addDistraction: (
    d: Omit<DistractionLog, "id" | "timestamp" | "date">,
  ) => void;
  deleteDistraction: (id: string) => void;

  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;

  // Helpers
  getTodayTasks: () => Task[];
  getTasksByDate: (date: string) => Task[];
  getDistractionsByDate: (date: string) => DistractionLog[];
  getDayStats: (date: string) => {
    productive: number;
    wasted: number;
    completed: number;
    missed: number;
    total: number;
  };
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: "today",
      setView: (view) => set({ currentView: view }),

      tasks: [],

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: generateId(),
          actualDuration: 0,
          status: "pending",
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      updateTaskStatus: (taskId, status) => {
        set((s) => ({
          tasks: s.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status,
                }
              : task,
          ),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      completeTask: (id) => {
        const session = get().activeSession;
        if (session?.taskId === id) {
          get().stopSession(id);
          return;
        }
        get().updateTaskStatus(id, "done");
      },

      missTask: (id) => {
        const session = get().activeSession;
        if (session?.taskId === id) {
          set({ activeSession: null });
        }
        get().updateTaskStatus(id, "missed");
      },

      activeSession: null,

      startSession: (taskId) => {
        set({
          activeSession: {
            taskId,
            startedAt: Date.now(),
            elapsed: 0,
          },
        });
        get().updateTask(taskId, {
          status: "active",
          sessionStartedAt: Date.now(),
        });
      },

      stopSession: (taskId) => {
        const session = get().activeSession;
        if (!session || session.taskId !== taskId) return;
        const elapsed = Math.floor((Date.now() - session.startedAt) / 60000);
        get().updateTask(taskId, {
          actualDuration:
            (get().tasks.find((t) => t.id === taskId)?.actualDuration ?? 0) +
            elapsed,
          status: "done",
        });
        set({ activeSession: null });
      },

      tickSession: () => {
        const session = get().activeSession;
        if (!session) return;
        set({
          activeSession: {
            ...session,
            elapsed: Math.floor((Date.now() - session.startedAt) / 1000),
          },
        });
      },

      distractions: [],

      addDistraction: (d) => {
        const distraction: DistractionLog = {
          ...d,
          id: generateId(),
          timestamp: Date.now(),
          date: format(new Date(), "yyyy-MM-dd"),
        };
        set((s) => ({ distractions: [...s.distractions, distraction] }));
      },

      deleteDistraction: (id) => {
        set((s) => ({
          distractions: s.distractions.filter((d) => d.id !== id),
        }));
      },

      notificationsEnabled: false,
      setNotificationsEnabled: (val) => set({ notificationsEnabled: val }),

      getTodayTasks: () => {
        const today = format(new Date(), "yyyy-MM-dd");
        return get().tasks.filter((t) => t.date === today);
      },

      getTasksByDate: (date) => {
        return get().tasks.filter((t) => t.date === date);
      },

      getDistractionsByDate: (date) => {
        return get().distractions.filter((d) => d.date === date);
      },

      getDayStats: (date) => {
        const tasks = get().getTasksByDate(date);
        const distractions = get().getDistractionsByDate(date);
        const completed = tasks.filter((t) => t.status === "done");
        const missed = tasks.filter((t) => t.status === "missed");
        const productive = completed.reduce(
          (sum, t) => sum + (t.actualDuration || t.plannedDuration),
          0,
        );
        const wasted = distractions.reduce((sum, d) => sum + d.duration, 0);
        return {
          productive,
          wasted,
          completed: completed.length,
          missed: missed.length,
          total: tasks.length,
        };
      },
    }),
    {
      name: "dev-rebirth-tracker",
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState || !Array.isArray(persistedState.tasks)) {
          return persistedState;
        }

        return {
          ...persistedState,
          tasks: persistedState.tasks.map((task: any) => ({
            ...task,
            status: task.status === "completed" ? "done" : task.status,
            reminders: Array.isArray(task.reminders)
              ? task.reminders
                  .filter(
                    (value: unknown) =>
                      Number.isFinite(value) && Number(value) > 0,
                  )
                  .map(Number)
              : [15],
          })),
        };
      },
    },
  ),
);
