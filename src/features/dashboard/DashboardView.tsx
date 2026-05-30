import React, { useState, useMemo } from 'react';
import {
  AlertCircle, Trash2, Zap, Wifi, WifiOff,
  Clock, Settings, Plus, Minus, Bell, CheckCircle2, X,
} from 'lucide-react';
import { Card }             from '../../components/ui/Card';
import { StatCard }         from '../../components/ui/StatCard';
import { TempChart }        from '../../components/charts/TempChart';
import { HumidityChart }    from '../../components/charts/HumidityChart';
import { PressureChart }    from '../../components/charts/PressureChart';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { EnhancedAlert }    from '../../hooks/useAlerts';
import { SensorData, InventoryItem, ChartDataPoint, ConsumptionData } from '../../types';
import { modes } from '../../data/modes';

type TimeRange = '1H' | '24H' | '7D';

const RANGE_MS: Record<TimeRange, number> = {
  '1H':  3_600_000,
  '24H': 86_400_000,
  '7D':  604_800_000,
};
const RANGE_COUNTS: Record<TimeRange, number> = { '1H': 30, '24H': 120, '7D': 500 };

function filterByRange(data: ChartDataPoint[], range: TimeRange): ChartDataPoint[] {
  if (data.length === 0) return [];
  const withTs = data.filter(p => p.timestamp && p.timestamp > 1_000_000);
  if (withTs.length > 0) {
    const cutoff   = Date.now() - RANGE_MS[range];
    const filtered = withTs.filter(p => (p.timestamp ?? 0) >= cutoff);
    if (filtered.length > 0) {
      const step = Math.max(1, Math.floor(filtered.length / 200));
      return filtered.filter((_, i) => i % step === 0);
    }
  }
  // Fallback: show last N points — range buttons still change what's visible
  return data.slice(-RANGE_COUNTS[range]);
}

interface DashboardViewProps {
  sensorData:          SensorData;
  alerts:              EnhancedAlert[];
  inventory:           InventoryItem[];
  temperatureHistory:  ChartDataPoint[];
  humidityHistory:     ChartDataPoint[];
  pressureHistory:     ChartDataPoint[];
  consumptionHistory:  ConsumptionData[];
  totalConsumed:       number;
  totalWasted:         number;
  currentMode:         string;
  setCurrentMode:      (m: string) => void;
  adjustTemperature:   (c: number) => void;
  onDismissAlert:      (id: number) => void;
  onDismissAll:        () => void;
  darkMode:            boolean;
  theme:               { bg: string; card: string; text: string; textMuted: string; accent: string; hover: string };
}

const severityStyles = {
  critical: { bg: 'bg-red-500/10 border-red-500/30',    icon: '🚨', text: 'text-red-400'    },
  warning:  { bg: 'bg-yellow-500/10 border-yellow-500/30', icon: '⚠️', text: 'text-yellow-400' },
  info:     { bg: 'bg-blue-500/10 border-blue-500/30',   icon: 'ℹ️', text: 'text-blue-400'   },
} as const;

