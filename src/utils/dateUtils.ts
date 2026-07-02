export function toDateKey(d: Date): string { return d.toISOString().slice(0, 10); }
export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
export function addDays(d: Date, n: number): Date { const copy = new Date(d); copy.setDate(copy.getDate() + n); return copy; }
export function formatDayLabel(d: Date): string { return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }
export function isToday(d: Date): boolean { return toDateKey(d) === toDateKey(new Date()); }