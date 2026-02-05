import React from 'react';
import { AlertCircle, TrendingUp, Zap, DollarSign, Thermometer, Plus, Minus, Bell, Settings, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { TempChart } from '../../components/charts/TempChart';
import { HumidityChart } from '../../components/charts/HumidityChart';
import { PressureChart } from '../../components/charts/PressureChart';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { DistributionChart } from '../../components/charts/DistributionChart';
import { SensorData, Alert, InventoryItem, ChartDataPoint } from '../../types';
import { consumptionData } from '../../data/demoConsumption';
import { categoryDistribution } from '../../data/categoryDistribution';
import { modes } from '../../data/modes';

interface DashboardViewProps {
  sensorData: SensorData;
  alerts: Alert[];
  inventory: InventoryItem[];
  temperatureHistory: ChartDataPoint[];
  humidityHistory: ChartDataPoint[];
  pressureHistory: ChartDataPoint[];
  currentMode: string;
  setCurrentMode: (mode: string) => void;
  adjustTemperature: (change: number) => void;
  darkMode: boolean;
  theme: any;
}

export function DashboardView({ 
  sensorData, 
  alerts, 
  inventory, 
  temperatureHistory, 
  humidityHistory, 
  pressureHistory,
  currentMode,
  setCurrentMode,
  adjustTemperature,
  darkMode, 
  theme 
}: DashboardViewProps) {
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
                {sensorData.connected ? '✓ ESP32 Connected - Live Data' : '✗ Waiting for ESP32 Connection'}
              </h3>
              <p className={`text-xs ${theme.textMuted}`}>
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
              <div className={`text-xs ${theme.textMuted}`}>Real-time Temp</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.connected ? theme.accent : theme.textMuted}`}>
                {Math.round(sensorData.humidity)}%
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Live Humidity</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.doorOpen ? 'text-red-400' : 'text-emerald-400'}`}>
                {sensorData.doorOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Door Status</div>
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
            <Bell className="w-5 h-5 text-yellow-400" />
            Recent Alerts
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
        <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
          <Thermometer className="w-5 h-5" /> Temperature Control (Demo)
        </h3>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => adjustTemperature(-0.5)}
            className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className={`text-4xl font-bold ${theme.accent}`}>{sensorData.temperature.toFixed(1)}°C</div>
            <div className={`text-sm ${theme.textMuted} mt-1`}>Target Temperature</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<AlertCircle className="w-6 md:w-8 h-6 md:h-8" />}
          value={inventory.filter(i => i.expiry <= 3).length.toString()}
          label="Items Near Expiry"
          badge={{ text: `${inventory.filter(i => i.expiry <= 2).length} URGENT`, color: 'bg-red-500/20 text-red-400' }}
          theme={theme}
        />
        <StatCard
          icon={<TrendingUp className="w-6 md:w-8 h-6 md:h-8" />}
          value="8.5kg"
          label="Waste Prevented"
          badge={{ text: '-23%', color: 'bg-emerald-500/20 text-emerald-400' }}
          theme={theme}
        />
        <StatCard
          icon={<Zap className="w-6 md:w-8 h-6 md:h-8" />}
          value="52 kWh"
          label="Energy This Week"
          badge={{ text: 'OPTIMAL', color: 'bg-sky-500/20 text-sky-400' }}
          theme={theme}
        />
        <StatCard
          icon={<DollarSign className="w-6 md:w-8 h-6 md:h-8" />}
          value="$187"
          label="Monthly Budget"
          badge={{ text: 'SAVED $45', color: 'bg-emerald-500/20 text-emerald-400' }}
          theme={theme}
        />
      </div>

      {/* Mode Selection */}
      <Card className={theme.card}>
        <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
          <Settings className="w-4 md:w-5 h-4 md:h-5" /> Active Mode
        </h3>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setCurrentMode(mode.id);
                  try {
                    localStorage.setItem('current-mode', mode.id);
                  } catch (error) {
                    console.error('Failed to save mode');
                  }
                }}
                className={`p-2 md:p-4 rounded-xl border-2 transition-all ${
                  currentMode === mode.id 
                    ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/30' 
                    : `border-transparent ${theme.hover}`
                }`}
              >
                <Icon className={`w-4 md:w-6 h-4 md:h-6 mx-auto mb-1 md:mb-2 ${currentMode === mode.id ? 'text-sky-400' : theme.textMuted}`} />
                <div className={`text-xs font-medium ${currentMode === mode.id ? theme.text : theme.textMuted}`}>
                  {mode.name}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Real-time Sensor Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>Real-time Temperature</h3>
          <TempChart data={temperatureHistory} darkMode={darkMode} />
        </Card>

        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>Real-time Humidity</h3>
          <HumidityChart data={humidityHistory} darkMode={darkMode} />
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>Weekly Consumption</h3>
          <ConsumptionChart data={consumptionData} darkMode={darkMode} />
        </Card>

        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>Load Tracking</h3>
          <PressureChart data={pressureHistory} darkMode={darkMode} />
        </Card>
      </div>

      {/* Storage Distribution */}
      <Card className={theme.card}>
        <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>Storage Distribution</h3>
        <DistributionChart data={categoryDistribution} darkMode={darkMode} />
        <div className="grid grid-cols-3 gap-2 mt-4">
          {categoryDistribution.map(cat => (
            <div key={cat.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className={`text-xs ${theme.textMuted}`}>{cat.name}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}