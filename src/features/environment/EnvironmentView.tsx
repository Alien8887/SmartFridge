import React from 'react';
import { Thermometer, Droplets } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { EnergyChart } from '../../components/charts/EnergyChart';
import { SensorData } from '../../types';
import { energyData } from '../../data/demoEnergy';

interface EnvironmentViewProps {
  sensorData: SensorData;
  darkMode: boolean;
  theme: any;
}

export function EnvironmentView({ sensorData, darkMode, theme }: EnvironmentViewProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4 md:mb-6 flex items-center gap-2`}>
            <Thermometer className="w-4 md:w-5 h-4 md:h-5" /> Temperature (Real Sensor)
          </h3>
          <div className="text-center mb-6">
            <div className={`text-4xl md:text-5xl font-bold ${theme.accent} mb-2`}>{sensorData.temperature.toFixed(1)}°C</div>
            <div className={`text-xs md:text-sm ${theme.textMuted}`}>
              {sensorData.connected ? 'Live from ESP32' : 'Waiting for data...'}
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full" />
        </Card>

        <Card className={theme.card}>
          <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4 md:mb-6 flex items-center gap-2`}>
            <Droplets className="w-4 md:w-5 h-4 md:h-5" /> Humidity (Real Sensor)
          </h3>
          <div className="text-center mb-6">
            <div className={`text-4xl md:text-5xl font-bold ${theme.accent} mb-2`}>{Math.round(sensorData.humidity)}%</div>
            <div className={`text-xs md:text-sm ${theme.textMuted}`}>
              {sensorData.connected ? 'Live from ESP32' : 'Waiting for data...'}
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-yellow-500 via-green-500 to-blue-500 rounded-full" />
        </Card>
      </div>

      <Card className={theme.card}>
        <h3 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>Energy Usage & Door Activity</h3>
        <EnergyChart data={energyData} darkMode={darkMode} />
      </Card>
    </div>
  );
}