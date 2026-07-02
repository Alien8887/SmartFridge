const UNIT_LABELS: Record<string, string> = { pcs: 'pieces', g: 'grams', kg: 'kilograms', ml: 'milliliters', L: 'liters' };
const CONTINUOUS_UNITS = new Set(['g', 'kg', 'ml', 'L']);

export function unitLabel(unit: string): string { return UNIT_LABELS[unit] ?? unit; }
export function isContinuousUnit(unit: string): boolean { return CONTINUOUS_UNITS.has(unit); }

/** kg/L step by tenths; g/ml step by tens; pcs steps by whole units. */
export function stepForUnit(unit: string): number {
  if (unit === 'kg' || unit === 'L') return 0.1;
  if (unit === 'g' || unit === 'ml') return 10;
  return 1;
}

/** One decimal place for continuous units (trailing ".0" trimmed); whole number for pieces. */
export function formatQuantity(amount: number, unit: string): string {
  if (!isContinuousUnit(unit)) return String(Math.round(amount));
  return amount.toFixed(1).replace(/\.0$/, '');
}