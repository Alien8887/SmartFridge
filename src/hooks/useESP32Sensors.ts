import { useState, useEffect, useRef, useCallback } from 'react';
import { SensorData, ChartDataPoint, EnergyData } from '../types';

const REMOTE   = 'https://smart-fridge-two.vercel.app';
const BASE     = process.env.REACT_APP_API_URL || '';
const CONF_MS  = 30_000;
const MAX_PTS  = 5_000;
const E_OPEN   = 0.012;

function load<T>(k: string): T[] {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function save(k: string, d: unknown[]) {
  try { localStorage.setItem(k, JSON.stringify(d.slice(-MAX_PTS))); } catch {}
}
function loadNum(k: string) {
  try { return parseFloat(localStorage.getItem(k) ?? '0') || 0; } catch { return 0; }
}

// Batch upload to server (silent — fails gracefully)
async function uploadBatch(type: string, points: ChartDataPoint[], token: string) {
  if (!token || points.length === 0) return;
  try {
    await fetch(`${BASE}/api/history`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ type, points }),
    });
  } catch { /* ignore */ }
}

export function useESP32Sensors(
  onAlert:  (message: string) => void,
  getToken: () => string
) {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0, humidity: 0, doorOpen: false,
    pressure: 0, gasLevel: 0, lastUpdate: null, connected: false,
  });

  const [temperatureHistory, setTempH]   = useState<ChartDataPoint[]>(() => load('sf-temp'));
  const [humidityHistory,    setHumH]    = useState<ChartDataPoint[]>(() => load('sf-humidity'));
  const [pressureHistory,    setPressH]  = useState<ChartDataPoint[]>(() => load('sf-pressure'));
  const [energyHistory,      setEnergyH] = useState<EnergyData[]>(() => load('sf-energy'));
  const [doorOpenCount,      setDoors]   = useState(() => loadNum('sf-doors'));
  const [totalEnergyLost,    setEnergy]  = useState(() => loadNum('sf-energy-total'));

  const onAlertRef   = useRef(onAlert);
  const lastSeenRef  = useRef(0);
  const prevDoorRef  = useRef(false);
  const doorRef      = useRef(loadNum('sf-doors'));
  const energyRef    = useRef(loadNum('sf-energy-total'));
  // Batch buffer — upload every 20 new points
  const tempBufRef   = useRef<ChartDataPoint[]>([]);
  const humBufRef    = useRef<ChartDataPoint[]>([]);
  const pressBufRef  = useRef<ChartDataPoint[]>([]);
  const uploadTimer  = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);

  // Upload batches every 60 seconds
  useEffect(() => {
    uploadTimer.current = setInterval(() => {
      const tok = getToken();
      if (!tok) return;
      if (tempBufRef.current.length)  { uploadBatch('temp',     tempBufRef.current,  tok); tempBufRef.current  = []; }
      if (humBufRef.current.length)   { uploadBatch('humidity', humBufRef.current,   tok); humBufRef.current   = []; }
      if (pressBufRef.current.length) { uploadBatch('pressure', pressBufRef.current, tok); pressBufRef.current = []; }
    }, 60_000);
    return () => clearInterval(uploadTimer.current!);
  }, [getToken]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      try {
        const res = await fetch(`${REMOTE}/api/sensors`, { cache: 'no-store' });
        if (!res.ok) throw new Error('err');
        const d = await res.json();

        const hasT = d.temperature != null && !isNaN(Number(d.temperature));
        const hasH = d.humidity    != null && !isNaN(Number(d.humidity));
        const hasW = d.weight      != null && !isNaN(Number(d.weight));
        const conn = d.connected === true && (hasT || hasH || hasW);

        if (conn) lastSeenRef.current = now;
        const within = lastSeenRef.current !== 0 && now - lastSeenRef.current < CONF_MS;

        const door = Boolean(d.doorOpen);
        if (conn && !prevDoorRef.current && door) {
          doorRef.current++;
          energyRef.current = parseFloat((energyRef.current + E_OPEN).toFixed(4));
          setDoors(doorRef.current);
          setEnergy(energyRef.current);
          try { localStorage.setItem('sf-doors', String(doorRef.current)); localStorage.setItem('sf-energy-total', String(energyRef.current)); } catch {}
          const ep: EnergyData = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), usage: energyRef.current, doorOpens: doorRef.current, timestamp: now };
          setEnergyH(prev => { const u = [...prev, ep].slice(-MAX_PTS); save('sf-energy', u); return u; });
          onAlertRef.current('🚪 Door opened — +0.012 kWh recorded');
        }
        if (conn) prevDoorRef.current = door;

        setSensorData(prev => {
          if (prev.connected && conn) {
            if (hasT && prev.temperature) { const dT = Math.abs(Number(d.temperature) - prev.temperature); if (dT > 5) onAlertRef.current(`⚠️ Temp jumped ${dT.toFixed(1)}°C!`); }
            if (hasH && prev.humidity)    { const dH = Math.abs(Number(d.humidity)    - prev.humidity);    if (dH > 20) onAlertRef.current(`⚠️ Humidity jump ${dH.toFixed(1)}%!`); }
          }
          return {
            temperature: conn && hasT ? Number(d.temperature) : prev.temperature,
            humidity:    conn && hasH ? Number(d.humidity)    : prev.humidity,
            doorOpen:    conn ? door  : prev.doorOpen,
            pressure:    conn && hasW ? Math.abs(Number(d.weight)) : prev.pressure,
            gasLevel:    conn && typeof d.gasLevel === 'number' ? d.gasLevel : prev.gasLevel,
            lastUpdate:  conn ? new Date().toISOString() : prev.lastUpdate,
            connected:   within,
          };
        });

        if (conn) {
          const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const mkPt = (value: number): ChartDataPoint => ({ time: t, value, timestamp: now });
          if (hasT) { const pt = mkPt(Number(d.temperature)); setTempH(p  => { const u = [...p, pt].slice(-MAX_PTS); save('sf-temp', u); return u; }); tempBufRef.current.push(pt); }
          if (hasH) { const pt = mkPt(Number(d.humidity));    setHumH(p   => { const u = [...p, pt].slice(-MAX_PTS); save('sf-humidity', u); return u; }); humBufRef.current.push(pt); }
          if (hasW) { const pt = mkPt(Math.abs(Number(d.weight))); setPressH(p => { const u = [...p, pt].slice(-MAX_PTS); save('sf-pressure', u); return u; }); pressBufRef.current.push(pt); }
        }
      } catch {
        const within = lastSeenRef.current !== 0 && Date.now() - lastSeenRef.current < CONF_MS;
        setSensorData(prev => ({ ...prev, connected: within }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const adjustTemperature = useCallback((c: number) => {
    setSensorData(prev => ({ ...prev, temperature: parseFloat((prev.temperature + c).toFixed(1)) }));
  }, []);

  return { sensorData, temperatureHistory, humidityHistory, pressureHistory, energyHistory, doorOpenCount, totalEnergyLost, adjustTemperature };
}