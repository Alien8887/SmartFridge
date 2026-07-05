import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: React.ElementType;
  isDark?: boolean; // only applies a fallback color if you're NOT passing your own bg/border via className
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, className = '', hover = false, as: Tag = 'div', isDark, variant = 'default' }: CardProps) {
  // No baked-in background/border unless isDark is explicitly passed. Every
  // real call site in this app passes theme.card via className, so Card
  // must not ALSO assert its own bg-*/border-* — that silent collision was
  // only ever masked in dark mode by dark:'s extra CSS specificity, which is
  // exactly why it looked fine there and wrong in light mode.
  const colorBase = isDark === undefined ? '' : (isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200');

  const variantExtra: Record<NonNullable<CardProps['variant']>, string> = {
    default: 'shadow-lg',
    elevated: 'shadow-xl',
    outlined: 'shadow-none',
  };

  return (
    <Tag className={`border rounded-2xl p-4 md:p-6 ${colorBase} ${variantExtra[variant]} ${hover ? 'transition-all hover:shadow-xl hover:-translate-y-1' : ''} ${className}`.replace(/\s+/g, ' ').trim()}>
      {children}
    </Tag>
  );
}