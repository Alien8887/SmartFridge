import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?:  React.ReactNode;
  onClick?:   () => void;
  variant?:   Variant;
  size?:      Size;
  className?: string;
  icon?:      React.ReactNode;
  fullWidth?: boolean;
  isDark?:    boolean;
  disabled?:  boolean;
  loading?:   boolean;
  type?:      'button' | 'submit' | 'reset';
}

export function Button({
  children, onClick, variant = 'primary', size = 'md',
  className = '', icon, fullWidth = false, isDark = true,
  disabled = false, loading = false, type = 'button',
}: ButtonProps) {
  const variantStyles: Record<Variant, string> = {
    primary:   'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20',
    secondary: 'bg-slate-500 hover:bg-slate-600 text-white',
    danger:    'bg-red-500 hover:bg-red-600 text-white',
    success:   'bg-emerald-500 hover:bg-emerald-600 text-white',
    ghost:     isDark
      ? 'bg-slate-700/50 hover:bg-slate-600/60 text-slate-300 border border-slate-600'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300',
  };

  const sizeStyles: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}