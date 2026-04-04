export type TaskCategory = "Routine" | "Learning" | "Work" | "Interview Prep";

export type TaskStatus = "pending" | "active" | "done" | "missed";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  plannedDuration: number; // minutes
  actualDuration: number; // minutes
  status: TaskStatus;
  reminders: number[]; // minutes before start
  sessionStartedAt?: number; // timestamp
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface DistractionLog {
  id: string;
  appName: string;
  duration: number; // minutes
  timestamp: number;
  date: string; // YYYY-MM-DD
  category: "Social Media" | "Entertainment" | "News" | "Gaming" | "Other";
}

export interface DayStats {
  date: string;
  productiveMinutes: number;
  wastedMinutes: number;
  completedTasks: number;
  missedTasks: number;
  totalTasks: number;
}

export type AppView = "today" | "history" | "analytics" | "distractions";

export interface ActiveSession {
  taskId: string;
  startedAt: number;
  elapsed: number; // seconds
}
