import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Bell, BellOff } from "lucide-react";
import { useAppStore } from "../store";
import { TaskCard } from "../components/TaskCard";
import { AddTaskModal } from "../components/AddTaskModal";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/ui/Card";
import { formatDuration } from "../utils/time";
import {
  requestNotificationPermission,
  getNotificationSupport,
  playNotificationToggleTone,
} from "../utils/notifications";

export function TodayPage() {
  const [showAddTask, setShowAddTask] = useState(false);
  const notificationSupport = getNotificationSupport();
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined") return "default";
    return "Notification" in window ? Notification.permission : "unsupported";
  });
  const tasks = useAppStore((s) => s.tasks);
  const distractions = useAppStore((s) => s.distractions);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayTasks = tasks.filter((t) => t.date === today);
  const todayDistractions = distractions.filter((d) => d.date === today);

  const pending = todayTasks.filter((t) => t.status === "pending");
  const active = todayTasks.filter((t) => t.status === "active");
  const completed = todayTasks.filter((t) => t.status === "done");
  const missed = todayTasks.filter((t) => t.status === "missed");
  const stats = {
    productive: completed.reduce(
      (sum, t) => sum + (t.actualDuration || t.plannedDuration),
      0,
    ),
    wasted: todayDistractions.reduce((sum, d) => sum + d.duration, 0),
  };

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, [notificationsEnabled]);

  const handleToggleNotifications = async () => {
    const nextEnabled = !notificationsEnabled;
    playNotificationToggleTone(nextEnabled);

    if (!notificationsEnabled) {
      await requestNotificationPermission();
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
      setNotificationsEnabled(true);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const completionRate =
    todayTasks.length > 0
      ? Math.round((completed.length / todayTasks.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-brand-gray">
            {format(new Date(), "EEEE")}
          </p>
          <h1 className="font-mono text-2xl text-white mt-0.5">
            {format(new Date(), "MMM dd, yyyy")}
          </h1>
        </div>
        <button
          onClick={handleToggleNotifications}
          className={`w-10 h-10 flex items-center justify-center rounded-sm border transition-colors ${
            notificationsEnabled
              ? "border-white text-white bg-brand-card"
              : "border-brand-border text-brand-gray hover:border-brand-muted"
          }`}
        >
          {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
      </div>

      {notificationPermission === "denied" && (
        <p className="-mt-3 text-[10px] font-mono tracking-wide text-brand-gray">
          Notifications blocked in browser settings.
        </p>
      )}

      {notificationPermission === "unsupported" && (
        <p className="-mt-3 text-[10px] font-mono tracking-wide text-brand-gray">
          {notificationSupport.reason}
        </p>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: todayTasks.length, color: "text-white" },
          { label: "Done", value: completed.length, color: "text-white" },
          {
            label: "Active",
            value: active.length,
            color: active.length > 0 ? "text-white" : "text-brand-gray",
          },
          {
            label: "Missed",
            value: missed.length,
            color: missed.length > 0 ? "text-brand-lighter" : "text-brand-gray",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-brand-card border border-brand-border rounded-sm p-3 text-center"
          >
            <p className={`font-mono text-2xl font-bold ${s.color}`}>
              {s.value}
            </p>
            <p className="font-mono text-[9px] tracking-widest uppercase text-brand-gray mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {todayTasks.length > 0 && (
        <div className="bg-brand-card border border-brand-border rounded-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-brand-gray">
              Day Progress
            </span>
            <span className="font-mono text-sm text-white">
              {completionRate}%
            </span>
          </div>
          <div className="h-1 bg-brand-border rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs font-mono text-brand-gray">
            <span>{formatDuration(stats.productive)} productive</span>
            {stats.wasted > 0 && (
              <span>{formatDuration(stats.wasted)} wasted</span>
            )}
          </div>
        </div>
      )}

      {/* Add task button */}
      <Button
        variant="primary"
        fullWidth
        size="lg"
        onClick={() => setShowAddTask(true)}
      >
        <Plus size={16} />
        Add Task
      </Button>

      {/* Tasks */}
      {todayTasks.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-brand-gray text-xs tracking-widest">
            NO TASKS PLANNED
          </p>
          <p className="text-brand-muted text-sm mt-2">
            Start by adding a task above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active first */}
          {active.length > 0 && (
            <div>
              <SectionHeader title="Active" />
              <div className="space-y-3">
                {active.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming/Pending */}
          {pending.length > 0 && (
            <div>
              <SectionHeader title={`Upcoming · ${pending.length}`} />
              <div className="space-y-3">
                {pending
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <SectionHeader title={`Completed · ${completed.length}`} />
              <div className="space-y-3">
                {completed.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          )}

          {/* Missed */}
          {missed.length > 0 && (
            <div>
              <SectionHeader title={`Missed · ${missed.length}`} />
              <div className="space-y-3">
                {missed.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} />}
    </div>
  );
}
