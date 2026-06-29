import { useState, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface SpoilageRisk {
  id:               number;
  name:             string;
  category:         string;
  nominalDaysLeft:  number;
  adjustedDaysLeft: number;
  spoilageRisk:     number;
  speedup:          number;
  priority:         'urgent' | 'soon' | 'ok';
}

export interface MLResult {
  currentTemp:  number;
  smoothedTemp: number;
  forecast: {
    in6Hours:       number;
    trend:          'rising' | 'falling' | 'stable';
    confidence:     number;
    willExceedSafe: boolean;
    willFreeze:     boolean;
  };
  anomaly: {
    isAnomaly:   boolean;
    zScore:      number;
    mean:        number;
    stdDev:      number;
    description: string;
  };
  safetyScore:   number;
  safetyGrade:   'A' | 'B' | 'C' | 'D';
  spoilageRisks: SpoilageRisk[];
  insights:      string[];
  modelInfo: {
    algorithms: string[];
    dataPoints: number;
    rSquared:   number;
  };
}

export interface SmartAdvice {
  available:         boolean;
  recommendations:   { priority: 'high'|'medium'|'low'; action: string; reason: string; impact: string }[];
  overallAssessment: string;
  urgentAction:      string | null;
}

export function useMLPredictions(getToken: () => string) {
  const [ml,        setMl]        = useState<MLResult | null>(null);
  const [advice,    setAdvice]    = useState<SmartAdvice | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const lastRun = useRef(0);

  const runPredictions = useCallback(async (
    temperature: number,
    humidity:    number,
    inventory:   unknown[]
  ) => {
    if (Date.now() - lastRun.current < 120_000) return;
    lastRun.current = Date.now();
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ temperature, humidity, inventory }),
      });
      if (r.ok) setMl(await r.json());
    } catch { /* silently ignore — offline or server error */ }
    finally { setLoading(false); }
  }, [getToken]);

  const getAIAdvice = useCallback(async (
    temperature:   number,
    humidity:      number,
    inventory:     unknown[],
    doorOpenCount: number
  ) => {
    setAiLoading(true);
    try {
      const r = await fetch(`${BASE}/api/smart-advice`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ temperature, humidity, inventory, doorOpenCount, predictions: ml }),
      });
      const d = await r.json();
      if (d.recommendations) {
        setAdvice(d);
      } else {
        setAdvice({ available: false, recommendations: [], overallAssessment: d.message || 'AI not configured', urgentAction: null });
      }
    } catch {
      setAdvice({ available: false, recommendations: [], overallAssessment: 'Service unavailable', urgentAction: null });
    } finally { setAiLoading(false); }
  }, [getToken, ml]);

  return { ml, advice, loading, aiLoading, runPredictions, getAIAdvice };
}