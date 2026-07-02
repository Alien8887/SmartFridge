import { useState, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';
const MIN_INTERVAL_MS = 120_000; // throttle: auto-runs at most every 2 minutes

export interface SpoilageRisk {
  id: number;
  name: string;
  category: string;
  nominalDaysLeft: number;
  adjustedDaysLeft: number;
  spoilageRisk: number;
  speedup: number;
  priority: 'urgent' | 'soon' | 'ok';
}

export interface GoalRecommendation {
  shouldOverride: boolean;
  recommendedTemp: number;
  reason: string;
}

export interface MLResult {
  currentTemp: number;
  smoothedTemp: number;
  forecast: {
    in6Hours: number;
    trend: 'rising' | 'falling' | 'stable';
    confidence: number;
    willExceedSafe: boolean;
    willFreeze: boolean;
  };
  anomaly: {
    isAnomaly: boolean;
    zScore: number;
    mean: number;
    stdDev: number;
    description: string;
  };
  safetyScore: number;
  safetyGrade: 'A' | 'B' | 'C' | 'D';
  spoilageRisks: SpoilageRisk[];
  insights: string[];
  goalRecommendation?: GoalRecommendation;
  modelInfo: {
    algorithms: string[];
    dataPoints: number;
    rSquared: number;
  };
}

export interface AdviceRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  impact: string;
}

export interface SmartAdvice {
  available: boolean;
  recommendations: AdviceRecommendation[];
  overallAssessment: string;
  urgentAction: string | null;
}

interface InventoryLike {
  id: number;
  name: string;
  category: string;
  expiry: number;
  addedDate: number;
}

export function useMLPredictions(token: string) {
  const [ml, setMl]               = useState<MLResult | null>(null);
  const [advice, setAdvice]       = useState<SmartAdvice | null>(null);
  const [loading, setLoading]     = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [mlUpdatedAt, setMlUpdatedAt]         = useState<number | null>(null);
  const [adviceUpdatedAt, setAdviceUpdatedAt] = useState<number | null>(null);

  const lastRunRef = useRef(0);

  const runPredictions = useCallback(async (
    temperature: number,
    humidity:    number,
    inventory:   InventoryLike[],
    force = false
  ) => {
    if (!token) return;
    if (!force && Date.now() - lastRunRef.current < MIN_INTERVAL_MS) return;
    lastRunRef.current = Date.now();

    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/ai?action=predict`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ temperature, humidity, inventory }),
      });
      if (r.ok) {
        setMl(await r.json());
        setMlUpdatedAt(Date.now());
      }
    } catch {
      // Network or server hiccup — keep showing the last good result.
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getAIAdvice = useCallback(async (
    temperature:   number,
    humidity:      number,
    inventory:     InventoryLike[],
    doorOpenCount: number
  ) => {
    if (!token) return;
    setAiLoading(true);
    try {
      const r = await fetch(`${BASE}/api/ai?action=advice`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ temperature, humidity, inventory, doorOpenCount, predictions: ml }),
      });
      const d = await r.json();
      if (d.recommendations) {
        setAdvice(d);
      } else {
        setAdvice({
          available: false,
          recommendations: [],
          overallAssessment: d.message || 'AI advice is not configured for this deployment.',
          urgentAction: null,
        });
      }
      setAdviceUpdatedAt(Date.now());
    } catch {
      setAdvice({
        available: false,
        recommendations: [],
        overallAssessment: 'AI advice service is unavailable right now.',
        urgentAction: null,
      });
      setAdviceUpdatedAt(Date.now());
    } finally {
      setAiLoading(false);
    }
  }, [token, ml]);

  return {
    ml, advice, loading, aiLoading,
    mlUpdatedAt, adviceUpdatedAt,
    runPredictions, getAIAdvice,
  };
}