import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-white text-black hover:bg-brand-white active:bg-brand-lighter font-semibold',
  secondary: 'bg-brand-card text-brand-white border border-brand-border hover:bg-brand-muted active:bg-brand-muted font-medium',
  ghost: 'text-brand-light hover:text-white hover:bg-brand-card active:bg-brand-card font-medium',
  danger: 'bg-brand-muted text-white hover:bg-brand-gray active:bg-brand-gray font-medium border border-brand-border',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-4 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        inline-flex items-center justify-center gap-2 rounded-sm
        transition-all duration-150 select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
