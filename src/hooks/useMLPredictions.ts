import { useState, useCallback, useRef, useEffect } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';
const MIN_INTERVAL_MS = 120_000;

export interface SpoilageRisk { id: number; name: string; category: string; nominalDaysLeft: number; adjustedDaysLeft: number; spoilageRisk: number; speedup: number; priority: 'urgent' | 'soon' | 'ok'; }
export interface GoalRecommendation { shouldOverride: boolean; recommendedTemp: number; reason: string; }
export interface MLResult {
  currentTemp: number; smoothedTemp: number;
  forecast: { in6Hours: number; trend: 'rising' | 'falling' | 'stable'; confidence: number; willExceedSafe: boolean; willFreeze: boolean };
  anomaly: { isAnomaly: boolean; zScore: number; mean: number; stdDev: number; description: string };
  safetyScore: number; safetyGrade: 'A' | 'B' | 'C' | 'D';
  spoilageRisks: SpoilageRisk[]; insights: string[]; goalRecommendation?: GoalRecommendation;
  modelInfo: { algorithms: string[]; dataPoints: number; rSquared: number };
}
export interface AdviceRecommendation { priority: 'high' | 'medium' | 'low'; action: string; reason: string; impact: string; }
export interface SmartAdvice { available: boolean; recommendations: AdviceRecommendation[]; overallAssessment: string; urgentAction: string | null; }
interface InventoryLike { id: number; name: string; category: string; expiry: number; addedDate: number; }

export function useMLPredictions(token: string, username: string) {
  const [ml, setMl] = useState<MLResult | null>(null);
  const [advice, setAdvice] = useState<SmartAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [mlUpdatedAt, setMlUpdatedAt] = useState<number | null>(null);
  const [adviceUpdatedAt, setAdviceUpdatedAt] = useState<number | null>(null);
  const lastRunRef = useRef(0);
  const lastUserRef = useRef<string | null>(null);

  // FIXED: App.tsx has been calling this hook as useMLPredictions(token,
  // username) — two arguments — while this file only ever declared one
  // parameter. That's a TS2554 arity error, promoted to a build failure
  // under CI=true. Adding username properly also closes a real gap: without
  // it, switching accounts in the same tab could briefly show the PREVIOUS
  // user's AI analysis until a fresh runPredictions() call happened to fire.
  useEffect(() => {
    if (lastUserRef.current !== username) {
      lastUserRef.current = username;
      setMl(null); setAdvice(null); setMlUpdatedAt(null); setAdviceUpdatedAt(null);
      lastRunRef.current = 0;
    }
  }, [username]);

  const runPredictions = useCallback(async (temperature: number, humidity: number, inventory: InventoryLike[], force = false) => {
    if (!token) return;
    if (!force && Date.now() - lastRunRef.current < MIN_INTERVAL_MS) return;
    lastRunRef.current = Date.now();
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/ai?action=predict`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ temperature, humidity, inventory }) });
      if (r.ok) { setMl(await r.json()); setMlUpdatedAt(Date.now()); }
    } catch { /* keep last good result on screen */ }
    finally { setLoading(false); }
  }, [token]);

  const getAIAdvice = useCallback(async (temperature: number, humidity: number, inventory: InventoryLike[], doorOpenCount: number) => {
    if (!token) return;
    setAiLoading(true);
    try {
      const r = await fetch(`${BASE}/api/ai?action=advice`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ temperature, humidity, inventory, doorOpenCount, predictions: ml }) });
      const d = await r.json();
      if (d.recommendations) setAdvice(d);
      else setAdvice({ available: false, recommendations: [], overallAssessment: d.message || 'AI advice is not configured for this deployment.', urgentAction: null });
      setAdviceUpdatedAt(Date.now());
    } catch {
      setAdvice({ available: false, recommendations: [], overallAssessment: 'AI advice service is unavailable right now.', urgentAction: null });
      setAdviceUpdatedAt(Date.now());
    } finally { setAiLoading(false); }
  }, [token, ml]);

  return { ml, advice, loading, aiLoading, mlUpdatedAt, adviceUpdatedAt, runPredictions, getAIAdvice };
}