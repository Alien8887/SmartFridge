import { roundTo } from './numberUtils';

const UNIT_LABELS: Record<string, string> = { pcs: 'pieces', g: 'grams', kg: 'kilograms', ml: 'milliliters', L: 'liters' };
const CONTINUOUS_UNITS = new Set(['g', 'kg', 'ml', 'L']);
const UNIT_FAMILY: Record<string, 'mass' | 'volume' | 'count'> = { g: 'mass', kg: 'mass', ml: 'volume', L: 'volume', pcs: 'count' };

export function unitLabel(unit: string): string { return UNIT_LABELS[unit] ?? unit; }
export function isContinuousUnit(unit: string): boolean { return CONTINUOUS_UNITS.has(unit); }
export function unitFamily(unit: string): 'mass' | 'volume' | 'count' | null { return UNIT_FAMILY[unit] ?? null; }

export function stepForUnit(unit: string): number {
  if (unit === 'kg' || unit === 'L') return 0.1;
  if (unit === 'g' || unit === 'ml') return 10;
  return 1;
}

export function formatQuantity(amount: number, unit: string): string {
  if (!isContinuousUnit(unit)) return String(Math.round(amount));
  return amount.toFixed(1).replace(/\.0$/, '');
}

export function sanitizeAmount(value: number, unit: string): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (!isContinuousUnit(unit)) return Math.round(value);
  return roundTo(value, 1);
}

/** Common base per family: grams for mass, milliliters for volume, pcs
 *  stays pcs. Lets "0.3 kg" (a recipe) correctly compare against "300 g"
 *  (an inventory item), instead of a raw unit-blind number comparison. */
export function toBaseUnit(amount: number, unit: string): number {
  if (unit === 'kg' || unit === 'L') return amount * 1000;
  return amount;
}

/**
 * The actual fix for issue 3: the old matching logic only checked
 * `quantityAmount > 0` — ANY nonzero amount counted as "have it,"
 * regardless of how far short it was of the recipe's real requirement.
 * This compares real amounts, converting across g<->kg and ml<->L
 * automatically. If the two units are in genuinely different families
 * (e.g. inventory holds "2 pcs" but the recipe wants "0.3 kg" — which can
 * legitimately happen if an item was added by count instead of weight),
 * there's no safe numeric comparison to make, so this falls back to
 * presence-only rather than incorrectly blocking a real match on a
 * unit-family technicality.
 */
export function hasEnoughQuantity(haveAmount: number, haveUnit: string, needAmount: number, needUnit: string): boolean {
  const haveFam = unitFamily(haveUnit);
  const needFam = unitFamily(needUnit);
  if (haveFam && needFam && haveFam === needFam) {
    return toBaseUnit(haveAmount, haveUnit) + 1e-6 >= toBaseUnit(needAmount, needUnit);
  }
  return haveAmount > 0;
}