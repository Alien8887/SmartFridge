import { ChartDataPoint, EnergyData } from '../types';

export function formatTimestampTick(ts: number, spanMs: number): string {
  const d = new Date(ts);
  if (spanMs > 86_400_000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function hasRealTimestamps(data: { timestamp?: number }[]): boolean {
  return data.some(p => p.timestamp && p.timestamp > 1_000_000);
}

function downloadCSV(filename: string, rows: (string | number)[][], headers: string[]) {
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportChartCSV(data: ChartDataPoint[], sensorLabel: string, unit: string) {
  const rows = data.map(p => [p.timestamp ? new Date(p.timestamp).toISOString() : p.time, p.value]);
  downloadCSV(`${sensorLabel.toLowerCase()}-export-${Date.now()}.csv`, rows, ['timestamp', `${sensorLabel} (${unit})`]);
}

export function exportEnergyCSV(data: EnergyData[]) {
  const rows = data.map(p => [p.timestamp ? new Date(p.timestamp).toISOString() : p.time, p.usage, p.doorOpens]);
  downloadCSV(`energy-export-${Date.now()}.csv`, rows, ['timestamp', 'cumulative_kwh', 'door_opens']);
}