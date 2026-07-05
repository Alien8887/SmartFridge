import React, { useMemo } from 'react';

const COLORS = ['#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444'];

export function ConfettiBurst() {
  const particles = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.3, duration: 1 + Math.random() * 0.6,
    color: COLORS[i % COLORS.length], width: 6 + Math.random() * 6,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <span key={p.id} className="absolute top-0 rounded-sm animate-confetti-fall"
          style={{ left: `${p.left}%`, width: p.width, height: p.width * 0.6, backgroundColor: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
      ))}
    </div>
  );
}