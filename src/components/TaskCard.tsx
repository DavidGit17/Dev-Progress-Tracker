import React, { useState } from "react";
import {
  Play,
  Square,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
} from "lucide-react";
import { useAppStore } from "../store";
import { CategoryBadge, StatusDot } from "./ui/Badge";
import { Button } from "./ui/Button";
import { formatDuration, formatSeconds } from "../utils/time";
import { playSessionStart } from "../utils/notifications";
import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const activeSession = useAppStore((s) => s.activeSession);
  const startSession = useAppStore((s) => s.startSession);
  const stopSession = useAppStore((s) => s.stopSession);
  const completeTask = useAppStore((s) => s.completeTask);
  const missTask = useAppStore((s) => s.missTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const [showActions, setShowActions] = useState(false);

  const isActive = activeSession?.taskId === task.id;
  const elapsed = isActive ? activeSession.elapsed : 0;
  const planned = task.plannedDuration;
  const progress = isActive ? Math.min((elapsed / 60 / planned) * 100, 100) : 0;

  const handleStart = () => {
    playSessionStart();
    startSession(task.id);
  };

  const handleStop = () => {
    stopSession(task.id);
  };

  const statusLabel: Record<string, string> = {
    pending: "· PENDING",
    active: "▶ ACTIVE",
    done: "✓ DONE",
    missed: "✗ MISSED",
  };

  const isDone = task.status === "done";
  const isMissed = task.status === "missed";

  return (
    <div
      className={`bg-brand-card border rounded-sm overflow-hidden transition-all duration-300 ${
        isActive
          ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.08)]"
          : "border-brand-border"
      } ${isDone ? "opacity-80" : ""} ${isMissed ? "opacity-60 bg-[#141010] border-[#3a2b2b]" : ""}`}
    >
      {/* Progress bar for active session */}
      {isActive && (
        <div className="h-0.5 bg-brand-border">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 min-w-0">
            <StatusDot status={task.status} />
            <div className="min-w-0">
              <p
                className={`text-white font-medium text-sm leading-tight truncate transition-all duration-300 ${isDone ? "line-through opacity-70" : ""}`}
              >
                {task.title}
              </p>
              <span className="font-mono text-[10px] text-brand-gray tracking-widest mt-1 block">
                {statusLabel[task.status]}
              </span>
            </div>
          </div>
          <CategoryBadge category={task.category} />
        </div>

        {/* Time info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-brand-light text-xs font-mono">
            <Clock size={11} />
            <span>
              {task.startTime} – {task.endTime}
            </span>
          </div>
          <span className="text-brand-border">·</span>
          <span className="text-brand-gray text-xs font-mono">
            {formatDuration(planned)} planned
          </span>
          {task.actualDuration > 0 && (
            <>
              <span className="text-brand-border">·</span>
              <span className="text-brand-lighter text-xs font-mono">
                {formatDuration(task.actualDuration)} actual
              </span>
            </>
          )}
        </div>

        {/* Active session display */}
        {isActive && (
          <div className="mb-4 p-3 bg-black border border-brand-border rounded-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-brand-gray tracking-widest">
                SESSION ELAPSED
              </span>
              <span className="font-mono text-xl text-white tabular-nums">
                {formatSeconds(elapsed)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono text-brand-gray">
              <span>TARGET: {formatDuration(planned)}</span>
              <span
                className={
                  elapsed / 60 > planned
                    ? "text-brand-lighter"
                    : "text-brand-gray"
                }
              >
                {elapsed / 60 > planned
                  ? `+${formatDuration(Math.floor(elapsed / 60 - planned))} OVER`
                  : `${formatDuration(Math.floor(planned - elapsed / 60))} LEFT`}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {task.status === "pending" && !isActive && (
            <Button
              variant="primary"
              size="md"
              onClick={handleStart}
              className="flex-1"
            >
              <Play size={14} />
              Start Session
            </Button>
          )}
          {isActive && (
            <Button
              variant="danger"
              size="md"
              onClick={handleStop}
              className="flex-1"
            >
              <Square size={14} />
              Stop & Complete
            </Button>
          )}
          {task.status === "pending" && !isActive && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowActions(!showActions)}
            >
              ···
            </Button>
          )}
          {task.status === "active" && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => completeTask(task.id)}
            >
              <CheckCircle size={14} />
            </Button>
          )}
          {(isDone || isMissed) && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => deleteTask(task.id)}
              className="flex-1"
            >
              <Trash2 size={14} />
              Delete Task
            </Button>
          )}
        </div>

        {/* Extended actions */}
        {showActions && task.status === "pending" && (
          <div className="mt-2 flex items-center gap-2 pt-2 border-t border-brand-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => completeTask(task.id)}
              className="flex-1"
            >
              <CheckCircle size={12} />
              Mark Done
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => missTask(task.id)}
              className="flex-1"
            >
              <XCircle size={12} />
              Miss
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
