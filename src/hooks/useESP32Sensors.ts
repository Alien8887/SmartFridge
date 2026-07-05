import { useState, useEffect, useRef, useCallback } from 'react';
import { SensorData, ChartDataPoint, EnergyData } from '../types';

const BASE = process.env.REACT_APP_API_URL || '';
const POLL_MS = 2000;
const MAX_PTS = 5_000;
const DOOR_ALARM_S = 30;
const UPLOAD_MS = 60_000;
const TARGET_TEMP_GRACE_MS = 5000;

export interface HardwareDiagnostics { dhtOK: boolean | null; hxOK: boolean | null; rssi: number | null; uptimeSec: number | null; }

function localKey(u: string, k: string) { return `${k}:${u}`; }
function loadLocal<T>(u: string, k: string): T[] { if (!u) return []; try { const r = localStorage.getItem(localKey(u, k)); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveLocal(u: string, k: string, d: unknown[]) { if (!u) return; try { localStorage.setItem(localKey(u, k), JSON.stringify(d.slice(-MAX_PTS))); } catch { /* ignore */ } }

async function uploadBatch(type: string, points: ChartDataPoint[], token: string) {
  if (!token || points.length === 0) return;
  try { await fetch(`${BASE}/api/history`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ type, points }) }); } catch { /* ignore */ }
}
async function seedFromServer(type: string, token: string): Promise<ChartDataPoint[]> {
  if (!token) return [];
  try { const r = await fetch(`${BASE}/api/history?type=${type}&range=24H`, { headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) return []; const d = await r.json(); return Array.isArray(d.data) ? d.data : []; } catch { return []; }
}

export function useESP32Sensors(onAlert: (message: string) => void, token: string, username: string) {
  const [sensorData, setSensorData] = useState<SensorData>({ temperature: 0, humidity: 0, doorOpen: false, pressure: 0, gasLevel: 0, lastUpdate: null, connected: false });
  const [targetTemp, setTargetTempState] = useState(4);
  const [goalTemp, setGoalTemp] = useState(4);
  const [aiAdjusted, setAiAdjusted] = useState(false);
  const [aiReason, setAiReason] = useState<string | null>(null);
  const [modeAdjusted, setModeAdjusted] = useState(false);
  const [modeOffsetApplied, setModeOffsetApplied] = useState(0);
  const [servoAngle, setServoAngle] = useState(90);
  const [doorOpenCount, setDoorOpenCount] = useState(0);
  const [totalEnergyLost, setTotalEnergyLost] = useState(0);
  const [doorAlarmActive, setDoorAlarmActive] = useState(false);
  const [lastOpenDurationSec, setLastOpenDurationSec] = useState<number | null>(null);
  const [diagnostics, setDiagnostics] = useState<HardwareDiagnostics>({ dhtOK: null, hxOK: null, rssi: null, uptimeSec: null });

  const [temperatureHistory, setTempH] = useState<ChartDataPoint[]>([]);
  const [humidityHistory, setHumH] = useState<ChartDataPoint[]>([]);
  const [pressureHistory, setPressH] = useState<ChartDataPoint[]>([]);
  const [energyHistory, setEnergyH] = useState<EnergyData[]>([]);

  const onAlertRef = useRef(onAlert);
  const energyInitRef = useRef(false);
  const prevEnergyRef = useRef(0);
  const doorOpenAtRef = useRef<number | null>(null);
  const tempBufRef = useRef<ChartDataPoint[]>([]);
  const humBufRef = useRef<ChartDataPoint[]>([]);
  const pressBufRef = useRef<ChartDataPoint[]>([]);
  const seededForUserRef = useRef<string | null>(null);
  const targetTempSetAtRef = useRef(0);

  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);

  useEffect(() => {
    if (!username) { setTempH([]); setHumH([]); setPressH([]); setEnergyH([]); setTotalEnergyLost(0); return; }
    if (seededForUserRef.current === username) return;
    seededForUserRef.current = username;
    setTempH(loadLocal(username, 'sf-temp'));
    setHumH(loadLocal(username, 'sf-humidity'));
    setPressH(loadLocal(username, 'sf-pressure'));
    setEnergyH(loadLocal(username, 'sf-energy'));
    energyInitRef.current = false;
    prevEnergyRef.current = 0;
    setTotalEnergyLost(0);
    if (!token) return;
    (async () => {
      const [t, h, p] = await Promise.all([seedFromServer('temp', token), seedFromServer('humidity', token), seedFromServer('pressure', token)]);
      if (t.length) setTempH(prev => prev.length ? prev : t);
      if (h.length) setHumH(prev => prev.length ? prev : h);
      if (p.length) setPressH(prev => prev.length ? prev : p);
    })();
  }, [username, token]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!token || !username) return;
      if (tempBufRef.current.length) { uploadBatch('temp', tempBufRef.current, token); tempBufRef.current = []; }
      if (humBufRef.current.length) { uploadBatch('humidity', humBufRef.current, token); humBufRef.current = []; }
      if (pressBufRef.current.length) { uploadBatch('pressure', pressBufRef.current, token); pressBufRef.current = []; }
    }, UPLOAD_MS);
    return () => clearInterval(id);
  }, [token, username]);

  useEffect(() => {
    if (!token || !username) return;

    const poll = async () => {
      try {
        const r = await fetch(`${BASE}/api/sensors`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();

        const newData: SensorData = {
          temperature: typeof d.temperature === 'number' ? d.temperature : 0,
          humidity: typeof d.humidity === 'number' ? d.humidity : 0,
          doorOpen: Boolean(d.doorOpen),
          pressure: typeof d.weight === 'number' ? d.weight : 0,
          gasLevel: 0,
          lastUpdate: d.lastSeen ? new Date(d.lastSeen).toISOString() : null,
          connected: Boolean(d.connected),
        };

        setSensorData(prev => {
          if (prev.connected && newData.connected) {
            if (prev.temperature && Math.abs(newData.temperature - prev.temperature) > 5) onAlertRef.current(`⚠️ Temp jumped ${Math.abs(newData.temperature - prev.temperature).toFixed(1)}°C!`);
            if (prev.humidity && Math.abs(newData.humidity - prev.humidity) > 20) onAlertRef.current(`⚠️ Humidity jump ${Math.abs(newData.humidity - prev.humidity).toFixed(1)}%!`);
          }
          return newData;
        });

        if (Date.now() - targetTempSetAtRef.current > TARGET_TEMP_GRACE_MS) {
          setTargetTempState(typeof d.targetTemp === 'number' ? d.targetTemp : 4);
        }
        setGoalTemp(typeof d.goalTemp === 'number' ? d.goalTemp : 4);
        setAiAdjusted(Boolean(d.aiAdjusted));
        setAiReason(d.aiReason ?? null);
        setModeAdjusted(Boolean(d.modeAdjusted));
        setModeOffsetApplied(typeof d.modeOffsetApplied === 'number' ? d.modeOffsetApplied : 0);
        setServoAngle(typeof d.servoAngle === 'number' ? d.servoAngle : 90);
        setDoorOpenCount(typeof d.doorOpenCount === 'number' ? d.doorOpenCount : 0);
        setLastOpenDurationSec(typeof d.lastOpenDurationSec === 'number' ? d.lastOpenDurationSec : null);
        setDiagnostics({
          dhtOK: typeof d.dhtOK === 'boolean' ? d.dhtOK : null,
          hxOK: typeof d.hxOK === 'boolean' ? d.hxOK : null,
          rssi: typeof d.rssi === 'number' ? d.rssi : null,
          uptimeSec: typeof d.uptimeSec === 'number' ? d.uptimeSec : null,
        });

        const incomingEnergy = typeof d.energyLost === 'number' ? d.energyLost : 0;
        if (!energyInitRef.current) {
          energyInitRef.current = true;
          prevEnergyRef.current = incomingEnergy;
          setTotalEnergyLost(incomingEnergy);
        } else if (incomingEnergy !== prevEnergyRef.current) {
          const increased = incomingEnergy > prevEnergyRef.current;
          prevEnergyRef.current = incomingEnergy;
          setTotalEnergyLost(incomingEnergy);
          if (increased) {
            const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const pt: EnergyData = { time: t, usage: incomingEnergy, doorOpens: d.doorOpenCount ?? 0, timestamp: Date.now() };
            setEnergyH(prev => { const u = [...prev, pt].slice(-MAX_PTS); saveLocal(username, 'sf-energy', u); return u; });
            onAlertRef.current('🚪 Door opened — energy cost recorded');
          }
        }

        if (newData.doorOpen) {
          if (!doorOpenAtRef.current) doorOpenAtRef.current = Date.now();
          setDoorAlarmActive(Date.now() - doorOpenAtRef.current > DOOR_ALARM_S * 1000);
        } else { doorOpenAtRef.current = null; setDoorAlarmActive(false); }

        if (newData.connected) {
          const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const ts = Date.now();
          const tp: ChartDataPoint = { time: t, value: newData.temperature, timestamp: ts };
          const hp: ChartDataPoint = { time: t, value: newData.humidity, timestamp: ts };
          const pp: ChartDataPoint = { time: t, value: newData.pressure, timestamp: ts };
          setTempH(p => { const u = [...p, tp].slice(-MAX_PTS); saveLocal(username, 'sf-temp', u); return u; });
          setHumH(p => { const u = [...p, hp].slice(-MAX_PTS); saveLocal(username, 'sf-humidity', u); return u; });
          setPressH(p => { const u = [...p, pp].slice(-MAX_PTS); saveLocal(username, 'sf-pressure', u); return u; });
          tempBufRef.current.push(tp); humBufRef.current.push(hp); pressBufRef.current.push(pp);
        }
      } catch { setSensorData(prev => ({ ...prev, connected: false })); }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [token, username]);

  const setTargetTemp = useCallback(async (temp: number) => {
    const clamped = Math.max(0, Math.min(10, +temp.toFixed(1)));
    targetTempSetAtRef.current = Date.now();
    setTargetTempState(clamped);
    if (!token) return;
    try {
      const r = await fetch(`${BASE}/api/sensors`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ targetTemp: clamped }) });
      targetTempSetAtRef.current = Date.now();
      if (r.ok) { const d = await r.json(); if (typeof d.targetTemp === 'number') setTargetTempState(d.targetTemp); }
    } catch { /* next poll resyncs */ }
  }, [token]);

  const setMode = useCallback(async (modeId: string, offsetC: number) => {
    if (!token) return;
    try { await fetch(`${BASE}/api/sensors`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ mode: modeId, modeOffsetC: offsetC }) }); } catch { /* next poll resyncs */ }
  }, [token]);

  return {
    sensorData, temperatureHistory, humidityHistory, pressureHistory, energyHistory,
    targetTemp, goalTemp, aiAdjusted, aiReason, modeAdjusted, modeOffsetApplied, servoAngle,
    doorOpenCount, totalEnergyLost, doorAlarmActive, lastOpenDurationSec, diagnostics,
    setTargetTemp, setMode, isConnected: sensorData.connected,
  };
}