import { useState, useEffect, useRef } from 'react';
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

  // Use ref to avoid dependency issues
  const onAlertRef = useRef(onAlert);
  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
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
        
        if (!response.ok) {
          console.error('❌ Response not OK:', response.status);
          throw new Error('Network error');
        }
        
        const data = await response.json();
        console.log('📊 Received sensor data:', data);
        
        // Check if data is recent and valid
        const isConnected = data.connected === true;
        const hasValidTemp = data.temperature !== null && data.temperature !== -999 && !isNaN(data.temperature);
        const hasValidHum = data.humidity !== null && data.humidity !== -999 && !isNaN(data.humidity);
        const hasValidWeight = data.weight !== null && data.weight !== -999 && !isNaN(data.weight);
        
        const newData: SensorData = {
          temperature: hasValidTemp ? Number(data.temperature) : 0,
          humidity: hasValidHum ? Number(data.humidity) : 0,
          doorOpen: Boolean(data.doorOpen),
          pressure: hasValidWeight ? Math.abs(Number(data.weight)) : 0,
          gasLevel: typeof data.gasLevel === 'number' ? data.gasLevel : 0,
          lastUpdate: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
          connected: isConnected && (hasValidTemp || hasValidHum || hasValidWeight)
        };

        console.log('✅ Processed data:', newData);

        setSensorData(prev => {
          // Alert on significant changes (only if previously connected)
          if (prev.connected && newData.connected) {
            if (hasValidTemp && prev.temperature !== 0) {
              const tempChange = Math.abs(newData.temperature - prev.temperature);
              if (tempChange > 5) {
                onAlertRef.current(`⚠️ Temperature changed by ${tempChange.toFixed(1)}°C!`);
              }
            }
            
            if (hasValidHum && prev.humidity !== 0) {
              const humChange = Math.abs(newData.humidity - prev.humidity);
              if (humChange > 20) {
                onAlertRef.current(`⚠️ Humidity changed by ${humChange.toFixed(1)}%!`);
              }
            }
          }
          
          return newData;
        });

        const timestamp = new Date().toLocaleTimeString();
        
        // Only add to history if sensor is connected and has valid data
        if (isConnected && hasValidTemp) {
          setTemperatureHistory(prev => [...prev, { time: timestamp, value: newData.temperature }].slice(-30));
        }

        if (isConnected && hasValidHum) {
          setHumidityHistory(prev => [...prev, { time: timestamp, value: newData.humidity }].slice(-30));
        }

        if (isConnected && hasValidWeight) {
          setPressureHistory(prev => [...prev, { time: timestamp, value: newData.pressure }].slice(-30));
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
  }, []); // Empty dependency array - only run once!

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