import { useState, useEffect, useCallback } from 'react';
import { SensorData, ChartDataPoint } from '../types';

export function useESP32Sensors(onAlert: (message: string) => void) {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    doorOpen: false,
    pressure: 0,
    gasLevel: 0,
    lastUpdate: null,
    connected: false
  });

  const [temperatureHistory, setTemperatureHistory] = useState<ChartDataPoint[]>([]);
  const [humidityHistory, setHumidityHistory] = useState<ChartDataPoint[]>([]);
  const [pressureHistory, setPressureHistory] = useState<ChartDataPoint[]>([]);

  const loadStoredHistory = useCallback(() => {
    try {
      const tempHistory = localStorage.getItem('temp-history');
      if (tempHistory) setTemperatureHistory(JSON.parse(tempHistory));

      const humHistory = localStorage.getItem('humidity-history');
      if (humHistory) setHumidityHistory(JSON.parse(humHistory));

      const pressHistory = localStorage.getItem('pressure-history');
      if (pressHistory) setPressureHistory(JSON.parse(pressHistory));
    } catch (error) {
      console.log('No stored history');
    }
  }, []);

  const connectToESP32 = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('https://smart-fridge-two.vercel.app/api/sensors');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        
        const newData: SensorData = {
          temperature: typeof data.temperature === 'number' ? data.temperature : 0,
          humidity: typeof data.humidity === 'number' ? data.humidity : 0,
          doorOpen: Boolean(data.doorOpen),
          pressure: typeof data.weight === 'number' ? Math.abs(data.weight) : typeof data.pressure === 'number' ? Math.abs(data.pressure) : 0,
          gasLevel: typeof data.gasLevel === 'number' ? data.gasLevel : 0,
          lastUpdate: new Date().toISOString(),
          connected: true
        };

        setSensorData(prev => {
          if (prev.connected && prev.temperature !== 0) {
            const tempChange = Math.abs(newData.temperature - prev.temperature);
            const humChange = Math.abs(newData.humidity - prev.humidity);
            
            if (tempChange > 5) {
              onAlert(`Temperature changed by ${tempChange.toFixed(1)}°C!`);
            }
            if (humChange > 20) {
              onAlert(`Humidity changed by ${humChange.toFixed(1)}%!`);
            }
          }
          return newData;
        });

        const timestamp = new Date().toLocaleTimeString();
        
        setTemperatureHistory(prev => {
          const updated = [...prev, { time: timestamp, value: newData.temperature }];
          const limited = updated.slice(-20);
          try {
            localStorage.setItem('temp-history', JSON.stringify(limited));
          } catch (e) {}
          return limited;
        });

        setHumidityHistory(prev => {
          const updated = [...prev, { time: timestamp, value: newData.humidity }];
          const limited = updated.slice(-20);
          try {
            localStorage.setItem('humidity-history', JSON.stringify(limited));
          } catch (e) {}
          return limited;
        });

        setPressureHistory(prev => {
          const updated = [...prev, { time: timestamp, value: newData.pressure }];
          const limited = updated.slice(-20);
          try {
            localStorage.setItem('pressure-history', JSON.stringify(limited));
          } catch (e) {}
          return limited;
        });

      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        setSensorData(prev => ({ ...prev, connected: false }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [onAlert]);

  useEffect(() => {
    loadStoredHistory();
    const cleanup = connectToESP32();
    return cleanup;
  }, [loadStoredHistory, connectToESP32]);

  const adjustTemperature = (change: number) => {
    setSensorData(prev => ({
      ...prev,
      temperature: parseFloat((prev.temperature + change).toFixed(1))
    }));
  };

  return { 
    sensorData, 
    temperatureHistory, 
    humidityHistory, 
    pressureHistory,
    adjustTemperature 
  };
}