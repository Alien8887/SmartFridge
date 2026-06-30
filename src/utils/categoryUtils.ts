import React from 'react';
import { Droplets, Beef, Apple, Leaf, Wine, UtensilsCrossed, Home, Package } from 'lucide-react';

export const CATEGORIES = ['Dairy', 'Meat', 'Fruits', 'Vegetables', 'Beverages', 'Condiments', 'Frozen', 'Other'] as const;
export type CategoryType = (typeof CATEGORIES)[number];

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Dairy: Droplets, Meat: Beef, Fruits: Apple, Vegetables: Leaf,
  Beverages: Wine, Condiments: UtensilsCrossed, Frozen: Package, Other: Home,
};

const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string; badge: string; ring: string }> = {
  Dairy:      { bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100',   ring: 'ring-blue-400'   },
  Meat:       { bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100',    ring: 'ring-red-400'    },
  Fruits:     { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100', ring: 'ring-orange-400' },
  Vegetables: { bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100',  ring: 'ring-green-400'  },
  Beverages:  { bg: 'bg-cyan-50',   text: 'text-cyan-700',   badge: 'bg-cyan-100',   ring: 'ring-cyan-400'   },
  Condiments: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100', ring: 'ring-purple-400' },
  Frozen:     { bg: 'bg-slate-50',  text: 'text-slate-700',  badge: 'bg-slate-100',  ring: 'ring-slate-400'  },
  Other:      { bg: 'bg-gray-50',   text: 'text-gray-700',   badge: 'bg-gray-100',   ring: 'ring-gray-400'   },
};

export function getIconForCategory(category: string) { return CATEGORY_ICON_MAP[category] ?? CATEGORY_ICON_MAP['Other']; }
export function getCategoryColors(category: string)  { return CATEGORY_COLOR_MAP[category] ?? CATEGORY_COLOR_MAP['Other']; }
export function isValidCategory(category: string): category is CategoryType { return CATEGORIES.includes(category as CategoryType); }
export function getAvailableCategories(): string[] { return [...CATEGORIES]; }
export function normalizeCategory(category: string): string {
  const n = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  return isValidCategory(n) ? n : 'Other';
}

export function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const cat = isValidCategory(item.category) ? item.category : 'Other';
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}