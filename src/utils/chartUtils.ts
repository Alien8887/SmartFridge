import { ChartDataPoint, EnergyData, ConsumptionData } from '../types'; // add ConsumptionData here
export function formatTimestampTick(ts: number, spanMs: number): string {
  const d = new Date(ts);
  if (spanMs > 86_400_000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function hasRealTimestamps(data: { timestamp?: number }[]): boolean {
  return data.some(p => p.timestamp && p.timestamp > 1_000_000);
}

// Kept for backward compatibility — no longer used by the chart components
// themselves (superseded by bucketFixedWindow's null-gap approach below).
export function getStalenessInfo(lastTimestamp: number | undefined, rangeMs: number): { isStale: boolean; staleLabel: string } {
  if (!lastTimestamp) return { isStale: false, staleLabel: '' };
  const staleMs = Date.now() - lastTimestamp;
  const isStale = rangeMs > 0 && staleMs > rangeMs;
  const mins = Math.floor(staleMs / 60000);
  const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return { isStale, staleLabel: label };
}

export type TimeRange = '1H' | '24H' | '7D';
const RANGE_MS: Record<TimeRange, number> = { '1H': 3_600_000, '24H': 86_400_000, '7D': 604_800_000 };

export function getWindowBounds(range: TimeRange): { windowStart: number; windowEnd: number } {
  const windowEnd = Date.now();
  return { windowStart: windowEnd - RANGE_MS[range], windowEnd };
}

export interface FixedBucket { time: string; value: number | null; timestamp: number; ewmaValue: number | null; }

/**
 * Buckets into exactly `bucketCount` fixed-width slots spanning
 * [windowStart, windowEnd] — from the CLOCK, never from the data. Empty
 * buckets get value: null (a real gap); populated ones get an average plus
 * a running EWMA. Callers MUST use [windowStart, windowEnd] as the chart's
 * XAxis domain directly.
 */
export function bucketFixedWindow(points: { value: number; timestamp?: number }[], windowStart: number, windowEnd: number, bucketCount: number, ewmaAlpha = 0.25): FixedBucket[] {
  const span = Math.max(1, windowEnd - windowStart);
  const bucketMs = span / bucketCount;
  const withTs = points.filter(p => p.timestamp && p.timestamp >= windowStart && p.timestamp <= windowEnd);

  const sums = new Array(bucketCount).fill(0);
  const counts = new Array(bucketCount).fill(0);
  withTs.forEach(p => {
    let idx = Math.floor((p.timestamp! - windowStart) / bucketMs);
    idx = Math.min(bucketCount - 1, Math.max(0, idx));
    sums[idx] += p.value; counts[idx] += 1;
  });

  let ewma: number | null = null;
  const out: FixedBucket[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = windowStart + i * bucketMs;
    const hasData = counts[i] > 0;
    const avg = hasData ? +(sums[i] / counts[i]).toFixed(2) : null;
    if (hasData) ewma = ewma === null ? avg! : +(ewmaAlpha * avg! + (1 - ewmaAlpha) * ewma).toFixed(2);
    out.push({
      time: new Date(bucketStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: avg, timestamp: bucketStart, ewmaValue: hasData ? ewma : null,
    });
  }
  return out;
}

/** Clock-anchored door-event bucketing — always returns bucketCount
 *  entries (zero-filled if there were no events), consistent with the
 *  "always return the full window shape" contract above. */
export function bucketDoorEvents(events: EnergyData[], rangeMs: number, bucketCount: number): EnergyData[] {
  const now = Date.now();
  const start = now - rangeMs;
  const bucketMs = rangeMs / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({ count: 0, usage: 0, startTs: start + i * bucketMs }));

  const withTs = events.filter(e => e.timestamp);
  if (withTs.length > 0) {
    const before = withTs.filter(e => e.timestamp! < start).sort((a, b) => a.timestamp! - b.timestamp!);
    let prevCumUsage = before.length > 0 ? before[before.length - 1].usage : 0;

    withTs.filter(e => e.timestamp! >= start).sort((a, b) => a.timestamp! - b.timestamp!).forEach(e => {
      const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((e.timestamp! - start) / bucketMs)));
      buckets[idx].count += 1;
      buckets[idx].usage += Math.max(0, e.usage - prevCumUsage);
      prevCumUsage = e.usage;
    });
  }

  return buckets.map(b => ({
    time: new Date(b.startTs).toLocaleTimeString([], bucketMs >= 86_400_000 ? { weekday: 'short' } as any : { hour: '2-digit', minute: '2-digit' }),
    doorOpens: b.count, usage: +b.usage.toFixed(4), timestamp: b.startTs,
  }));
}

