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

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const addTask = useAppStore((s) => s.addTask);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    const planned = calcPlannedDuration(startTime, endTime);
    if (planned <= 0) {
      setError("End time must be after start time.");
      return;
    }
    addTask({
      title: title.trim(),
      category,
      startTime,
      endTime,
      plannedDuration: planned,
      date,
      reminders,
    });
    onClose();
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
            Duration: {calcPlannedDuration(startTime, endTime)} minutes
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
          <Button type="submit" fullWidth size="lg">
            ADD TASK
          </Button>
        </div>
      </form>
    </Modal>
  );
}
