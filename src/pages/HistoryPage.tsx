import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { SectionHeader } from '../components/ui/Card';
import { CategoryBadge, StatusDot } from '../components/ui/Badge';
import { formatDuration } from '../utils/time';

const DAYS_TO_SHOW = 14;

export function HistoryPage() {
  const getTasksByDate = useAppStore((s) => s.getTasksByDate);
  const getDistractionsByDate = useAppStore((s) => s.getDistractionsByDate);
  const getDayStats = useAppStore((s) => s.getDayStats);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) =>
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  );

  // Only show dates that have data
  const datesWithData = dates.filter((d) => {
    const tasks = getTasksByDate(d);
    const dist = getDistractionsByDate(d);
    return tasks.length > 0 || dist.length > 0;
  });

  if (datesWithData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-brand-gray">History</p>
          <h1 className="font-mono text-2xl text-white mt-0.5">Past Days</h1>
        </div>
        <div className="text-center py-16">
          <p className="font-mono text-brand-gray text-xs tracking-widest">NO HISTORY YET</p>
          <p className="text-brand-muted text-sm mt-2">Complete tasks to build your record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-brand-gray">History</p>
        <h1 className="font-mono text-2xl text-white mt-0.5">Past Days</h1>
      </div>

      <div className="space-y-3">
        {datesWithData.map((date) => {
          const tasks = getTasksByDate(date);
          const stats = getDayStats(date);
          const distractions = getDistractionsByDate(date);
          const isExpanded = expandedDate === date;
          const isToday = date === format(new Date(), 'yyyy-MM-dd');

          return (
            <div key={date} className="bg-brand-card border border-brand-border rounded-sm overflow-hidden">
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-brand-muted/20 transition-colors"
                onClick={() => setExpandedDate(isExpanded ? null : date)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-mono text-sm text-white">
                      {isToday ? 'Today' : format(new Date(date + 'T00:00:00'), 'EEE, MMM d')}
                    </p>
                    <p className="font-mono text-[10px] text-brand-gray tracking-widest mt-0.5">
                      {stats.completed}/{stats.total} TASKS
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-xs text-white">{formatDuration(stats.productive)}</p>
                    {stats.wasted > 0 && (
                      <p className="font-mono text-[10px] text-brand-gray">{formatDuration(stats.wasted)} wasted</p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-brand-gray flex-shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-brand-gray flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-brand-border p-4 space-y-4">
                  {/* Productive vs wasted */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black border border-brand-border rounded-sm p-3 text-center">
                      <p className="font-mono text-lg text-white">{formatDuration(stats.productive)}</p>
                      <p className="font-mono text-[9px] tracking-widest text-brand-gray mt-1">PRODUCTIVE</p>
                    </div>
                    <div className="bg-black border border-brand-border rounded-sm p-3 text-center">
                      <p className="font-mono text-lg text-brand-lighter">{formatDuration(stats.wasted)}</p>
                      <p className="font-mono text-[9px] tracking-widest text-brand-gray mt-1">WASTED</p>
                    </div>
                  </div>

                  {/* Task list */}
                  {tasks.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">Tasks</p>
                      <div className="space-y-2">
                        {tasks
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between py-2 border-b border-brand-border last:border-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <StatusDot status={t.status} />
                                <span className="text-sm text-brand-lighter truncate">{t.title}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <CategoryBadge category={t.category} />
                                <span className="font-mono text-xs text-brand-gray">
                                  {formatDuration(t.actualDuration || t.plannedDuration)}
                                </span>
                                {(t.status === 'done' || t.status === 'missed') && (
                                  <button
                                    type="button"
                                    onClick={() => deleteTask(t.id)}
                                    className="flex items-center gap-1 rounded-sm border border-brand-border px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-brand-gray transition-colors hover:border-white hover:text-white"
                                    aria-label={`Delete task ${t.title}`}
                                  >
                                    <Trash2 size={12} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Distractions */}
                  {distractions.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
                        Distractions
                      </p>
                      <div className="space-y-1">
                        {distractions.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between text-xs font-mono text-brand-gray"
                          >
                            <span>{d.appName}</span>
                            <span>{formatDuration(d.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
