import React, { useState, useMemo } from 'react';
import { Thermometer, Droplets, Zap, DoorOpen, Lightbulb, Gauge, Volume2, Sparkles, Info, Wifi, CheckCircle, XCircle, HelpCircle, Clock3 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { TempChart } from '../../components/charts/TempChart';
import { HumidityChart } from '../../components/charts/HumidityChart';
import { PressureChart } from '../../components/charts/PressureChart';
import { EnergyChart } from '../../components/charts/EnergyChart';
import { SensorData, ChartDataPoint, EnergyData, Theme } from '../../types';
import type { HardwareDiagnostics } from '../../hooks/useESP32Sensors';

type TimeRange = '1H' | '24H' | '7D';
const RANGE_MS = { '1H': 3_600_000, '24H': 86_400_000, '7D': 604_800_000 } as const;
const RANGE_COUNTS = { '1H': 30, '24H': 120, '7D': 500 } as const;

function filterByRange<T extends { timestamp?: number }>(data: T[], range: TimeRange, fallbackCount: number): T[] {
  if (data.length === 0) return [];
  const withTs = data.filter(p => p.timestamp && p.timestamp > 1_000_000);
  if (withTs.length > 0) {
    const cutoff = Date.now() - RANGE_MS[range];
    const filtered = withTs.filter(p => (p.timestamp ?? 0) >= cutoff);
    if (filtered.length > 0) {
      const step = Math.max(1, Math.floor(filtered.length / 200));
      return filtered.filter((_, i) => i % step === 0);
    }
  }
  return data.slice(-fallbackCount);
}

function getAdvice(opens: number, energyLost: number): { text: string; color: string } {
  if (opens === 0) return { text: 'No door opens recorded yet.', color: 'text-sky-400' };
  if (opens > 30) return { text: `Very high door activity (${opens} opens, ${energyLost.toFixed(3)} kWh lost). Grab everything in one trip.`, color: 'text-red-400' };
  if (opens > 15) return { text: `Moderate door activity (${opens} opens, ${energyLost.toFixed(3)} kWh lost). Plan meals ahead.`, color: 'text-yellow-400' };
  return { text: `Good habits — only ${opens} door opens, ${energyLost.toFixed(3)} kWh lost total.`, color: 'text-emerald-400' };
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function rssiInfo(rssi: number): { label: string; color: string } {
  if (rssi >= -60) return { label: 'Strong', color: 'text-emerald-400' };
  if (rssi >= -75) return { label: 'Fair', color: 'text-yellow-400' };
  return { label: 'Weak', color: 'text-red-400' };
}

interface EnvironmentViewProps {
  sensorData: SensorData;
  energyHistory: EnergyData[];
  temperatureHistory: ChartDataPoint[];
  humidityHistory: ChartDataPoint[];
  pressureHistory: ChartDataPoint[];
  targetTemp: number;
  goalTemp: number;
  aiAdjusted: boolean;
  aiReason: string | null;
  servoAngle: number;
  doorOpenCount: number;
  totalEnergyLost: number;
  doorAlarmActive: boolean;
  diagnostics: HardwareDiagnostics;
  darkMode: boolean;
  theme: Theme;
}

const ENERGY_PER_OPEN = 0.012;

export function EnvironmentView({
  sensorData, energyHistory, temperatureHistory, humidityHistory, pressureHistory,
  targetTemp, goalTemp, aiAdjusted, aiReason, servoAngle,
  doorOpenCount, totalEnergyLost, doorAlarmActive, diagnostics,
  darkMode, theme,
}: EnvironmentViewProps) {
  const [range, setRange] = useState<TimeRange>('1H');

  const fTemp     = useMemo(() => filterByRange(temperatureHistory, range, RANGE_COUNTS[range]), [temperatureHistory, range]);
  const fHum      = useMemo(() => filterByRange(humidityHistory,    range, RANGE_COUNTS[range]), [humidityHistory, range]);
  const fPressure = useMemo(() => filterByRange(pressureHistory,    range, RANGE_COUNTS[range]), [pressureHistory, range]);
  const fEnergy   = useMemo(() => filterByRange(energyHistory,      range, 100),                 [energyHistory, range]);

  const advice   = getAdvice(doorOpenCount, totalEnergyLost);
  const servoPct = Math.round((servoAngle / 180) * 100);
  const valveState = servoAngle > 100 ? 'Cooling hard' : servoAngle > 80 ? 'Holding steady' : 'Idle';
  const RANGES: TimeRange[] = ['1H', '24H', '7D'];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-3 flex items-center gap-2`}><Thermometer className="w-5 h-5" /> Temperature</h3>
          <div className="text-center mb-2">
            <div className={`text-5xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted} animate-number-pop`}>
              {sensorData.connected ? `${sensorData.temperature.toFixed(1)}°C` : '—'}
            </div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>Target {targetTemp.toFixed(1)}°C · Optimal range 1–4°C</div>
          </div>
          <div className="h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-red-500 rounded-full" />
        </Card>

        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-3 flex items-center gap-2`}><Droplets className="w-5 h-5" /> Humidity</h3>
          <div className="text-center mb-2">
            <div className={`text-5xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted} animate-number-pop`}>
              {sensorData.connected ? `${Math.round(sensorData.humidity)}%` : '—'}
            </div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>Optimal range 45–65%</div>
          </div>
          <div className="h-2 bg-gradient-to-r from-yellow-500 via-emerald-500 to-blue-500 rounded-full" />
        </Card>
      </div>

      {/* Hardware diagnostics — real fault detection reported by the firmware,
          not just an overall connected/offline flag. */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-3 flex items-center gap-2`}><Wifi className="w-5 h-5" /> Hardware diagnostics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'DHT22 sensor', ok: diagnostics.dhtOK },
            { label: 'HX711 scale',  ok: diagnostics.hxOK  },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 text-center ${darkMode ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
              {s.ok === null ? <HelpCircle className={`w-5 h-5 mx-auto ${theme.textMuted}`} />
                : s.ok ? <CheckCircle className="w-5 h-5 mx-auto text-emerald-400" />
                : <XCircle className="w-5 h-5 mx-auto text-red-400" />}
              <p className={`text-xs mt-1 ${theme.textMuted}`}>{s.label}</p>
              <p className={`text-xs font-medium ${s.ok === null ? theme.textMuted : s.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {s.ok === null ? 'No data' : s.ok ? 'OK' : 'Fault'}
              </p>
            </div>
          ))}

          <div className={`rounded-lg p-3 text-center ${darkMode ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
            <Wifi className={`w-5 h-5 mx-auto ${diagnostics.rssi !== null ? rssiInfo(diagnostics.rssi).color : theme.textMuted}`} />
            <p className={`text-xs mt-1 ${theme.textMuted}`}>WiFi signal</p>
            <p className={`text-xs font-medium ${diagnostics.rssi !== null ? rssiInfo(diagnostics.rssi).color : theme.textMuted}`}>
              {diagnostics.rssi !== null ? `${rssiInfo(diagnostics.rssi).label} (${diagnostics.rssi} dBm)` : 'No data'}
            </p>
          </div>

          <div className={`rounded-lg p-3 text-center ${darkMode ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
            <Clock3 className={`w-5 h-5 mx-auto ${theme.textMuted}`} />
            <p className={`text-xs mt-1 ${theme.textMuted}`}>Device uptime</p>
            <p className={`text-xs font-medium ${theme.text}`}>{diagnostics.uptimeSec !== null ? formatUptime(diagnostics.uptimeSec) : 'No data'}</p>
          </div>
        </div>
      </Card>

      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-3 flex items-center gap-2`}><Gauge className="w-5 h-5" /> Cooling system</h3>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div><p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Actual</p><p className={`text-xl font-bold ${theme.text}`}>{sensorData.temperature.toFixed(1)}°C</p></div>
          <div><p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Your target</p><p className={`text-xl font-bold ${theme.accent}`}>{targetTemp.toFixed(1)}°C</p></div>
          <div><p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Goal sent to fridge</p><p className={`text-xl font-bold ${aiAdjusted ? 'text-purple-400' : theme.accent}`}>{goalTemp.toFixed(1)}°C</p></div>
        </div>

        {aiAdjusted && (
          <div className={`mb-4 p-2.5 rounded-lg text-xs flex items-start gap-2 ${darkMode ? 'bg-purple-950/30 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
            <span className={theme.text}>The AI model lowered the goal below your target: {aiReason}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Gauge className={`w-4 h-4 flex-shrink-0 ${theme.textMuted}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-0.5"><span className={theme.textMuted}>Cooling valve — {valveState}</span><span className={theme.text}>{servoAngle}°</span></div>
              <div className={`h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${servoPct}%` }} /></div>
              <div className={`flex justify-between text-[10px] mt-0.5 ${theme.textMuted}`}><span>0° closed</span><span>90° neutral</span><span>180° open</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className={`w-4 h-4 flex-shrink-0 ${doorAlarmActive ? 'text-red-400 animate-pulse' : theme.textMuted}`} />
            <span className={`text-xs ${doorAlarmActive ? 'text-red-400 font-medium' : theme.textMuted}`}>
              {doorAlarmActive ? 'Buzzer sounding — door open over 30s' : sensorData.doorOpen ? 'Door open, buzzer armed' : 'Door closed, buzzer idle'}
            </span>
          </div>
        </div>

        <p className={`text-xs ${theme.textMuted} mt-3 flex items-start gap-1.5`}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          The servo simulates a cooling valve: its angle is <code className="font-mono">90 + (actual − goal) × 15</code>, clamped 0–180°.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className={`${theme.card} text-center card-hover`}>
          <DoorOpen className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          <div className={`text-3xl font-bold ${theme.text}`}>{doorOpenCount}</div>
          <div className={`text-sm ${theme.textMuted} mt-1`}>Door opens</div>
          <div className={`text-xs ${theme.textMuted}`}>{(doorOpenCount * ENERGY_PER_OPEN).toFixed(3)} kWh cost</div>
        </Card>
        <Card className={`${theme.card} text-center card-hover`}>
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className={`text-3xl font-bold ${theme.text}`}>{totalEnergyLost.toFixed(3)}</div>
          <div className={`text-sm ${theme.textMuted} mt-1`}>kWh lost</div>
          <div className={`text-xs ${theme.textMuted}`}>≈ ${(totalEnergyLost * 0.15).toFixed(2)} estimated</div>
        </Card>
      </div>

      <Card className={`${theme.card} border-sky-500/20`}>
        <h3 className={`font-semibold ${theme.text} mb-2 flex items-center gap-2`}><Lightbulb className="w-5 h-5 text-yellow-400" /> Energy insight</h3>
        <p className={`text-sm ${advice.color}`}>{advice.text}</p>
      </Card>

      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${theme.text}`}>Range:</span>
        <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 text-xs font-medium transition-all ${range === r ? 'bg-sky-500 text-white' : `${theme.textMuted} ${theme.hover}`}`}>{r}</button>
          ))}
        </div>
        <span className={`text-xs ${theme.textMuted}`}>{fTemp.length} points shown</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: 'Temperature history', data: fTemp, Chart: TempChart },
          { title: 'Humidity history', data: fHum, Chart: HumidityChart },
          { title: 'Weight / load history', data: fPressure, Chart: PressureChart },
        ].map(({ title, data, Chart }) => (
          <Card key={title} className={theme.card}>
            <h3 className={`text-base font-bold ${theme.text} mb-4`}>{title}</h3>
            {data.length === 0 ? <div className={`flex items-center justify-center h-32 text-sm ${theme.textMuted}`}>No data yet for this range.</div> : <Chart data={data} darkMode={darkMode} />}
          </Card>
        ))}
        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-4`}>Door opens & cumulative energy</h3>
          {fEnergy.length === 0 ? <div className={`flex items-center justify-center h-32 text-sm ${theme.textMuted}`}>No door events in this range yet.</div> : <EnergyChart data={fEnergy} darkMode={darkMode} />}
        </Card>
      </div>
    </div>
  );
}