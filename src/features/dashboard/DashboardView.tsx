import React, { useState, useMemo } from 'react';
import {
  AlertCircle, Trash2, Zap, Wifi, WifiOff,
  Clock, Settings, Plus, Minus, Bell, CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { TempChart } from '../../components/charts/TempChart';
import { HumidityChart } from '../../components/charts/HumidityChart';
import { PressureChart } from '../../components/charts/PressureChart';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { SensorData, Alert, InventoryItem, ChartDataPoint, ConsumptionData } from '../../types';
import { modes } from '../../data/modes';

type TimeRange = '1H' | '24H' | '7D';

function filterByRange(data: ChartDataPoint[], range: TimeRange): ChartDataPoint[] {
  const now = Date.now();
  const ms: Record<TimeRange, number> = {
    '1H': 3_600_000,
    '24H': 86_400_000,
    '7D': 604_800_000
  };
  const cutoff = now - ms[range];
  const filtered = data.filter(p => (p.timestamp ?? 0) >= cutoff);
  const step = Math.max(1, Math.floor(filtered.length / 200));
  return filtered.filter((_, i) => i % step === 0);
}

interface DashboardViewProps {
  sensorData: SensorData;
  alerts: Alert[];
  inventory: InventoryItem[];
  temperatureHistory: ChartDataPoint[];
  humidityHistory: ChartDataPoint[];
  pressureHistory: ChartDataPoint[];
  consumptionHistory: ConsumptionData[];
  totalConsumed: number;
  totalWasted: number;
  currentMode: string;
  setCurrentMode: (mode: string) => void;
  adjustTemperature: (change: number) => void;
  darkMode: boolean;
  theme: any;
}

export function DashboardView({
  sensorData, alerts, inventory,
  temperatureHistory, humidityHistory, pressureHistory,
  consumptionHistory, totalConsumed, totalWasted,
  currentMode, setCurrentMode, adjustTemperature,
  darkMode, theme
}: DashboardViewProps) {
  const [chartRange, setChartRange] = useState<TimeRange>('1H');

  const filteredTemp     = useMemo(() => filterByRange(temperatureHistory, chartRange), [temperatureHistory, chartRange]);
  const filteredHum      = useMemo(() => filterByRange(humidityHistory,    chartRange), [humidityHistory,    chartRange]);
  const filteredPressure = useMemo(() => filterByRange(pressureHistory,    chartRange), [pressureHistory,    chartRange]);

  const RANGES: TimeRange[] = ['1H', '24H', '7D'];

  const RangeSelector = () => (
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
  );

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Connection Status */}
      <Card className={`${theme.card} ${sensorData.connected ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {sensorData.connected ? (
              <div className="relative">
                <Wifi className="w-6 h-6 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            ) : (
              <WifiOff className="w-6 h-6 text-red-400 animate-pulse" />
            )}
            <div>
              <h3 className={`font-semibold ${theme.text}`}>
                {sensorData.connected ? '✓ ESP32 Connected — Live Data' : '✗ ESP32 Offline'}
              </h3>
              <p className={`text-xs flex items-center gap-1 mt-1 ${theme.textMuted}`}>
                <Clock className="w-3 h-3" />
                {sensorData.lastUpdate
                  ? `Last update: ${new Date(sensorData.lastUpdate).toLocaleTimeString()}`
                  : 'No data received yet'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:flex md:gap-6 gap-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted}`}>
                {sensorData.temperature.toFixed(1)}°C
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Temperature</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted}`}>
                {Math.round(sensorData.humidity)}%
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Humidity</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.doorOpen ? 'text-red-400' : 'text-emerald-400'}`}>
                {sensorData.doorOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Door</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted}`}>
                {sensorData.pressure.toFixed(1)}kg
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Load</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className={`${theme.card} border-yellow-500/50`}>
          <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
            <Bell className="w-5 h-5 text-yellow-400" /> Recent Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-100'}`}>
                <p className={`text-sm ${theme.text}`}>{alert.message}</p>
                <p className={`text-xs ${theme.textMuted}`}>{alert.timestamp.toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Temperature Control */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4 flex items-center gap-2`}>
          Temperature Setpoint (Demo)
        </h3>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => adjustTemperature(-0.5)}
            className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className={`text-4xl font-bold ${theme.accent}`}>
              {sensorData.temperature.toFixed(1)}°C
            </div>
          </div>
          <button
            onClick={() => adjustTemperature(0.5)}
            className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          value={inventory.filter(i => i.expiry <= 3).length.toString()}
          label="Near Expiry"
          badge={{ text: `${inventory.filter(i => i.expiry <= 2).length} URGENT`, color: 'bg-red-500/20 text-red-400' }}
          theme={theme}
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          value={String(totalConsumed)}
          label="Items Consumed"
          badge={{ text: 'REAL DATA', color: 'bg-emerald-500/20 text-emerald-400' }}
          theme={theme}
        />
        <StatCard
          icon={<Trash2 className="w-6 h-6 text-red-400" />}
          value={String(totalWasted)}
          label="Items Wasted"
          badge={totalWasted > 5
            ? { text: 'HIGH WASTE', color: 'bg-red-500/20 text-red-400' }
            : { text: 'GOOD', color: 'bg-emerald-500/20 text-emerald-400' }}
          theme={theme}
        />
        <StatCard
          icon={<Zap className="w-6 h-6 text-yellow-400" />}
          value={`${inventory.length}`}
          label="Total Items"
          badge={{ text: 'IN FRIDGE', color: 'bg-sky-500/20 text-sky-400' }}
          theme={theme}
        />
      </div>

      {/* Mode Selection */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4 flex items-center gap-2`}>
          <Settings className="w-4 h-4" /> Active Mode
        </h3>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setCurrentMode(mode.id);
                  try { localStorage.setItem('current-mode', mode.id); } catch {}
                }}
                className={`p-2 md:p-4 rounded-xl border-2 transition-all ${
                  currentMode === mode.id
                    ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/30'
                    : `border-transparent ${theme.hover}`
                }`}
              >
                <Icon className={`w-4 md:w-6 h-4 md:h-6 mx-auto mb-1 ${currentMode === mode.id ? 'text-sky-400' : theme.textMuted}`} />
                <div className={`text-xs font-medium ${currentMode === mode.id ? theme.text : theme.textMuted}`}>
                  {mode.name}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Time Range Selector */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${theme.text}`}>Chart range:</span>
        <RangeSelector />
      </div>

      {/* Sensor Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-4`}>Temperature History</h3>
          {filteredTemp.length === 0
            ? <p className={`text-sm text-center py-8 ${theme.textMuted}`}>No data for this range yet.</p>
            : <TempChart data={filteredTemp} darkMode={darkMode} />
          }
        </Card>
        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-4`}>Humidity History</h3>
          {filteredHum.length === 0
            ? <p className={`text-sm text-center py-8 ${theme.textMuted}`}>No data for this range yet.</p>
            : <HumidityChart data={filteredHum} darkMode={darkMode} />
          }
        </Card>
        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-4`}>Load / Weight History</h3>
          {filteredPressure.length === 0
            ? <p className={`text-sm text-center py-8 ${theme.textMuted}`}>No data for this range yet.</p>
            : <PressureChart data={filteredPressure} darkMode={darkMode} />
          }
        </Card>
        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-4`}>Weekly Consumption by Category</h3>
          <ConsumptionChart data={consumptionHistory} darkMode={darkMode} />
        </Card>
      </div>

    </div>
  );
}