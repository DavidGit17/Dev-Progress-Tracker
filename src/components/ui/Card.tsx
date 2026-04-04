import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-brand-card border border-brand-border rounded-sm p-4 ${onClick ? 'cursor-pointer hover:border-brand-muted transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-brand-gray">{title}</h2>
      {subtitle && <p className="text-brand-light text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
