import { ChartDataPoint, EnergyData } from '../types';

export function formatTimestampTick(ts: number, spanMs: number): string {
  const d = new Date(ts);
  if (spanMs > 86_400_000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
export function hasRealTimestamps(data: { timestamp?: number }[]): boolean { return data.some(p => p.timestamp && p.timestamp > 1_000_000); }

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export function exportChartCSV(data: ChartDataPoint[], sensorLabel: string, unit: string) {
  const rows = data.map(p => [p.timestamp ? new Date(p.timestamp).toISOString() : p.time, p.value]);
  downloadFile(`${sensorLabel.toLowerCase()}-export-${Date.now()}.csv`, [['timestamp', `${sensorLabel} (${unit})`].join(','), ...rows.map(r => r.join(','))].join('\n'), 'text/csv;charset=utf-8;');
}
export function exportEnergyCSV(data: EnergyData[]) {
  const rows = data.map(p => [p.timestamp ? new Date(p.timestamp).toISOString() : p.time, p.usage, p.doorOpens]);
  downloadFile(`energy-export-${Date.now()}.csv`, [['timestamp', 'cumulative_kwh', 'door_opens'].join(','), ...rows.map(r => r.join(','))].join('\n'), 'text/csv;charset=utf-8;');
}
export function exportShoppingList(items: string[]) {
  const content = `Smart Fridge — Shopping List\nGenerated ${new Date().toLocaleString()}\n\n${items.map(i => `☐ ${i}`).join('\n')}\n`;
  downloadFile(`shopping-list-${Date.now()}.txt`, content, 'text/plain;charset=utf-8;');
}

/**
 * Simple ordinary-least-squares linear regression over the visible window,
 * projected `aheadMs` past the last real point. This is what draws the
 * dashed forecast segment on each sensor chart — a real, if intentionally
 * simple, trend projection, not a guarantee.
 */
export function computeForecastPoint(data: ChartDataPoint[], aheadMs: number): ChartDataPoint | null {
  const pts = data.filter(p => p.timestamp);
  if (pts.length < 4) return null;
  const xs = pts.map(p => p.timestamp!);
  const ys = pts.map(p => p.value);
  const n = xs.length;
  const xBar = xs.reduce((a, b) => a + b, 0) / n;
  const yBar = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - xBar) * (ys[i] - yBar); den += (xs[i] - xBar) ** 2; }
  const slope = den ? num / den : 0;
  const intercept = yBar - slope * xBar;
  const lastTs = xs[n - 1];
  const futureTs = lastTs + aheadMs;
  const futureVal = intercept + slope * futureTs;
  return { time: new Date(futureTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: +futureVal.toFixed(2), timestamp: futureTs, slope } as ChartDataPoint & { slope: number };
}

export function getStalenessInfo(lastTimestamp: number | undefined, rangeMs: number): { isStale: boolean; staleLabel: string } {
  if (!lastTimestamp) return { isStale: false, staleLabel: '' };
  const staleMs = Date.now() - lastTimestamp;
  const isStale = rangeMs > 0 && staleMs > rangeMs;
  const mins = Math.floor(staleMs / 60000);
  const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return { isStale, staleLabel: label };
}