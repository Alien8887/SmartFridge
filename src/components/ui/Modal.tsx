import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Theme } from '../../types';

interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; theme: Theme; }

export function Modal({ isOpen, onClose, title, children, theme }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) { closeButtonRef.current?.focus(); document.body.style.overflow = 'hidden'; }
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${theme.card} border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in`}>
        <div className="flex items-center justify-between mb-6">
          <h3 id="modal-title" className={`text-xl font-bold ${theme.text}`}>{title}</h3>
          {/* Fixed slate-700/slate-600/white — intentionally NOT theme-driven, so this
              button is guaranteed visible against any card background, light or dark. */}
          <button ref={closeButtonRef} onClick={onClose} aria-label="Close modal" type="button"
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors flex-shrink-0">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}