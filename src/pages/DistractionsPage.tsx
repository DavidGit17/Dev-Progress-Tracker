import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card, SectionHeader } from '../components/ui/Card';
import { AddDistractionModal } from '../components/AddDistractionModal';
import { formatDuration } from '../utils/time';

export function DistractionsPage() {
  const [showModal, setShowModal] = useState(false);
  const distractions = useAppStore((s) => s.distractions);
  const deleteDistraction = useAppStore((s) => s.deleteDistraction);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDistractions = distractions.filter((d) => d.date === today);
  const totalWasted = todayDistractions.reduce((s, d) => s + d.duration, 0);

  // Group by app
  const byApp = todayDistractions.reduce<Record<string, number>>((acc, d) => {
    acc[d.appName] = (acc[d.appName] ?? 0) + d.duration;
    return acc;
  }, {});

  const appEntries = Object.entries(byApp).sort((a, b) => b[1] - a[1]);
  const maxDuration = appEntries.length > 0 ? appEntries[0][1] : 1;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-brand-gray">
          Distraction Log
        </p>
        <h1 className="font-mono text-2xl text-white mt-0.5">
          {format(new Date(), 'MMM dd')}
        </h1>
      </div>

      {/* Summary card */}
      <div className="bg-brand-card border border-brand-border rounded-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={16} className="text-brand-lighter" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-brand-gray">Non-Work Time Today</span>
        </div>
        <p className="font-mono text-4xl text-white mb-1">{formatDuration(totalWasted)}</p>
        <p className="font-mono text-[10px] text-brand-gray tracking-widest">
          {todayDistractions.length} SESSIONS LOGGED
        </p>
      </div>

      <Button variant="primary" fullWidth size="lg" onClick={() => setShowModal(true)}>
        <Plus size={16} />
        Log Distraction
      </Button>

      {/* By app breakdown */}
      {appEntries.length > 0 && (
        <div>
          <SectionHeader title="By App" />
          <div className="space-y-2">
            {appEntries.map(([app, mins]) => (
              <div key={app} className="bg-brand-card border border-brand-border rounded-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{app}</span>
                  <span className="font-mono text-sm text-brand-lighter">{formatDuration(mins)}</span>
                </div>
                <div className="h-0.5 bg-brand-border rounded-full">
                  <div
                    className="h-full bg-brand-lighter rounded-full"
                    style={{ width: `${(mins / maxDuration) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual logs */}
      {todayDistractions.length > 0 && (
        <div>
          <SectionHeader title={`All Logs · ${todayDistractions.length}`} />
          <div className="space-y-2">
            {[...todayDistractions].reverse().map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between bg-brand-card border border-brand-border rounded-sm px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm font-medium">{d.appName}</p>
                  <p className="font-mono text-[10px] text-brand-gray tracking-widest mt-0.5">
                    {d.category.toUpperCase()} · {format(new Date(d.timestamp), 'HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-brand-lighter">{formatDuration(d.duration)}</span>
                  <button
                    onClick={() => deleteDistraction(d.id)}
                    className="w-7 h-7 flex items-center justify-center text-brand-muted hover:text-brand-gray transition-colors rounded-sm"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayDistractions.length === 0 && (
        <div className="text-center py-16">
          <p className="font-mono text-brand-gray text-xs tracking-widest">NO DISTRACTIONS LOGGED</p>
          <p className="text-brand-muted text-sm mt-2">Stay locked in.</p>
        </div>
      )}

      {showModal && <AddDistractionModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
