import React from 'react';
import { BarChart3, Package, ShoppingCart, Thermometer } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  onClose: () => void;
  theme: any;
}

export function MobileMenu({ isOpen, activeView, setActiveView, onClose, theme }: MobileMenuProps) {
  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'suggestions', icon: ShoppingCart, label: 'Suggestions' },
    { id: 'environment', icon: Thermometer, label: 'Environment' }
  ];

  return (
    <div className={`lg:hidden fixed inset-0 z-40 ${theme.bg}`} style={{ top: '64px' }}>
      <div className={`${theme.card} border-r h-full p-4`}>
        <nav className="space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  onClose();
                }}
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
    </div>
  );
}