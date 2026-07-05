import { roundTo } from './numberUtils';

const UNIT_LABELS: Record<string, string> = { pcs: 'pieces', g: 'grams', kg: 'kilograms', ml: 'milliliters', L: 'liters' };
const CONTINUOUS_UNITS = new Set(['g', 'kg', 'ml', 'L']);

export function unitLabel(unit: string): string { return UNIT_LABELS[unit] ?? unit; }
export function isContinuousUnit(unit: string): boolean { return CONTINUOUS_UNITS.has(unit); }

export function stepForUnit(unit: string): number {
  if (unit === 'kg' || unit === 'L') return 0.1;
  if (unit === 'g' || unit === 'ml') return 10;
  return 1;
}

export function formatQuantity(amount: number, unit: string): string {
  if (!isContinuousUnit(unit)) return String(Math.round(amount));
  return amount.toFixed(1).replace(/\.0$/, '');
}

/** Enforced at entry time: whole numbers for pcs, one decimal for everything
 *  else. This is the rule for "pieces can't get decimal values" — continuous
 *  units always can. */
export function sanitizeAmount(value: number, unit: string): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (!isContinuousUnit(unit)) return Math.round(value);
  return roundTo(value, 1);
}