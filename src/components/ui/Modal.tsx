import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  theme: any;
}

export function Modal({ isOpen, onClose, title, children, theme }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`${theme.card} border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${theme.text}`}>{title}</h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.hover}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}