import { getToken, onMessage } from "firebase/messaging";
import type { MessagePayload, Unsubscribe } from "firebase/messaging";
import type { Task } from "../types";
import { getTaskStartDate } from "./time";
import { getFirebaseMessaging, isFirebaseConfigured } from "../lib/firebase";

interface NotificationSupport {
  supported: boolean;
  reason: string;
}

export interface TaskReminderEventDetail {
  title: string;
  body: string;
  timestamp: number;
}

const PUSH_TOKEN_STORAGE_KEY = "dev-rebirth-tracker:fcm-token";
const REMINDER_API_BASE_URL =
  import.meta.env.VITE_REMINDER_API_BASE_URL?.replace(/\/$/, "") ?? "";
const FCM_VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let foregroundListenerUnsubscribe: Unsubscribe | null = null;

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

export function playNotificationToggleTone(enabled: boolean) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(enabled ? 820 : 680, now);
    osc.frequency.linearRampToValueAtTime(enabled ? 980 : 520, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + 0.11);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    console.warn("Audio toggle tone failed:", e);
  }
}

function emitReminderEvent(title: string, body: string) {
  if (typeof window === "undefined") return;

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

export function getStoredPushToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
}

function savePushToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
}

export async function registerFirebaseMessagingServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
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

export async function syncPushTokenWithBackend(token: string) {
  if (!REMINDER_API_BASE_URL) return;

  try {
    await fetch(`${REMINDER_API_BASE_URL}/api/push/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.warn("Failed to sync push token:", error);
  }
}

export async function registerPushNotifications(): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  const serviceWorkerRegistration =
    await registerFirebaseMessagingServiceWorker();
  if (!serviceWorkerRegistration) {
    return null;
  }

  if (!FCM_VAPID_PUBLIC_KEY) {
    console.warn("Missing VITE_FIREBASE_VAPID_KEY, cannot request FCM token.");
    return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_PUBLIC_KEY,
      serviceWorkerRegistration,
    });

    if (!token) {
      return null;
    }

    savePushToken(token);
    await syncPushTokenWithBackend(token);

    return token;
  } catch (error) {
    console.warn("Failed to obtain FCM token:", error);
    return null;
  }
}

function normalizeMessagePayload(payload: MessagePayload) {
  const title =
    payload.notification?.title || payload.data?.title || "Task Reminder";
  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "You have an upcoming task.";

  return { title, body };
}

export async function setupForegroundPushListener() {
  if (foregroundListenerUnsubscribe) {
    return;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return;
  }

  foregroundListenerUnsubscribe = onMessage(messaging, (payload) => {
    const { title, body } = normalizeMessagePayload(payload);
    showTaskNotification(title, body);
  });
}

export function stopForegroundPushListener() {
  if (!foregroundListenerUnsubscribe) {
    return;
  }

  foregroundListenerUnsubscribe();
  foregroundListenerUnsubscribe = null;
}

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === "undefined") {
    return {
      supported: false,
      reason: "Notifications are unavailable in this environment.",
    };
  }

  if (!isFirebaseConfigured()) {
    return {
      supported: false,
      reason: "Firebase messaging is not configured.",
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

  emitReminderEvent(title, body);

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: "task-alert",
    });
  }
}

export async function schedulePushReminders(task: Task, token: string) {
  if (!REMINDER_API_BASE_URL || task.status !== "pending") {
    return;
  }

  const startDate = getTaskStartDate(task);
  const reminders = [...new Set(task.reminders)]
    .filter((minutes) => Number.isFinite(minutes) && minutes > 0)
    .sort((a, b) => b - a)
    .map((minutesBeforeStart) => {
      const triggerAt =
        startDate.getTime() - Number(minutesBeforeStart) * 60 * 1000;
      return {
        minutesBeforeStart: Number(minutesBeforeStart),
        triggerAt: new Date(triggerAt).toISOString(),
      };
    })
    .filter((reminder) => new Date(reminder.triggerAt).getTime() > Date.now());

  if (reminders.length === 0) {
    return;
  }

  try {
    await fetch(`${REMINDER_API_BASE_URL}/api/reminders/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        taskId: task.id,
        title: task.title,
        date: task.date,
        startTime: task.startTime,
        reminders,
      }),
    });
  } catch (error) {
    console.warn("Failed to schedule push reminder:", error);
  }
}
