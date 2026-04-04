import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAppStore } from '../store';
import type { DistractionLog } from '../types';

interface Props {
  onClose: () => void;
}

const CATEGORIES: DistractionLog['category'][] = [
  'Social Media',
  'Entertainment',
  'News',
  'Gaming',
  'Other',
];

const QUICK_APPS = ['YouTube', 'Instagram', 'Twitter/X', 'Reddit', 'TikTok', 'Netflix', 'Discord'];

export function AddDistractionModal({ onClose }: Props) {
  const addDistraction = useAppStore((s) => s.addDistraction);
  const [appName, setAppName] = useState('');
  const [duration, setDuration] = useState('15');
  const [category, setCategory] = useState<DistractionLog['category']>('Entertainment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !Number(duration)) return;
    addDistraction({
      appName: appName.trim(),
      duration: Number(duration),
      category,
    });
    onClose();
  };

  return (
    <Modal title="Log Distraction" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quick select */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
            Quick Select App
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_APPS.map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => setAppName(app)}
                className={`px-3 py-1.5 text-xs font-mono border rounded-sm transition-colors ${
                  appName === app
                    ? 'bg-white text-black border-white'
                    : 'border-brand-border text-brand-light hover:border-brand-muted'
                }`}
              >
                {app}
              </button>
            ))}
          </div>
        </div>

        {/* App name */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
            App / Site Name
          </label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g. YouTube"
            className="w-full bg-black border border-brand-border rounded-sm px-3 py-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-light font-sans"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-brand-gray mb-2">
            Duration (minutes)
          </label>
          <div className="flex gap-2 mb-2">
            {[5, 10, 15, 30, 60].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(String(d))}
                className={`flex-1 py-2 text-xs font-mono border rounded-sm transition-colors ${
                  duration === String(d)
                    ? 'bg-white text-black border-white'
                    : 'border-brand-border text-brand-light hover:border-brand-muted'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="480"
            className="w-full bg-black border border-brand-border rounded-sm px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-light font-mono"
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
                className={`py-2.5 px-3 text-xs font-mono tracking-wide border rounded-sm transition-colors ${
                  category === cat
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-brand-light border-brand-border hover:border-brand-muted'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" fullWidth size="lg">
          LOG DISTRACTION
        </Button>
      </form>
    </Modal>
  );
}