export function computeForecastCurve(data: ChartDataPoint[], aheadMs: number, absoluteBounds: [number, number], steps = 10): ChartDataPoint[] {
  const windowed = data.filter(p => p.timestamp).slice(-24);
  if (windowed.length === 0) return [];

  const lastPoint = windowed[windowed.length - 1];
  const lastTs = lastPoint.timestamp!;

  // FIXED: was `if (windowed.length < 5) return [];` — an EMPTY array.
  // With three sensor charts sharing one syncId, if Weight has fewer real
  // points than Temperature (very plausible — the load cell has had more
  // fault/retry history), Weight's combined array ends up shorter even
  // with a shared "Predict" toggle, which still breaks index-based
  // syncing. Now always returns exactly `steps` points once ANY real data
  // exists, falling back to a flat continuation at the last known value
  // when there's not enough signal for a real curve fit — keeping array
  // length identical across all three charts whenever the toggle is on.
  if (windowed.length < 5) {
    const out: ChartDataPoint[] = [];
    for (let i = 1; i <= steps; i++) {
      const futureTs = lastTs + aheadMs * (i / steps);
      out.push({ time: new Date(futureTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: lastPoint.value, timestamp: futureTs });
    }
    return out;
  }

  const t0 = windowed[0].timestamp!;
  const xs = windowed.map(p => (p.timestamp! - t0) / 60_000);
  const ys = windowed.map(p => p.value);
  const n = xs.length;

  let S1 = 0, S2 = 0, S3 = 0, S4 = 0, T0 = 0, T1 = 0, T2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i]; const x2 = x * x;
    S1 += x; S2 += x2; S3 += x2 * x; S4 += x2 * x2;
    T0 += y; T1 += x * y; T2 += x2 * y;
  }
  const S0 = n;
  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det3([[S4, S3, S2], [S3, S2, S1], [S2, S1, S0]]);

  let a = 0, b = 0, c = ys[n - 1];
  if (Math.abs(D) > 1e-9) {
    a = det3([[T2, S3, S2], [T1, S2, S1], [T0, S1, S0]]) / D;
    b = det3([[S4, T2, S2], [S3, T1, S1], [S2, T0, S0]]) / D;
    c = det3([[S4, S3, T2], [S3, S2, T1], [S2, S1, T0]]) / D;
  }
  a *= 0.35;

  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const span = Math.max(yMax - yMin, 0.5);
  const lo = Math.max(yMin - span * 0.5, absoluteBounds[0]);
  const hi = Math.min(yMax + span * 0.5, absoluteBounds[1]);

  const lastX = xs[n - 1];
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

export function exportConsumptionCSV(data: (ConsumptionData & { dateLabel?: string })[]) {
  const rows = data.map(d => [d.dateLabel ?? d.day, d.dairy, d.meat, d.vegetables, d.fruits]);
  downloadFile(`consumption-export-${Date.now()}.csv`, [['day', 'dairy', 'meat', 'vegetables', 'fruits'].join(','), ...rows.map(r => r.join(','))].join('\n'), 'text/csv;charset=utf-8;');
}