import { ChartDataPoint, EnergyData } from '../types';

// ── timestamp / staleness helpers ──────────────────────────────────────
export function formatTimestampTick(ts: number, spanMs: number): string {
  const d = new Date(ts);
  if (spanMs > 86_400_000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function hasRealTimestamps(data: { timestamp?: number }[]): boolean {
  return data.some(p => p.timestamp && p.timestamp > 1_000_000);
}

export function getStalenessInfo(lastTimestamp: number | undefined, rangeMs: number): { isStale: boolean; staleLabel: string } {
  if (!lastTimestamp) return { isStale: false, staleLabel: '' };
  const staleMs = Date.now() - lastTimestamp;
  const isStale = rangeMs > 0 && staleMs > rangeMs;
  const mins = Math.floor(staleMs / 60000);
  const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return { isStale, staleLabel: label };
}

// ── range filtering ───────────────────────────────────────────────────
const RANGE_MS_MAP: Record<'1H' | '24H' | '7D', number> = { '1H': 3_600_000, '24H': 86_400_000, '7D': 604_800_000 };

/**
 * Returns points that actually fall inside the selected window.
 * Previously, when NOTHING fell in the window, this fell back to
 * data.slice(-fallbackCount) — silently showing days-old data mislabeled as
 * "the last 24H." That's exactly backwards: if nothing real is in the
 * window, the honest answer is empty, so the UI can say "no data in this
 * range" instead of lying about how current the numbers are.
 */
export function filterByRange<T extends { timestamp?: number }>(data: T[], range: '1H' | '24H' | '7D', _fallbackCount?: number): T[] {
  if (data.length === 0) return [];
  const withTs = data.filter(p => p.timestamp && p.timestamp > 1_000_000);
  if (withTs.length === 0) return [];
  const cutoff = Date.now() - RANGE_MS_MAP[range];
  return withTs.filter(p => (p.timestamp ?? 0) >= cutoff);
}

// ── door-event bucketing ──────────────────────────────────────────────
export function bucketDoorEvents(events: EnergyData[], rangeMs: number, bucketCount: number): EnergyData[] {
  const withTs = events.filter(e => e.timestamp);
  if (withTs.length === 0) return [];

  const now = Date.now();
  const start = now - rangeMs;
  const bucketMs = rangeMs / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, i) => ({ count: 0, usage: 0, startTs: start + i * bucketMs }));

  const before = withTs.filter(e => e.timestamp! < start).sort((a, b) => a.timestamp! - b.timestamp!);
  let prevCumUsage = before.length > 0 ? before[before.length - 1].usage : 0;

  withTs.filter(e => e.timestamp! >= start).sort((a, b) => a.timestamp! - b.timestamp!).forEach(e => {
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((e.timestamp! - start) / bucketMs)));
    buckets[idx].count += 1;
    buckets[idx].usage += Math.max(0, e.usage - prevCumUsage);
    prevCumUsage = e.usage;
  });

  return buckets.map(b => ({
    time: new Date(b.startTs).toLocaleTimeString([], bucketMs >= 86_400_000 ? { weekday: 'short' } as any : { hour: '2-digit', minute: '2-digit' }),
    doorOpens: b.count,
    usage: +b.usage.toFixed(4),
    timestamp: b.startTs,
  }));
}

// ── sensor-history aggregation (bucketing + EWMA overlay) ──────────────
export interface AggregatedPoint extends ChartDataPoint {
  ewmaValue?: number;
}

/**
 * Collapses a windowed series down to a sane point count for display —
 * bucketing into equal time slots and averaging within each. This is what
 * "deletes points where no change is seen": a flat run of near-identical
 * readings collapses into one averaged bucket, indistinguishable in value
 * from decimation, but without needing to guess which points are "boring."
 * Also computes a running EWMA over the bucketed series and attaches it as
 * `ewmaValue`, so charts can render a smoothed trend line alongside the
 * (now much sparser) raw series.
 */
export function aggregateForDisplay(points: ChartDataPoint[], targetBucketCount = 60, ewmaAlpha = 0.25): AggregatedPoint[] {
  if (points.length === 0) return [];
  const withTs = points.filter(p => p.timestamp);

  if (withTs.length === 0 || withTs.length <= targetBucketCount) {
    let ewma: number | undefined;
    return points.map(p => {
      ewma = ewma === undefined ? p.value : ewmaAlpha * p.value + (1 - ewmaAlpha) * ewma;
      return { ...p, ewmaValue: +ewma.toFixed(2) };
    });
  }

  const first = withTs[0].timestamp!;
  const last = withTs[withTs.length - 1].timestamp!;
  const span = Math.max(1, last - first);
  const bucketMs = span / targetBucketCount;

  const buckets: { sum: number; count: number; lastTs: number; lastTime: string }[] =
    Array.from({ length: targetBucketCount }, () => ({ sum: 0, count: 0, lastTs: 0, lastTime: '' }));

  withTs.forEach(p => {
    const idx = Math.min(targetBucketCount - 1, Math.max(0, Math.floor((p.timestamp! - first) / bucketMs)));
    buckets[idx].sum += p.value;
    buckets[idx].count += 1;
    buckets[idx].lastTs = p.timestamp!;
    buckets[idx].lastTime = p.time;
  });

  let ewma: number | undefined;
  return buckets
    .filter(b => b.count > 0)
    .map(b => {
      const avg = +(b.sum / b.count).toFixed(2);
      ewma = ewma === undefined ? avg : ewmaAlpha * avg + (1 - ewmaAlpha) * ewma;
      return { time: b.lastTime, value: avg, timestamp: b.lastTs, ewmaValue: +ewma!.toFixed(2) };
    });
}

// ── forecast curve (damped local quadratic, physically clipped) ────────
/**
 * Was a raw quadratic fit through the last 24 raw (noisy) points — exactly
 * what produces wild, physically-nonsensical extrapolation. Two fixes:
 * the curvature term is damped toward a gentler line (still curved, just
 * not runaway), and the output is clipped to real physical bounds per
 * sensor type, not just a loose multiple of recent spread.
 */
export function computeForecastCurve(data: ChartDataPoint[], aheadMs: number, absoluteBounds: [number, number], steps = 10): ChartDataPoint[] {
  const windowed = data.filter(p => p.timestamp).slice(-24);
  if (windowed.length < 5) return [];

  const t0 = windowed[0].timestamp!;
  const xs = windowed.map(p => (p.timestamp! - t0) / 60_000);
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

  const CURVATURE_DAMPING = 0.35;
  a *= CURVATURE_DAMPING;

  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const span = Math.max(yMax - yMin, 0.5);
  const relLo = yMin - span * 0.5, relHi = yMax + span * 0.5;
  const lo = Math.max(relLo, absoluteBounds[0]);
  const hi = Math.min(relHi, absoluteBounds[1]);

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

// ── export helpers ───────────────────────────────────────────────────
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