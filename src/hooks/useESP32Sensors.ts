import { useState, useEffect, useRef } from 'react';
import { SensorData, ChartDataPoint, EnergyData } from '../types';

const CONFIDENCE_MS = 30_000;
const MAX_POINTS = 5_000;
const ENERGY_PER_OPEN = 0.012;

function loadPoints<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePoints(key: string, data: any[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data.slice(-MAX_POINTS)));
  } catch {}
}

function loadNumber(key: string): number {
  try { return parseFloat(localStorage.getItem(key) ?? '0') || 0; }
  catch { return 0; }
}

export function useESP32Sensors(onAlert: (message: string) => void) {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0, humidity: 0, doorOpen: false,
    pressure: 0, gasLevel: 0, lastUpdate: null, connected: false
  });

  const [temperatureHistory, setTemperatureHistory] = useState<ChartDataPoint[]>(
    () => loadPoints<ChartDataPoint>('sf-temp')
  );
  const [humidityHistory, setHumidityHistory] = useState<ChartDataPoint[]>(
    () => loadPoints<ChartDataPoint>('sf-humidity')
  );
  const [pressureHistory, setPressureHistory] = useState<ChartDataPoint[]>(
    () => loadPoints<ChartDataPoint>('sf-pressure')
  );
  const [energyHistory, setEnergyHistory] = useState<EnergyData[]>(
    () => loadPoints<EnergyData>('sf-energy')
  );
  const [doorOpenCount, setDoorOpenCount] = useState<number>(() => loadNumber('sf-door-count'));
  const [totalEnergyLost, setTotalEnergyLost] = useState<number>(() => loadNumber('sf-energy-total'));

  const onAlertRef = useRef(onAlert);
  // Starts at 0 = never seen (so connected = false on fresh load)
  const lastSeenRef = useRef<number>(0);
  const prevDoorRef = useRef<boolean>(false);
  const doorCountRef = useRef<number>(loadNumber('sf-door-count'));
  const energyTotalRef = useRef<number>(loadNumber('sf-energy-total'));

  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      try {
        const response = await fetch(
          'https://smart-fridge-two.vercel.app/api/sensors',
          { cache: 'no-store' }
        );
        if (!response.ok) throw new Error('err');
        const data = await response.json();

        const hasT = data.temperature !== null && data.temperature !== undefined && !isNaN(Number(data.temperature));
        const hasH = data.humidity !== null && data.humidity !== undefined && !isNaN(Number(data.humidity));
        const hasW = data.weight !== null && data.weight !== undefined && !isNaN(Number(data.weight));
        const currentConnected = data.connected === true && (hasT || hasH || hasW);

        // Only advance lastSeen when we get real data
        if (currentConnected) lastSeenRef.current = now;

        // Confidence interval: false on fresh start (lastSeen === 0), true within 30s
        const withinTimeout =
          lastSeenRef.current !== 0 &&
          (now - lastSeenRef.current) < CONFIDENCE_MS;

        // Door open edge detection: closed → open = new opening event
        const curDoor = Boolean(data.doorOpen);
        if (currentConnected && !prevDoorRef.current && curDoor) {
          doorCountRef.current += 1;
          energyTotalRef.current = parseFloat(
            (energyTotalRef.current + ENERGY_PER_OPEN).toFixed(4)
          );

          setDoorOpenCount(doorCountRef.current);
          setTotalEnergyLost(energyTotalRef.current);

          try {
            localStorage.setItem('sf-door-count', String(doorCountRef.current));
            localStorage.setItem('sf-energy-total', String(energyTotalRef.current));
          } catch {}

          const energyPt: EnergyData = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            usage: energyTotalRef.current,
            doorOpens: doorCountRef.current,
            timestamp: now
          };
          setEnergyHistory(prev => {
            const updated = [...prev, energyPt].slice(-MAX_POINTS);
            savePoints('sf-energy', updated);
            return updated;
          });

          onAlertRef.current('🚪 Door opened! +0.012 kWh energy cost recorded.');
        }

        if (currentConnected) prevDoorRef.current = curDoor;

        setSensorData(prev => {
          if (prev.connected && currentConnected) {
            if (hasT && prev.temperature !== 0) {
              const dT = Math.abs(Number(data.temperature) - prev.temperature);
              if (dT > 5) onAlertRef.current(`⚠️ Temp changed by ${dT.toFixed(1)}°C!`);
            }
            if (hasH && prev.humidity !== 0) {
              const dH = Math.abs(Number(data.humidity) - prev.humidity);
              if (dH > 20) onAlertRef.current(`⚠️ Humidity changed by ${dH.toFixed(1)}%!`);
            }
          }
          return {
            temperature: currentConnected && hasT ? Number(data.temperature) : prev.temperature,
            humidity: currentConnected && hasH ? Number(data.humidity) : prev.humidity,
            doorOpen: currentConnected ? curDoor : prev.doorOpen,
            pressure: currentConnected && hasW ? Math.abs(Number(data.weight)) : prev.pressure,
            gasLevel: currentConnected && typeof data.gasLevel === 'number' ? data.gasLevel : prev.gasLevel,
            lastUpdate: currentConnected ? new Date().toISOString() : prev.lastUpdate,
            connected: withinTimeout
          };
        });

        if (currentConnected) {
          const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (hasT) {
            setTemperatureHistory(prev => {
              const u = [...prev, { time: t, value: Number(data.temperature), timestamp: now }].slice(-MAX_POINTS);
              savePoints('sf-temp', u);
              return u;
            });
          }
          if (hasH) {
            setHumidityHistory(prev => {
              const u = [...prev, { time: t, value: Number(data.humidity), timestamp: now }].slice(-MAX_POINTS);
              savePoints('sf-humidity', u);
              return u;
            });
          }
          if (hasW) {
            setPressureHistory(prev => {
              const u = [...prev, { time: t, value: Math.abs(Number(data.weight)), timestamp: now }].slice(-MAX_POINTS);
              savePoints('sf-pressure', u);
              return u;
            });
          }
        }

      } catch {
        const withinTimeout =
          lastSeenRef.current !== 0 &&
          (Date.now() - lastSeenRef.current) < CONFIDENCE_MS;
        setSensorData(prev => ({ ...prev, connected: withinTimeout }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
    energyHistory,
    doorOpenCount,
    totalEnergyLost,
    adjustTemperature
  };
}