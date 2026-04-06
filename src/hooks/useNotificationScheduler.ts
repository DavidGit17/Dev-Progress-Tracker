import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "../store";
import {
  getScheduledTaskReminders,
  getStoredPushToken,
  registerPushNotifications,
  schedulePushReminders,
  showTaskNotification,
  setupForegroundPushListener,
  stopForegroundPushListener,
} from "../utils/notifications";
import { isTaskOverdue } from "../utils/time";

export function useNotificationScheduler() {
  const tasks = useAppStore((s) => s.tasks);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const scheduledTaskSignatureRef = useRef<string>("");
  const reminderTimeoutsRef = useRef<Map<string, number>>(new Map());
  const firedReminderKeysRef = useRef<Set<string>>(new Set());

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === "pending"),
    [tasks],
  );

  useEffect(() => {
    reminderTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    reminderTimeoutsRef.current.clear();

    if (!notificationsEnabled) {
      stopForegroundPushListener();
      scheduledTaskSignatureRef.current = "";
      return;
    }

    const signature = JSON.stringify(
      pendingTasks.map((task) => ({
        id: task.id,
        date: task.date,
        startTime: task.startTime,
        reminders: [...task.reminders].sort((a, b) => b - a),
      })),
    );

    if (scheduledTaskSignatureRef.current === signature) {
      return;
    }

    scheduledTaskSignatureRef.current = signature;

    let disposed = false;

    pendingTasks.forEach((task) => {
      getScheduledTaskReminders(task).forEach((reminder) => {
        if (firedReminderKeysRef.current.has(reminder.key)) {
          return;
        }

        const delay = reminder.triggerAt - Date.now();
        if (delay <= 0) {
          if (delay > -60 * 1000) {
            firedReminderKeysRef.current.add(reminder.key);
            showTaskNotification(reminder.title, reminder.body);
          }
          return;
        }

        const timeoutId = window.setTimeout(() => {
          firedReminderKeysRef.current.add(reminder.key);
          reminderTimeoutsRef.current.delete(reminder.key);
          showTaskNotification(reminder.title, reminder.body);
        }, delay);

        reminderTimeoutsRef.current.set(reminder.key, timeoutId);
      });
    });

    void (async () => {
      await setupForegroundPushListener();

      let token = getStoredPushToken();
      if (!token) {
        token = await registerPushNotifications();
      }

      if (!token || disposed) {
        return;
      }

      await Promise.all(
        pendingTasks.map((task) =>
          schedulePushReminders(task, token as string),
        ),
      );
    })();

    return () => {
      disposed = true;
      reminderTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      reminderTimeoutsRef.current.clear();
    };
  }, [notificationsEnabled, pendingTasks]);

  useEffect(() => {
    const checkOverdueTasks = () => {
      tasks.forEach((task) => {
        if (task.status !== "pending") return;
        if (isTaskOverdue(task)) {
          updateTaskStatus(task.id, "missed");
        }
      });
    };

    checkOverdueTasks();
    const interval = window.setInterval(checkOverdueTasks, 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [tasks, updateTaskStatus]);
}
