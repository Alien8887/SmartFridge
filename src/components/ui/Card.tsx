import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`border rounded-2xl p-4 md:p-6 shadow-lg ${hover ? 'transition-all hover:shadow-xl' : ''} ${className}`}>
      {children}
    </div>
  );
}