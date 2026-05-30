import React, { useState, useMemo } from 'react';
import { Thermometer, Droplets, Zap, DoorOpen, Lightbulb } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { EnergyChart } from '../../components/charts/EnergyChart';
import { SensorData, EnergyData } from '../../types';

type TimeRange = '1H' | '24H' | '7D';

function filterEnergy(data: EnergyData[], range: TimeRange): EnergyData[] {
  const now = Date.now();
  const ms: Record<TimeRange, number> = {
    '1H': 3_600_000,
    '24H': 86_400_000,
    '7D': 604_800_000
  };
  const cutoff = now - ms[range];
  const filtered = data.filter(p => (p.timestamp ?? 0) >= cutoff);
  const step = Math.max(1, Math.floor(filtered.length / 100));
  return filtered.filter((_, i) => i % step === 0);
}

function getAdvice(doorOpenCount: number, totalEnergyLost: number): { text: string; color: string } {
  if (doorOpenCount === 0) {
    return { text: 'No door opens recorded yet. Start using your fridge to see energy insights.', color: 'text-sky-400' };
  }
  if (doorOpenCount > 30) {
    return {
      text: `⚠️ Very high door activity (${doorOpenCount} opens, ${totalEnergyLost.toFixed(3)} kWh lost). Grab everything you need in one visit to save significant energy.`,
      color: 'text-red-400'
    };
  }
  if (doorOpenCount > 15) {
    return {
      text: `⚡ Moderate door activity (${doorOpenCount} opens, ${totalEnergyLost.toFixed(3)} kWh lost). Try planning your meals ahead to reduce unnecessary opens.`,
      color: 'text-yellow-400'
    };
  }
  return {
    text: `✅ Good energy habits! Only ${doorOpenCount} door opens, with ${totalEnergyLost.toFixed(3)} kWh lost total. Keep it up!`,
    color: 'text-emerald-400'
  };
}

interface EnvironmentViewProps {
  sensorData: SensorData;
  energyHistory: EnergyData[];
  doorOpenCount: number;
  totalEnergyLost: number;
  darkMode: boolean;
  theme: any;
}

export function EnvironmentView({
  sensorData, energyHistory,
  doorOpenCount, totalEnergyLost,
  darkMode, theme
}: EnvironmentViewProps) {
  const [chartRange, setChartRange] = useState<TimeRange>('1H');

  const filteredEnergy = useMemo(() => filterEnergy(energyHistory, chartRange), [energyHistory, chartRange]);

  const RANGES: TimeRange[] = ['1H', '24H', '7D'];
  const advice = getAdvice(doorOpenCount, totalEnergyLost);

  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
    borderRadius: '12px'
  };

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Live Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
            <Thermometer className="w-5 h-5" /> Temperature
          </h3>
          <div className="text-center mb-4">
            <div className={`text-5xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted} mb-2`}>
              {sensorData.connected ? `${sensorData.temperature.toFixed(1)}°C` : '—'}
            </div>
            <div className={`text-xs ${theme.textMuted}`}>
              {sensorData.connected ? 'Live from ESP32' : 'ESP32 offline — last known value shown'}
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full" />
        </Card>

        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
            <Droplets className="w-5 h-5" /> Humidity
          </h3>
          <div className="text-center mb-4">
            <div className={`text-5xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted} mb-2`}>
              {sensorData.connected ? `${Math.round(sensorData.humidity)}%` : '—'}
            </div>
            <div className={`text-xs ${theme.textMuted}`}>
              {sensorData.connected ? 'Live from ESP32' : 'ESP32 offline — last known value shown'}
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-yellow-500 via-green-500 to-blue-500 rounded-full" />
        </Card>
      </div>

      {/* Energy Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={`${theme.card} text-center`}>
          <DoorOpen className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          <div className={`text-3xl font-bold ${theme.text}`}>{doorOpenCount}</div>
          <div className={`text-sm ${theme.textMuted} mt-1`}>Total Door Opens</div>
        </Card>
        <Card className={`${theme.card} text-center`}>
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className={`text-3xl font-bold ${theme.text}`}>{totalEnergyLost.toFixed(3)}</div>
          <div className={`text-sm ${theme.textMuted} mt-1`}>kWh Energy Lost</div>
        </Card>
      </div>

      {/* AI Advice */}
      <Card className={`${theme.card} border-sky-500/30`}>
        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
          <Lightbulb className="w-5 h-5 text-yellow-400" /> Energy Insight
        </h3>
        <p className={`text-sm ${advice.color}`}>{advice.text}</p>
        {doorOpenCount > 0 && (
          <p className={`text-xs ${theme.textMuted} mt-2`}>
            Average energy per open: {(ENERGY_PER_OPEN_CONST).toFixed(3)} kWh | Each opening adds ~0.012 kWh to your bill.
          </p>
        )}
      </Card>

      {/* Time Range Selector */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${theme.text}`}>Chart range:</span>
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

      {/* Energy & Door Chart */}
      <Card className={theme.card}>
        <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>
          Door Opens & Cumulative Energy Lost
        </h3>
        {filteredEnergy.length === 0 ? (
          <div className={`flex items-center justify-center h-48 ${theme.textMuted} text-sm`}>
            No door open events recorded in this time range yet.
          </div>
        ) : (
          <EnergyChart data={filteredEnergy} darkMode={darkMode} />
        )}
      </Card>

    </div>
  );
}

const ENERGY_PER_OPEN_CONST = 0.012;