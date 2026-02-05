export function getExpiryWarning(days: number): { color: string; text: string; glow: string } {
    if (days <= 1) return { color: 'bg-red-500', text: 'Urgent', glow: 'shadow-red-500/50' };
    if (days <= 3) return { color: 'bg-yellow-500', text: 'Soon', glow: 'shadow-yellow-500/50' };
    return { color: 'bg-emerald-500', text: 'Fresh', glow: 'shadow-emerald-500/50' };
  }
  
  export function getFreshnessColor(freshness: number, darkMode: boolean): string {
    if (freshness >= 85) return darkMode ? 'text-emerald-400' : 'text-emerald-600';
    if (freshness >= 70) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  }