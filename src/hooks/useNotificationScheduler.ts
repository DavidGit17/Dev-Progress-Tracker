import { useEffect, useRef } from "react";
import { useAppStore } from "../store";
import {
  scheduleTaskReminders,
  showTaskNotification,
} from "../utils/notifications";
import { isTaskOverdue } from "../utils/time";

export function useNotificationScheduler() {
  const tasks = useAppStore((s) => s.tasks);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const scheduledTimeoutsRef = useRef<Map<string, number[]>>(new Map());

  useEffect(() => {
    scheduledTimeoutsRef.current.forEach((timeoutIds) => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
    });
    scheduledTimeoutsRef.current.clear();

    if (!notificationsEnabled) return;

    tasks.forEach((task) => {
      const timeoutIds = scheduleTaskReminders(
        task,
        (taskItem, minutesBeforeStart) => {
          showTaskNotification(
            "Upcoming Task",
            `Task ${taskItem.title} starts in ${minutesBeforeStart} minutes`,
          );
        },
      );

      if (timeoutIds.length > 0) {
        scheduledTimeoutsRef.current.set(task.id, timeoutIds);
      }
    });

    return () => {
      scheduledTimeoutsRef.current.forEach((timeoutIds) => {
        timeoutIds.forEach((id) => window.clearTimeout(id));
      });
      scheduledTimeoutsRef.current.clear();
    };
  }, [tasks, notificationsEnabled]);

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
