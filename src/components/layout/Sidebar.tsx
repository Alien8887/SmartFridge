import React from 'react';
import { NAV_ITEMS } from '../../constants/navigation';
import { Theme } from '../../types';

interface SidebarProps { activeView: string; setActiveView: (view: string) => void; theme: Theme; darkMode: boolean; role?: string; }

export function Sidebar({ activeView, setActiveView, theme, darkMode, role }: SidebarProps) {
  const items = NAV_ITEMS.filter(item => !item.adminOnly || role === 'admin');
  return (
    <aside className={`hidden lg:block ${theme.card} ${theme.border} border rounded-2xl p-4 shadow-lg w-64 shrink-0 h-fit sticky top-24`} aria-label="Main navigation">
      <nav>
        <ul className="space-y-2 list-none p-0 m-0">
          {items.map(({ id, icon: Icon, label, description }) => {
            const active = activeView === id;
            return (
              <li key={id}>
                <button onClick={() => setActiveView(id)} aria-current={active ? 'page' : undefined} type="button"
                  className={`w-full flex flex-col gap-1 px-4 py-3 rounded-xl transition-all text-left ${active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : darkMode ? 'text-slate-200 hover:bg-slate-700/60' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-3"><Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" /><span className="font-medium">{label}</span></div>
                  <p className={`text-xs ml-8 ${active ? 'text-sky-100' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}