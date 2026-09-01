// Local-time date keys everywhere — this is the actual "date/time
// synchronization" fix. toDateKey previously used toISOString(), which
// converts to UTC; isToday/formatDayLabel used local time. Anyone not on
// UTC could have "today" roll over to the wrong calendar day mid-afternoon,
// silently saving meals under the wrong date key.
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-anchored week
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isToday(d: Date): boolean {
  return toDateKey(d) === toDateKey(new Date());
}

/** The key used everywhere a "which week is this" boundary matters —
 *  the Monday of the week containing `d`, as a local date key. */
export function weekKeyFor(d: Date): string {
  return toDateKey(startOfWeek(d));
}

/** Monday-first day order, matching Calendar's own week definition —
 *  used to bring Weekly Consumption onto the SAME week boundary as the
 *  Calendar tab, instead of the two silently disagreeing about what
 *  "this week" means. */
export function mondayFirstDayIndex(date: Date): number {
  const jsDay = date.getDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7;      // remapped so Monday=0..Sunday=6
}

export function datesForWeek(weekStartDate: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStartDate, i)));
}