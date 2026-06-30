import React from 'react';

interface InputProps {
  type?:         string;
  label?:        string;
  placeholder?:  string;
  value:         string;
  onChange:      (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDark?:       boolean;
  className?:    string;
  disabled?:     boolean;
  autoComplete?: string;
}

export function Input({
  type = 'text', label, placeholder, value, onChange,
  isDark = true, className = '', disabled = false, autoComplete,
}: InputProps) {
  const field = (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`w-full px-4 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
        isDark
          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    />
  );

  if (!label) return field;

  return (
    <label className="block">
      <span className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
      {field}
    </label>
  );
}