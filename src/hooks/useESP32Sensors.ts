import { useState, useEffect, useRef, useCallback } from 'react';
import { SensorData, ChartDataPoint, EnergyData } from '../types';

const BASE = process.env.REACT_APP_API_URL || '';
const POLL_MS = 2000;
// const CONF_MS = 30_000;
const MAX_PTS = 5_000;
const DOOR_ALARM_S = 30;
const UPLOAD_MS = 60_000;

export interface HardwareDiagnostics {
  dhtOK: boolean | null;
  hxOK: boolean | null;
  rssi: number | null;
  uptimeSec: number | null;
}

function loadLocal<T>(k: string): T[] {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveLocal(k: string, d: unknown[]) {
  try { localStorage.setItem(k, JSON.stringify(d.slice(-MAX_PTS))); } catch { /* ignore */ }
}
async function uploadBatch(type: string, points: ChartDataPoint[], token: string) {
  if (!token || points.length === 0) return;
  try {
    await fetch(`${BASE}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, points }),
    });
  } catch { /* ignore */ }
}
async function seedFromServer(type: string, token: string): Promise<ChartDataPoint[]> {
  if (!token) return [];
  try {
    const r = await fetch(`${BASE}/api/history?type=${type}&range=24H`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d.data) ? d.data : [];
  } catch { return []; }
}

export function useESP32Sensors(onAlert: (message: string) => void, token: string) {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0, humidity: 0, doorOpen: false, pressure: 0, gasLevel: 0, lastUpdate: null, connected: false,
  });

  const [targetTemp, setTargetTempState] = useState(4);
  const [goalTemp, setGoalTemp]           = useState(4);
  const [aiAdjusted, setAiAdjusted]       = useState(false);
  const [aiReason, setAiReason]           = useState<string | null>(null);
  const [servoAngle, setServoAngle]       = useState(90);
  const [doorOpenCount, setDoorOpenCount] = useState(0);
  const [totalEnergyLost, setTotalEnergyLost] = useState(0);
  const [doorAlarmActive, setDoorAlarmActive] = useState(false);
  const [diagnostics, setDiagnostics] = useState<HardwareDiagnostics>({ dhtOK: null, hxOK: null, rssi: null, uptimeSec: null });

  const [temperatureHistory, setTempH]   = useState<ChartDataPoint[]>(() => loadLocal('sf-temp'));
  const [humidityHistory,    setHumH]    = useState<ChartDataPoint[]>(() => loadLocal('sf-humidity'));
  const [pressureHistory,    setPressH]  = useState<ChartDataPoint[]>(() => loadLocal('sf-pressure'));
  const [energyHistory,      setEnergyH] = useState<EnergyData[]>(() => loadLocal('sf-energy'));

  const onAlertRef     = useRef(onAlert);
  const energyInitRef  = useRef(false);
  const prevEnergyRef  = useRef(0);
  const doorOpenAtRef  = useRef<number | null>(null);
  const tempBufRef     = useRef<ChartDataPoint[]>([]);
  const humBufRef      = useRef<ChartDataPoint[]>([]);
  const pressBufRef    = useRef<ChartDataPoint[]>([]);
  const seededRef      = useRef(false);

  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);

  useEffect(() => {
    if (!token || seededRef.current) return;
    seededRef.current = true;
    (async () => {
      const [t, h, p] = await Promise.all([seedFromServer('temp', token), seedFromServer('humidity', token), seedFromServer('pressure', token)]);
      if (t.length) setTempH(prev => prev.length ? prev : t);
      if (h.length) setHumH(prev => prev.length ? prev : h);
      if (p.length) setPressH(prev => prev.length ? prev : p);
    })();
  }, [token]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!token) return;
      if (tempBufRef.current.length)  { uploadBatch('temp', tempBufRef.current, token);     tempBufRef.current = []; }
      if (humBufRef.current.length)   { uploadBatch('humidity', humBufRef.current, token);  humBufRef.current = []; }
      if (pressBufRef.current.length) { uploadBatch('pressure', pressBufRef.current, token); pressBufRef.current = []; }
    }, UPLOAD_MS);
    return () => clearInterval(id);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const poll = async () => {
      try {
        const r = await fetch(`${BASE}/api/sensors`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();

        const newData: SensorData = {
          temperature: typeof d.temperature === 'number' ? d.temperature : 0,
          humidity:    typeof d.humidity === 'number' ? d.humidity : 0,
          doorOpen:    Boolean(d.doorOpen),
          pressure:    typeof d.weight === 'number' ? d.weight : 0,
          gasLevel:    0,
          lastUpdate:  d.lastSeen ? new Date(d.lastSeen).toISOString() : null,
          connected:   Boolean(d.connected),
        };

        setSensorData(prev => {
          if (prev.connected && newData.connected) {
            if (prev.temperature && Math.abs(newData.temperature - prev.temperature) > 5)
              onAlertRef.current(`⚠️ Temp jumped ${Math.abs(newData.temperature - prev.temperature).toFixed(1)}°C!`);
            if (prev.humidity && Math.abs(newData.humidity - prev.humidity) > 20)
              onAlertRef.current(`⚠️ Humidity jump ${Math.abs(newData.humidity - prev.humidity).toFixed(1)}%!`);
          }
          return newData;
        });

        setTargetTempState(typeof d.targetTemp === 'number' ? d.targetTemp : 4);
        setGoalTemp(typeof d.goalTemp === 'number' ? d.goalTemp : 4);
        setAiAdjusted(Boolean(d.aiAdjusted));
        setAiReason(d.aiReason ?? null);
        setServoAngle(typeof d.servoAngle === 'number' ? d.servoAngle : 90);
        setDoorOpenCount(typeof d.doorOpenCount === 'number' ? d.doorOpenCount : 0);

        setDiagnostics({
          dhtOK:     typeof d.dhtOK === 'boolean' ? d.dhtOK : null,
          hxOK:      typeof d.hxOK === 'boolean' ? d.hxOK : null,
          rssi:      typeof d.rssi === 'number' ? d.rssi : null,
          uptimeSec: typeof d.uptimeSec === 'number' ? d.uptimeSec : null,
        });

        if (typeof d.energyLost === 'number') {
          if (!energyInitRef.current) {
            energyInitRef.current = true;
            prevEnergyRef.current = d.energyLost;
            setTotalEnergyLost(d.energyLost);
          } else if (d.energyLost !== prevEnergyRef.current) {
            prevEnergyRef.current = d.energyLost;
            setTotalEnergyLost(d.energyLost);
            const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const pt: EnergyData = { time: t, usage: d.energyLost, doorOpens: d.doorOpenCount ?? 0, timestamp: Date.now() };
            setEnergyH(prev => { const u = [...prev, pt].slice(-MAX_PTS); saveLocal('sf-energy', u); return u; });
            onAlertRef.current('🚪 Door opened — +0.012 kWh recorded');
          }
        }

        if (newData.doorOpen) {
          if (!doorOpenAtRef.current) doorOpenAtRef.current = Date.now();
          setDoorAlarmActive(Date.now() - doorOpenAtRef.current > DOOR_ALARM_S * 1000);
        } else {
          doorOpenAtRef.current = null;
          setDoorAlarmActive(false);
        }

        if (newData.connected) {
          const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const ts = Date.now();
          const tp: ChartDataPoint = { time: t, value: newData.temperature, timestamp: ts };
          const hp: ChartDataPoint = { time: t, value: newData.humidity, timestamp: ts };
          const pp: ChartDataPoint = { time: t, value: newData.pressure, timestamp: ts };
          setTempH(p => { const u = [...p, tp].slice(-MAX_PTS); saveLocal('sf-temp', u); return u; });
          setHumH(p  => { const u = [...p, hp].slice(-MAX_PTS); saveLocal('sf-humidity', u); return u; });
          setPressH(p => { const u = [...p, pp].slice(-MAX_PTS); saveLocal('sf-pressure', u); return u; });
          tempBufRef.current.push(tp);
          humBufRef.current.push(hp);
          pressBufRef.current.push(pp);
        }
      } catch {
        setSensorData(prev => ({ ...prev, connected: false }));
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [token]);

  const setTargetTemp = useCallback(async (temp: number) => {
    const clamped = Math.max(0, Math.min(10, +temp.toFixed(1)));
    setTargetTempState(clamped);
    if (!token) return;
    try {
      await fetch(`${BASE}/api/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetTemp: clamped }),
      });
    } catch { /* next poll resyncs */ }
  }, [token]);

  return {
    sensorData, temperatureHistory, humidityHistory, pressureHistory, energyHistory,
    targetTemp, goalTemp, aiAdjusted, aiReason, servoAngle,
    doorOpenCount, totalEnergyLost, doorAlarmActive, diagnostics, setTargetTemp,
    isConnected: sensorData.connected,
  };
}