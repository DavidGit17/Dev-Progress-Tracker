import React, { useState } from "react";
import { format } from "date-fns";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { useAppStore } from "../store";
import { calcPlannedDuration } from "../utils/time";
import type { TaskCategory } from "../types";

interface AddTaskModalProps {
  onClose: () => void;
}

const CATEGORIES: TaskCategory[] = [
  "Routine",
  "Learning",
  "Work",
  "Interview Prep",
];
const PRESET_REMINDERS = [5, 10, 15, 30];

function normalizeTimeInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (twelveHourMatch) {
    const rawHours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toUpperCase();

    if (rawHours >= 1 && rawHours <= 12 && minutes >= 0 && minutes <= 59) {
      let hours = rawHours % 12;
      if (period === "PM") {
        hours += 12;
      }
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  return null;
}

function normalizeDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!slashMatch) {
    return null;
  }

  const first = Number(slashMatch[1]);
  const second = Number(slashMatch[2]);
  const year = Number(slashMatch[3]);

  const candidateOrders: Array<{ day: number; month: number }> = [
    { day: first, month: second },
    { day: second, month: first },
  ];

  for (const candidate of candidateOrders) {
    const { day, month } = candidate;
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;

    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const addTask = useAppStore((s) => s.addTask);
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  const now = new Date();
  const defaultStart = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const endH = (now.getHours() + 1) % 24;
  const defaultEnd = `${String(endH).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Work");
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reminders, setReminders] = useState<number[]>([15, 5]);
  const [customReminder, setCustomReminder] = useState("");
  const [error, setError] = useState("");

  const normalizedStartTime = normalizeTimeInput(startTime);
  const normalizedEndTime = normalizeTimeInput(endTime);
  const normalizedDate = normalizeDateInput(date);
  const plannedPreview =
    normalizedStartTime && normalizedEndTime
      ? calcPlannedDuration(normalizedStartTime, normalizedEndTime)
      : null;

  const toggleReminder = (value: number) => {
    setReminders((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value].sort((a, b) => b - a);
    });
  };

  const addCustomReminder = () => {
    const parsed = Number(customReminder);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Custom reminder must be a positive number of minutes.");
      return;
    }
    toggleReminder(Math.floor(parsed));
    setCustomReminder("");
    setError("");
  };

  const submitTask = (formValues?: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!hasHydrated) {
      setError("Please wait a moment and try again.");
      return;
    }

    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }

    const submittedTitle = formValues?.title ?? title;
    const submittedDate = formValues?.date ?? date;
    const submittedStartTime = formValues?.startTime ?? startTime;
    const submittedEndTime = formValues?.endTime ?? endTime;

    const normalizedSubmittedDate = normalizeDateInput(submittedDate);
    const normalizedSubmittedStartTime = normalizeTimeInput(submittedStartTime);
    const normalizedSubmittedEndTime = normalizeTimeInput(submittedEndTime);

    if (!submittedTitle.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!submittedDate || !submittedStartTime || !submittedEndTime) {
      setError("Date, start time, and end time are required.");
      return;
    }

    if (!normalizedSubmittedDate) {
      setError("Enter date as YYYY-MM-DD or DD/MM/YYYY.");
      return;
    }

    if (!normalizedSubmittedStartTime || !normalizedSubmittedEndTime) {
      setError("Enter time as HH:MM or HH:MM AM/PM.");
      return;
    }

    const planned = calcPlannedDuration(
      normalizedSubmittedStartTime,
      normalizedSubmittedEndTime,
    );
    if (!Number.isFinite(planned) || planned <= 0) {
      setError("End time must be after start time.");
      return;
    }

    setError("");

    addTask({
      title: submittedTitle.trim(),
      category,
      startTime: normalizedSubmittedStartTime,
      endTime: normalizedSubmittedEndTime,
      plannedDuration: planned,
      date: normalizedSubmittedDate,
      reminders: [...new Set(reminders)]
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => b - a),
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    submitTask({
      title: String(formData.get("title") ?? ""),
      date: String(formData.get("date") ?? ""),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
    });
  };

  return (
    <Modal title="New Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
            Task Title
          </label>
          <input
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. LeetCode — Dynamic Programming"
            className="w-full bg-black border border-brand-border rounded-sm px-3 py-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-light font-sans"
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2.5 px-3 text-xs font-mono tracking-wider border rounded-sm transition-colors ${
                  category === cat
                    ? "bg-white text-black border-white"
                    : "bg-black text-brand-light border-brand-border hover:border-brand-muted"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
            Date
          </label>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black border border-brand-border rounded-sm px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-light font-mono"
          />
        </div>

        {/* Time range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
              Start Time
            </label>
            <input
              name="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-black border border-brand-border rounded-sm px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-light font-mono"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
              End Time
            </label>
            <input
              name="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-black border border-brand-border rounded-sm px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-light font-mono"
            />
          </div>
        </div>

        {/* Duration preview */}
        {startTime && endTime && (
          <div className="text-brand-gray text-xs font-mono text-center">
            Duration:{" "}
            {plannedPreview && plannedPreview > 0
              ? `${plannedPreview} minutes`
              : "invalid time range"}
          </div>
        )}

        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
            Reminders (minutes before start)
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESET_REMINDERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleReminder(value)}
                className={`py-2 px-2 text-xs font-mono border rounded-sm transition-colors ${
                  reminders.includes(value)
                    ? "bg-white text-black border-white"
                    : "bg-black text-brand-light border-brand-border hover:border-brand-muted"
                }`}
              >
                {value}m
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={customReminder}
              onChange={(e) => setCustomReminder(e.target.value)}
              placeholder="Custom"
              className="flex-1 bg-black border border-brand-border rounded-sm px-3 py-2.5 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-light font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCustomReminder}
            >
              Add
            </Button>
          </div>

          <p className="text-brand-gray text-[10px] font-mono mt-2">
            Selected:{" "}
            {reminders.length > 0
              ? `${[...new Set(reminders)].sort((a, b) => b - a).join(", ")} min`
              : "No reminders"}
          </p>
        </div>

        {error && (
          <p className="text-brand-lighter text-xs font-mono text-center border border-brand-border py-2 rounded-sm">
            ⚠ {error}
          </p>
        )}

        <div className="sticky bottom-0 z-10 bg-brand-dark pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          <Button type="submit" fullWidth size="lg" disabled={!hasHydrated}>
            ADD TASK
          </Button>
        </div>
      </form>
    </Modal>
  );
}
