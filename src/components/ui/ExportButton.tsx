import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps { onClick: () => void; darkMode: boolean; }

export function ExportButton({ onClick, darkMode }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Export as CSV"
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
        darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }`}
    >
      <Download className="w-3 h-3" /> CSV
    </button>
  );
}