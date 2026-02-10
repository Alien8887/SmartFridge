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
    console.log('🚀 Starting ESP32 sensor polling...');
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch('https://smart-fridge-two.vercel.app/api/sensors', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        console.log('📊 Received sensor data:', data);
        
        // Check if sensors are connected (-999 means disconnected)
        const tempConnected = data.temperature !== -999 && data.temperature !== null && !isNaN(data.temperature);
        const humConnected = data.humidity !== -999 && data.humidity !== null && !isNaN(data.humidity);
        const weightConnected = data.weight !== -999 && data.weight !== null && !isNaN(data.weight);
        
        const newData: SensorData = {
          temperature: tempConnected ? Number(data.temperature) : 0,
          humidity: humConnected ? Number(data.humidity) : 0,
          doorOpen: Boolean(data.doorOpen),
          pressure: weightConnected ? Math.abs(Number(data.weight)) : 0,
          gasLevel: typeof data.gasLevel === 'number' ? data.gasLevel : 0,
          lastUpdate: new Date().toISOString(),
          connected: data.connected && (tempConnected || humConnected || weightConnected)
        };

        // Alert for disconnected sensors
        if (!tempConnected && data.temperature === -999) {
          onAlert('⚠️ Temperature sensor disconnected');
        }
        if (!humConnected && data.humidity === -999) {
          onAlert('⚠️ Humidity sensor disconnected');
        }
        if (!weightConnected && data.weight === -999) {
          onAlert('⚠️ Weight sensor disconnected');
        }

        setSensorData(prev => {
          // Alert on significant changes (only if previously connected)
          if (prev.connected && prev.temperature !== 0 && tempConnected) {
            const tempChange = Math.abs(newData.temperature - prev.temperature);
            if (tempChange > 5) {
              onAlert(`Temperature changed by ${tempChange.toFixed(1)}°C!`);
            }
          }
          
          if (prev.connected && prev.humidity !== 0 && humConnected) {
            const humChange = Math.abs(newData.humidity - prev.humidity);
            if (humChange > 20) {
              onAlert(`Humidity changed by ${humChange.toFixed(1)}%!`);
            }
          }
          
          return newData;
        });

        const timestamp = new Date().toLocaleTimeString();
        
        // Only add to history if sensor is connected
        if (tempConnected) {
          setTemperatureHistory(prev => {
            const updated = [...prev, { time: timestamp, value: newData.temperature }];
            const limited = updated.slice(-20);
            try {
              localStorage.setItem('temp-history', JSON.stringify(limited));
            } catch (e) {
              console.log('Storage error');
            }
            return limited;
          });
        }

        if (humConnected) {
          setHumidityHistory(prev => {
            const updated = [...prev, { time: timestamp, value: newData.humidity }];
            const limited = updated.slice(-20);
            try {
              localStorage.setItem('humidity-history', JSON.stringify(limited));
            } catch (e) {
              console.log('Storage error');
            }
            return limited;
          });
        }

        if (weightConnected) {
          setPressureHistory(prev => {
            const updated = [...prev, { time: timestamp, value: newData.pressure }];
            const limited = updated.slice(-20);
            try {
              localStorage.setItem('pressure-history', JSON.stringify(limited));
            } catch (e) {
              console.log('Storage error');
            }
            return limited;
          });
        }

      } catch (error) {
        console.error('❌ Failed to fetch sensor data:', error);
        setSensorData(prev => ({ ...prev, connected: false }));
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      console.log('🛑 Stopping sensor polling');
      clearInterval(interval);
    };
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