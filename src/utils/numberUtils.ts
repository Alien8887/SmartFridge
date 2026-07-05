export function roundTo(n: number, decimals = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((n + Number.EPSILON) * factor) / factor;
  }
  
  export function formatStat(n: number): string {
    const rounded = roundTo(n, 1);
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }