import React from 'react';
import { BarChart3, Package, ShoppingCart, Thermometer } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  theme: any;
}

export function Sidebar({ activeView, setActiveView, theme }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'suggestions', icon: ShoppingCart, label: 'Suggestions' },
    { id: 'environment', icon: Thermometer, label: 'Environment' }
  ];

  return (
    <div className={`hidden lg:block ${theme.card} border rounded-2xl p-4 shadow-lg w-64 shrink-0 h-fit sticky top-24`}>
      <nav className="space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                  : `${theme.hover} ${theme.text}`
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}