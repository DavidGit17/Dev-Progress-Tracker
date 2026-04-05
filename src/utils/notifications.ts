import type { Task } from "../types";
import { getTaskStartDate } from "./time";

interface NotificationSupport {
  supported: boolean;
  reason: string;
}

export interface TaskReminderEventDetail {
  title: string;
  body: string;
  timestamp: number;
}

// Pager/on-call alert style notification sounds
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playPagerAlert() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const beepPattern = [0, 0.18, 0.36, 0.54];

    beepPattern.forEach((offset) => {
      // High-pitched urgent beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(880, now + offset);
      osc.frequency.setValueAtTime(1200, now + offset + 0.04);
      osc.frequency.setValueAtTime(880, now + offset + 0.08);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.4, now + offset + 0.005);
      gain.gain.setValueAtTime(0.4, now + offset + 0.12);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.15);

      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } catch (e) {
    console.warn("Audio alert failed:", e);
  }
}

export function playSessionStart() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    [0, 0.12, 0.24].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 600 + i * 200;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.1);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
  } catch (e) {
    console.warn("Audio start failed:", e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const support = getNotificationSupport();
  if (!support.supported) return false;

  if (Notification.permission === "granted") return true;

  if (Notification.permission === "denied") return false;

  const perm = await Notification.requestPermission();
  return perm === "granted";
}

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === "undefined") {
    return {
      supported: false,
      reason: "Notifications are unavailable in this environment.",
    };
  }

  if (!("Notification" in window)) {
    return {
      supported: false,
      reason: "This browser does not support notifications.",
    };
  }

  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "Notifications require HTTPS (or localhost).",
    };
  }

  const standaloneMode =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS && !standaloneMode) {
    return {
      supported: false,
      reason: "On iPhone, install to Home Screen to use notifications.",
    };
  }

  return {
    supported: true,
    reason: "",
  };
}

export function showTaskNotification(title: string, body: string) {
  playPagerAlert();
  if ("vibrate" in navigator) {
    navigator.vibrate?.([120, 60, 120]);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<TaskReminderEventDetail>("task-reminder", {
        detail: {
          title,
          body,
          timestamp: Date.now(),
        },
      }),
    );
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: "task-alert",
    });
  }
}

export function scheduleTaskReminders(
  task: Task,
  onReminder: (taskItem: Task, minutesBeforeStart: number) => void,
): number[] {
  if (task.status !== "pending") return [];

  const startDate = getTaskStartDate(task);
  const now = Date.now();
  const uniqueSortedReminders = [...new Set(task.reminders)]
    .filter((minutes) => Number.isFinite(minutes) && minutes > 0)
    .sort((a, b) => b - a);

  const timeoutIds: number[] = [];

  uniqueSortedReminders.forEach((minutesBeforeStart) => {
    const triggerAt = startDate.getTime() - minutesBeforeStart * 60 * 1000;
    const delay = triggerAt - now;

    if (delay <= 0) return;

    const timeoutId = window.setTimeout(() => {
      onReminder(task, minutesBeforeStart);
    }, delay);

    timeoutIds.push(timeoutId);
  });

  return timeoutIds;
}
