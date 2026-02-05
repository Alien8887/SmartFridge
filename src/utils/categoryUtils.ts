import { Droplets, Beef, Apple } from 'lucide-react';

export function getIconForCategory(category: string) {
  if (category === 'Dairy' || category === 'Beverages') return Droplets;
  if (category === 'Meat') return Beef;
  return Apple;
}