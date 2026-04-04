import React from 'react';
import { Square } from 'lucide-react';
import { useAppStore } from '../store';
import { formatSeconds } from '../utils/time';

export function ActiveSessionBar() {
  const activeSession = useAppStore((s) => s.activeSession);
  const tasks = useAppStore((s) => s.tasks);
  const stopSession = useAppStore((s) => s.stopSession);
  const setView = useAppStore((s) => s.setView);

  if (!activeSession) return null;

  const task = tasks.find((t) => t.id === activeSession.taskId);
  if (!task) return null;

  return (
    <div className="sticky top-0 z-30 bg-white text-black px-4 py-2.5 flex items-center justify-between shadow-lg">
      <button
        className="flex items-center gap-2 flex-1 min-w-0"
        onClick={() => setView('today')}
      >
        {/* Animated recording dot */}
        <span className="w-2 h-2 bg-black rounded-full animate-pulse flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">{task.title}</p>
          <p className="font-mono text-[9px] tracking-widest text-black/60 uppercase">{task.category}</p>
        </div>
      </button>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-mono text-base font-bold tabular-nums">
          {formatSeconds(activeSession.elapsed)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            stopSession(activeSession.taskId);
          }}
          className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-sm hover:bg-black/80 transition-colors"
        >
          <Square size={14} fill="white" />
        </button>
      </div>
    </div>
  );
}