export function DashboardView({
  sensorData, alerts, inventory,
  temperatureHistory, humidityHistory, pressureHistory,
  consumptionHistory, totalConsumed, totalWasted,
  currentMode, setCurrentMode, adjustTemperature,
  onDismissAlert, onDismissAll,
  darkMode, theme,
}: DashboardViewProps) {
  const [chartRange, setChartRange] = useState<TimeRange>('1H');

  const filteredTemp     = useMemo(() => filterByRange(temperatureHistory, chartRange), [temperatureHistory, chartRange]);
  const filteredHum      = useMemo(() => filterByRange(humidityHistory,    chartRange), [humidityHistory,    chartRange]);
  const filteredPressure = useMemo(() => filterByRange(pressureHistory,    chartRange), [pressureHistory,    chartRange]);

  const RANGES: TimeRange[] = ['1H', '24H', '7D'];

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const hasIssues = criticalAlerts.length > 0 || alerts.length > 0;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">

      {/* Connection status */}
      <Card className={`${theme.card} ${sensorData.connected ? 'border-emerald-500/40' : 'border-red-500/40'} animate-slide-down`}>
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
              <p className={`text-xs flex items-center gap-1 mt-0.5 ${theme.textMuted}`}>
                <Clock className="w-3 h-3" />
                {sensorData.lastUpdate
                  ? `Updated: ${new Date(sensorData.lastUpdate).toLocaleTimeString()}`
                  : 'No data received yet'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex md:gap-6 gap-3">
            {[
              { label: 'Temperature', val: `${sensorData.temperature.toFixed(1)}°C`, color: '' },
              { label: 'Humidity',    val: `${Math.round(sensorData.humidity)}%`,    color: '' },
              { label: 'Door',        val: sensorData.doorOpen ? 'OPEN' : 'CLOSED',
                color: sensorData.doorOpen ? 'text-red-400' : 'text-emerald-400' },
              { label: 'Load',        val: `${sensorData.pressure.toFixed(1)} kg`,   color: '' },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${color || (sensorData.connected ? theme.accent : theme.textMuted)}`}>
                  {val}
                </div>
                <div className={`text-xs ${theme.textMuted}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Alerts panel */}
      {hasIssues && (
        <Card className={`${theme.card} ${criticalAlerts.length > 0 ? 'border-red-500/30' : 'border-yellow-500/30'} animate-slide-down`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
              <Bell className="w-5 h-5 text-yellow-400" />
              Alerts ({alerts.length})
              {criticalAlerts.length > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {criticalAlerts.length} critical
                </span>
              )}
            </h3>
            {alerts.length > 1 && (
              <button
                onClick={onDismissAll}
                className={`text-xs ${theme.textMuted} hover:${theme.text} transition-colors`}
              >
                Dismiss all
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map(alert => {
              const style = severityStyles[alert.severity ?? 'warning'];
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} animate-slide-down`}>
                  <span className="text-base flex-shrink-0">{alert.icon || style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${theme.text}`}>{alert.message}</p>
                    {alert.formula && (
                      <p className={`text-xs font-mono mt-0.5 ${theme.textMuted}`}>{alert.formula}</p>
                    )}
                    <p className={`text-xs ${theme.textMuted} mt-0.5`}>{alert.timestamp.toLocaleTimeString()}</p>
                  </div>
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className={`flex-shrink-0 p-1 rounded-lg hover:bg-slate-700/50 transition-colors ${theme.textMuted} hover:text-white`}
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Temperature control */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4`}>Temperature Setpoint</h3>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => adjustTemperature(-0.5)}
            className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors active:scale-95"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className={`text-4xl font-bold ${theme.accent} animate-number-pop`}>
              {sensorData.temperature.toFixed(1)}°C
            </div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>
              {sensorData.temperature <= 4 ? '✅ In optimal range' : '⚠️ Above optimal (1–4°C)'}
            </div>
          </div>
          <button
            onClick={() => adjustTemperature(0.5)}
            className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          value={inventory.filter(i => i.expiry <= 3).length.toString()}
          label="Near Expiry"
          badge={{ text: `${inventory.filter(i => i.expiry <= 1).length} URGENT`, color: 'bg-red-500/20 text-red-400' }}
          theme={theme}
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          value={String(totalConsumed)}
          label="Items Consumed"
          badge={{ text: 'TRACKED', color: 'bg-emerald-500/20 text-emerald-400' }}
          theme={theme}
        />
        <StatCard
          icon={<Trash2 className="w-6 h-6 text-red-400" />}
          value={String(totalWasted)}
          label="Items Wasted"
          badge={totalWasted > 5
            ? { text: 'HIGH WASTE', color: 'bg-red-500/20 text-red-400' }
            : { text: 'LOW WASTE',  color: 'bg-emerald-500/20 text-emerald-400' }}
          theme={theme}
        />
        <StatCard
          icon={<Zap className="w-6 h-6 text-yellow-400" />}
          value={String(inventory.length)}
          label="Total Items"
          badge={{ text: 'IN FRIDGE', color: 'bg-sky-500/20 text-sky-400' }}
          theme={theme}
        />
      </div>

      {/* Mode */}
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
                onClick={() => setCurrentMode(mode.id)}
                className={`p-2 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                  currentMode === mode.id
                    ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/20'
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

      {/* Chart range selector */}
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
        <span className={`text-xs ${theme.textMuted}`}>
          {filteredTemp.length} data points shown
        </span>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: 'Temperature History',       data: filteredTemp,     Chart: TempChart     },
          { title: 'Humidity History',          data: filteredHum,      Chart: HumidityChart  },
          { title: 'Weight / Load History',     data: filteredPressure, Chart: PressureChart  },
        ].map(({ title, data, Chart }) => (
          <Card key={title} className={theme.card}>
            <h3 className={`text-base font-bold ${theme.text} mb-4`}>{title}</h3>
            {data.length === 0 ? (
              <div className={`flex items-center justify-center h-32 text-sm ${theme.textMuted}`}>
                No data yet — connect ESP32 to record readings.
              </div>
            ) : (
              <Chart data={data} darkMode={darkMode} />
            )}
          </Card>
        ))}

        <Card className={theme.card}>
          <h3 className={`text-base font-bold ${theme.text} mb-4`}>Weekly Consumption</h3>
          <ConsumptionChart data={consumptionHistory} darkMode={darkMode} />
        </Card>
      </div>
    </div>
  );
}