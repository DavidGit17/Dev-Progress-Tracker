import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-brand-dark border border-brand-border rounded-t-xl sm:rounded-sm z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-brand-border flex-shrink-0">
          <h3 className="font-mono text-sm tracking-widest uppercase text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-brand-gray hover:text-white transition-colors rounded-sm hover:bg-brand-card"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}
