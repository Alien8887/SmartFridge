export function getDaysUntilExpiry(expiryDays: number, addedDateTimestamp: number): number {
  if (!addedDateTimestamp) return expiryDays;
  const elapsedDays = Math.floor((Date.now() - addedDateTimestamp) / (1000 * 60 * 60 * 24));
  return Math.max(0, expiryDays - elapsedDays);
}

export function calculateFreshness(expiryDays: number, addedDateTimestamp: number): number {
  const daysRemaining = getDaysUntilExpiry(expiryDays, addedDateTimestamp);
  const freshness = Math.round((daysRemaining / expiryDays) * 100);
  return Math.max(0, Math.min(100, freshness));
}

/**
 * Status is RELATIVE to the item's own shelf life, not a fixed day count.
 * A 3-day-shelf-life item only shows "expiring" in its last ~25% of life
 * (about the final day), instead of the moment it's added.
 */
export function getItemStatus(expiry: number, addedDate: number): 'expired' | 'expiring' | 'fresh' {
  const daysLeft = getDaysUntilExpiry(expiry, addedDate);
  if (daysLeft <= 0) return 'expired';
  const expiringThreshold = Math.max(1, Math.ceil(expiry * 0.25));
  if (daysLeft <= expiringThreshold) return 'expiring';
  return 'fresh';
}

export function getExpiryStatus(daysRemaining: number): {
  color: string; bgColor: string; text: string; glow: string; priority: 'urgent' | 'soon' | 'fresh';
} {
  if (daysRemaining <= 0) return { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', text: 'Expired', glow: 'shadow-red-500/50', priority: 'urgent' };
  if (daysRemaining <= 1) return { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', text: 'Expiring today', glow: 'shadow-red-500/50', priority: 'urgent' };
  if (daysRemaining <= 3) return { color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', text: 'Expiring soon', glow: 'shadow-orange-500/50', priority: 'soon' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'Fresh', glow: 'shadow-emerald-500/50', priority: 'fresh' };
}

export function getFreshnessColor(freshness: number, darkMode: boolean): string {
  if (freshness >= 85) return darkMode ? 'text-emerald-400' : 'text-emerald-600';
  if (freshness >= 70) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
  if (freshness >= 50) return darkMode ? 'text-orange-400' : 'text-orange-600';
  return darkMode ? 'text-red-400' : 'text-red-600';
}

export function getFreshnessBadgeColor(freshness: number): string {
  if (freshness >= 85) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (freshness >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30';
  if (freshness >= 50) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

export function formatExpiryDisplay(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'Expired';
  if (daysRemaining === 1) return 'Tomorrow';
  if (daysRemaining <= 7) return `${daysRemaining} days`;
  if (daysRemaining <= 30) return `${Math.floor(daysRemaining / 7)} weeks`;
  return `${Math.floor(daysRemaining / 30)} months`;
}

export function getExpiryDate(daysRemaining: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysRemaining);
  return date;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

export function filterExpiringItems<T extends { expiry: number; addedDate: number }>(items: T[], daysThreshold = 3): T[] {
  return items.filter(item => {
    const d = getDaysUntilExpiry(item.expiry, item.addedDate);
    return d <= daysThreshold && d >= 0;
  });
}

export function filterExpiredItems<T extends { expiry: number; addedDate: number }>(items: T[]): T[] {
  return items.filter(item => getDaysUntilExpiry(item.expiry, item.addedDate) <= 0);
}

export function sortByExpiry<T extends { expiry: number; addedDate: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => getDaysUntilExpiry(a.expiry, a.addedDate) - getDaysUntilExpiry(b.expiry, b.addedDate));
}

export function getExpiryWarning(daysRemaining: number): { color: string; text: string; glow: string } {
  const status = getExpiryStatus(daysRemaining);
  return { color: status.bgColor, text: status.text, glow: status.glow };
}