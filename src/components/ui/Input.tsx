import React from 'react';

interface InputProps {
  type?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDark?: boolean;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  error?: string;
}

export function Input({
  type = 'text', label, placeholder, value, onChange,
  isDark = true, className = '', disabled = false, autoComplete, error,
}: InputProps) {
  // Mutually exclusive border color — never mixes the error state with the
  // dark/light border, since both target the same CSS property and Tailwind's
  // cascade order (not JSX string order) would decide which one "wins."
  const borderAndRing = error
    ? 'border-red-500 focus:ring-red-500'
    : `focus:ring-sky-500 ${isDark ? 'border-slate-600' : 'border-slate-300'}`;
  const bgAndText = isDark
    ? 'bg-slate-700 text-white placeholder-slate-400'
    : 'bg-white text-slate-900 placeholder-slate-500';

  const field = (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`w-full px-4 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 ${borderAndRing} ${bgAndText} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    />
  );

  if (!label && !error) return field;

  return (
    <label className="block">
      {label && <span className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>}
      {field}
      {error && <span className="block text-xs text-red-400 mt-1">{error}</span>}
    </label>
  );
}