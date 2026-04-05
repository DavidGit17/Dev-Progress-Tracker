import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "../store";
import {
  getStoredPushToken,
  registerPushNotifications,
  schedulePushReminders,
  setupForegroundPushListener,
  stopForegroundPushListener,
} from "../utils/notifications";
import { isTaskOverdue } from "../utils/time";

export function useNotificationScheduler() {
  const tasks = useAppStore((s) => s.tasks);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const scheduledTaskSignatureRef = useRef<string>("");

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === "pending"),
    [tasks],
  );

  useEffect(() => {
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
