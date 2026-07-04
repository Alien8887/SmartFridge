import { ChartDataPoint, EnergyData } from '../types';

export function formatTimestampTick(ts: number, spanMs: number): string {
  const d = new Date(ts);
  if (spanMs > 86_400_000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
export function hasRealTimestamps(data: { timestamp?: number }[]): boolean {
  return data.some(p => p.timestamp && p.timestamp > 1_000_000);
}

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
 * Local quadratic (degree-2) regression fit only to the most recent ~24
 * points, then evaluated at several future timestamps to produce a genuinely
 * curved forecast line instead of a single straight segment. "Local" means
 * a recent trend reversal bends the curve rather than being averaged away
 * by the full history the way a single global linear fit would.
 */
export function computeForecastCurve(data: ChartDataPoint[], aheadMs: number, steps = 10): ChartDataPoint[] {
  const windowed = data.filter(p => p.timestamp).slice(-24);
  if (windowed.length < 5) return [];

  const t0 = windowed[0].timestamp!;
  const xs = windowed.map(p => (p.timestamp! - t0) / 60_000); // minutes since window start
  const ys = windowed.map(p => p.value);
  const n = xs.length;

  let S1 = 0, S2 = 0, S3 = 0, S4 = 0, T0 = 0, T1 = 0, T2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i];
    const x2 = x * x;
    S1 += x; S2 += x2; S3 += x2 * x; S4 += x2 * x2;
    T0 += y; T1 += x * y; T2 += x2 * y;
  }
  const S0 = n;

  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const M = [[S4, S3, S2], [S3, S2, S1], [S2, S1, S0]];
  const D = det3(M);

  let a = 0, b = 0, c = ys[n - 1];
  if (Math.abs(D) > 1e-9) {
    a = det3([[T2, S3, S2], [T1, S2, S1], [T0, S1, S0]]) / D;
    b = det3([[S4, T2, S2], [S3, T1, S1], [S2, T0, S0]]) / D;
    c = det3([[S4, S3, T2], [S3, S2, T1], [S2, S1, T0]]) / D;
  }

  // A quadratic can extrapolate into an absurd spike quickly — clamp the
  // curve to the recent observed range plus one range-width of headroom.
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const span = Math.max(yMax - yMin, 1);
  const lo = yMin - span, hi = yMax + span;

  const lastX = xs[n - 1];
  const lastTs = windowed[n - 1].timestamp!;
  const aheadMin = aheadMs / 60_000;

  const out: ChartDataPoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const frac = i / steps;
    const futureX = lastX + aheadMin * frac;
    const futureTs = lastTs + aheadMs * frac;
    let val = a * futureX * futureX + b * futureX + c;
    val = Math.max(lo, Math.min(hi, val));
    out.push({ time: new Date(futureTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: +val.toFixed(2), timestamp: futureTs });
  }
  return out;
}

export function getStalenessInfo(lastTimestamp: number | undefined, rangeMs: number): { isStale: boolean; staleLabel: string } {
  if (!lastTimestamp) return { isStale: false, staleLabel: '' };
  const staleMs = Date.now() - lastTimestamp;
  const isStale = rangeMs > 0 && staleMs > rangeMs;
  const mins = Math.floor(staleMs / 60000);
  const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return { isStale, staleLabel: label };
}