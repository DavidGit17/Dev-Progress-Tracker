import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overscroll-none">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-brand-dark border border-brand-border rounded-t-xl sm:rounded-sm z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-brand-border flex-shrink-0">
          <h3 className="font-mono text-sm tracking-widest uppercase text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-brand-gray hover:text-white transition-colors rounded-sm hover:bg-brand-card"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain flex-1 p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
