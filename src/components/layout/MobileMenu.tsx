import React, { useEffect, useRef } from 'react';
import { NAV_ITEMS } from '../../constants/navigation';
import { Theme } from '../../types';

interface MobileMenuProps { isOpen: boolean; activeView: string; setActiveView: (view: string) => void; onClose: () => void; theme: Theme; darkMode: boolean; role?: string; }

export function MobileMenu({ isOpen, activeView, setActiveView, onClose, theme, darkMode, role }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const items = NAV_ITEMS.filter(item => !item.adminOnly || role === 'admin');

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; menuRef.current?.querySelector('button')?.focus(); }
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} aria-hidden="true" />
      <nav ref={menuRef} className={`fixed top-[72px] left-0 right-0 z-40 lg:hidden ${theme.card} ${theme.border} border-b shadow-lg max-h-[calc(100vh-72px)] overflow-y-auto animate-slide-down`} role="navigation" aria-label="Mobile navigation">
        <ul className="space-y-2 list-none p-4 m-0">
          {items.map(({ id, icon: Icon, label, description }) => {
            const active = activeView === id;
            return (
              <li key={id}>
                <button onClick={() => { setActiveView(id); onClose(); }} aria-current={active ? 'page' : undefined} type="button"
                  className={`w-full flex flex-col gap-1 px-4 py-3 rounded-xl transition-all text-left ${active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : darkMode ? 'text-slate-200 hover:bg-slate-700/60' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-3"><Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" /><span className="font-medium">{label}</span></div>
                  <span className={`text-xs ml-8 ${active ? 'text-sky-100' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{description}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}