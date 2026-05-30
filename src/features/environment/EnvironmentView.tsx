import React, { useState, useMemo } from 'react';
import { Thermometer, Droplets, Zap, DoorOpen, Lightbulb } from 'lucide-react';
import { Card }        from '../../components/ui/Card';
import { EnergyChart } from '../../components/charts/EnergyChart';
import { SensorData, EnergyData } from '../../types';

type TimeRange = '1H' | '24H' | '7D';

const RANGE_MS: Record<TimeRange, number> = {
  '1H':  3_600_000,
  '24H': 86_400_000,
  '7D':  604_800_000,
};
const RANGE_COUNTS: Record<TimeRange, number> = { '1H': 30, '24H': 120, '7D': 500 };

function filterEnergy(data: EnergyData[], range: TimeRange): EnergyData[] {
  if (data.length === 0) return [];
  const withTs = data.filter(p => p.timestamp && p.timestamp > 1_000_000);
  if (withTs.length > 0) {
    const cutoff   = Date.now() - RANGE_MS[range];
    const filtered = withTs.filter(p => (p.timestamp ?? 0) >= cutoff);
    if (filtered.length > 0) {
      const step = Math.max(1, Math.floor(filtered.length / 100));
      return filtered.filter((_, i) => i % step === 0);
    }
  }
  return data.slice(-RANGE_COUNTS[range]);
}

function getAdvice(opens: number, energyLost: number): { text: string; color: string } {
  if (opens === 0) return { text: 'No door opens recorded yet.', color: 'text-sky-400' };
  if (opens > 30) return {
    text: `Very high door activity (${opens} opens, ${energyLost.toFixed(3)} kWh lost). Grab everything in one trip.`,
    color: 'text-red-400',
  };
  if (opens > 15) return {
    text: `Moderate door activity (${opens} opens, ${energyLost.toFixed(3)} kWh lost). Plan meals ahead.`,
    color: 'text-yellow-400',
  };
  return {
    text: `Good habits! Only ${opens} door opens — ${energyLost.toFixed(3)} kWh lost total.`,
    color: 'text-emerald-400',
  };
}

interface EnvironmentViewProps {
  sensorData:      SensorData;
  energyHistory:   EnergyData[];
  doorOpenCount:   number;
  totalEnergyLost: number;
  darkMode:        boolean;
  theme:           { card: string; text: string; textMuted: string; accent: string; hover: string };
}

const ENERGY_PER_OPEN = 0.012;

export function EnvironmentView({
  sensorData, energyHistory,
  doorOpenCount, totalEnergyLost,
  darkMode, theme,
}: EnvironmentViewProps) {
  const [chartRange, setChartRange] = useState<TimeRange>('1H');

  const filteredEnergy = useMemo(
    () => filterEnergy(energyHistory, chartRange),
    [energyHistory, chartRange]
  );

  const advice = getAdvice(doorOpenCount, totalEnergyLost);
  const RANGES: TimeRange[] = ['1H', '24H', '7D'];

  // Sensor insight helpers
  const tempStatus =
    sensorData.temperature > 8   ? { label: 'Too warm',  color: 'text-red-400'    }
    : sensorData.temperature < 0 ? { label: 'Too cold',  color: 'text-blue-400'   }
    :                               { label: 'Optimal',   color: 'text-emerald-400' };

  const humStatus =
    sensorData.humidity > 75 ? { label: 'High',    color: 'text-yellow-400'  }
    : sensorData.humidity < 30 ? { label: 'Low',   color: 'text-yellow-400'  }
    :                             { label: 'Good',  color: 'text-emerald-400' };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">

      {/* Live cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-3 flex items-center gap-2`}>
            <Thermometer className="w-5 h-5" /> Temperature
          </h3>
          <div className="text-center mb-3">
            <div className={`text-5xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted} mb-1 animate-number-pop`}>
              {sensorData.connected ? `${sensorData.temperature.toFixed(1)}°C` : '—'}
            </div>
            <div className={`text-xs ${sensorData.connected ? tempStatus.color : theme.textMuted} font-medium`}>
              {sensorData.connected ? tempStatus.label : 'Sensor offline'}
            </div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>Optimal range: 1–4°C</div>
          </div>
          <div className="h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-red-500 rounded-full" />
          {sensorData.connected && sensorData.temperature > 8 && (
            <p className="text-xs text-red-400 mt-2 text-center animate-slide-up">
              ⚠️ Consider checking the compressor
            </p>
          )}
        </Card>

        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-3 flex items-center gap-2`}>
            <Droplets className="w-5 h-5" /> Humidity
          </h3>
          <div className="text-center mb-3">
            <div className={`text-5xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted} mb-1 animate-number-pop`}>
              {sensorData.connected ? `${Math.round(sensorData.humidity)}%` : '—'}
            </div>
            <div className={`text-xs ${sensorData.connected ? humStatus.color : theme.textMuted} font-medium`}>
              {sensorData.connected ? humStatus.label : 'Sensor offline'}
            </div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>Optimal range: 45–65%</div>
          </div>
          <div className="h-2 bg-gradient-to-r from-yellow-500 via-emerald-500 to-blue-500 rounded-full" />
        </Card>
      </div>

      {/* Energy counters */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={`${theme.card} text-center card-hover`}>
          <DoorOpen className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          <div className={`text-3xl font-bold ${theme.text}`}>{doorOpenCount}</div>
          <div className={`text-sm ${theme.textMuted} mt-1`}>Door Opens</div>
          <div className={`text-xs ${theme.textMuted}`}>{(doorOpenCount * ENERGY_PER_OPEN).toFixed(3)} kWh cost</div>
        </Card>
        <Card className={`${theme.card} text-center card-hover`}>
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className={`text-3xl font-bold ${theme.text}`}>{totalEnergyLost.toFixed(3)}</div>
          <div className={`text-sm ${theme.textMuted} mt-1`}>kWh Energy Lost</div>
          <div className={`text-xs ${theme.textMuted}`}>≈ ${(totalEnergyLost * 0.15).toFixed(2)} estimated</div>
        </Card>
      </div>

      {/* Insight */}
      <Card className={`${theme.card} border-sky-500/20`}>
        <h3 className={`font-semibold ${theme.text} mb-2 flex items-center gap-2`}>
          <Lightbulb className="w-5 h-5 text-yellow-400" /> Energy Insight
        </h3>
        <p className={`text-sm ${advice.color}`}>{advice.text}</p>
        {doorOpenCount > 0 && (
          <p className={`text-xs ${theme.textMuted} mt-2`}>
            Each opening costs ~{ENERGY_PER_OPEN.toFixed(3)} kWh · Total: {totalEnergyLost.toFixed(3)} kWh
          </p>
        )}
      </Card>

      {/* Time range selector */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${theme.text}`}>Range:</span>
        <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setChartRange(r)}
              className={`px-3 py-1 text-xs font-medium transition-all ${
                chartRange === r
                  ? 'bg-sky-500 text-white'
                  : `${theme.textMuted} ${theme.hover}`
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Energy chart */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4`}>Door Opens & Cumulative Energy</h3>
        {filteredEnergy.length === 0 ? (
          <div className={`flex items-center justify-center h-40 ${theme.textMuted} text-sm`}>
            No door events in this range yet — open the fridge to record data.
          </div>
        ) : (
          <EnergyChart data={filteredEnergy} darkMode={darkMode} />
        )}
      </Card>
    </div>
  );
}