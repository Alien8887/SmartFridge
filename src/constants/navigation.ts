import { BarChart3, Wind, ShoppingCart, Lightbulb, UserCircle, LucideIcon } from 'lucide-react';

export const HEADER_HEIGHT = '72px';

export interface NavItem {
  id: 'dashboard' | 'environment' | 'inventory' | 'suggestions' | 'profile';
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: BarChart3,    description: 'Overview and quick stats'  },
  { id: 'environment', label: 'Environment', icon: Wind,         description: 'Temperature and humidity'  },
  { id: 'inventory',   label: 'Inventory',   icon: ShoppingCart, description: 'Manage food items'         },
  { id: 'suggestions', label: 'Suggestions', icon: Lightbulb,    description: 'Smart tips and meal ideas' },
  { id: 'profile',     label: 'Profile',     icon: UserCircle,   description: 'Account and device'        },
];

export const getNavItem = (id: string): NavItem | undefined => NAV_ITEMS.find(item => item.id === id);