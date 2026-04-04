import React from "react";
import type { TaskCategory } from "../../types";

const categoryStyles: Record<TaskCategory, string> = {
  Routine: "border-brand-light text-brand-lighter",
  Learning: "border-white text-white",
  Work: "border-brand-lighter text-brand-white",
  "Interview Prep": "border-brand-gray text-brand-gray",
};

export function CategoryBadge({ category }: { category: TaskCategory }) {
  return (
    <span
      className={`font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border rounded-sm ${categoryStyles[category]}`}
    >
      {category}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-brand-muted",
    active: "bg-white animate-pulse-fast",
    done: "bg-white",
    missed: "bg-brand-gray",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[status] ?? "bg-brand-muted"}`}
    />
  );
}
