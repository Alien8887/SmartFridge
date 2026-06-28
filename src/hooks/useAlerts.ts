import { useState, useRef, useCallback } from 'react';
import { SensorData } from '../types';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface EnhancedAlert {
  id:        number;
  message:   string;
  timestamp: Date;
  severity:  AlertSeverity;
  icon:      string;
  formula?:  string;
  value?:    number;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<EnhancedAlert[]>([]);

  // Cooldown tracking — prevents alert spam
  const cooldownRef = useRef<Record<string, number>>({});

  // Rolling temperature history for std-dev calculation
  const tempHistRef   = useRef<number[]>([]);
  const prevTempRef   = useRef<number | null>(null);
  const prevTimeRef   = useRef<number | null>(null);

  const canAlert = (key: string, cooldownMs = 90_000): boolean => {
    const last = cooldownRef.current[key] ?? 0;
    if (Date.now() - last < cooldownMs) return false;
    cooldownRef.current[key] = Date.now();
    return true;
  };

  const addAlert = useCallback((
    message:   string,
    severity:  AlertSeverity = 'warning',
    icon       = '',
    formula?:  string,
    value?:    number
  ) => {
    const resolved = icon || (severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️');
    const newAlert: EnhancedAlert = {
      id: Date.now() + Math.random(),
      message,
      timestamp: new Date(),
      severity,
      icon: resolved,
      formula,
      value,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 12));
  }, []);

  /**
   * Formula-based sensor analysis.
   * Call this in a useEffect whenever sensorData changes.
   */
  const analyzeSensor = useCallback((data: SensorData) => {
    if (!data.connected) return;

    const T = data.temperature;
    const H = data.humidity;
    const now = Date.now();

    /* ── FORMULA 1: Absolute temperature bounds ──────────────────── */
    if (T > 15 && canAlert('temp-danger-high', 120_000)) {
      addAlert(
        `Temperature ${T.toFixed(1)}°C is dangerously high — food spoilage risk is severe.`,
        'critical', '🌡️',
        'Threshold: T > 15°C (safe max = 8°C)',
        T
      );
    } else if (T > 8 && canAlert('temp-warn-high', 120_000)) {
      addAlert(
        `Temperature ${T.toFixed(1)}°C exceeds safe range. Optimal: 1–4°C.`,
        'warning', '🌡️',
        'Threshold: T > 8°C',
        T
      );
    } else if (T < -2 && canAlert('temp-warn-low', 120_000)) {
      addAlert(
        `Temperature ${T.toFixed(1)}°C is too cold — items may freeze.`,
        'warning', '❄️',
        'Threshold: T < −2°C',
        T
      );
    }

    /* ── FORMULA 2: Rate of change  dT/dt ───────────────────────── */
    if (prevTempRef.current !== null && prevTimeRef.current !== null) {
      const dtMin = (now - prevTimeRef.current) / 60_000;
      if (dtMin > 0) {
        const rate = (T - prevTempRef.current) / dtMin;
        if (Math.abs(rate) > 2 && canAlert('temp-rate', 120_000)) {
          addAlert(
            `Rapid temperature change: ${rate > 0 ? '+' : ''}${rate.toFixed(1)}°C/min. Check door seal.`,
            'critical', '⚡',
            'dT/dt = ΔT / Δt, alert when |dT/dt| > 2°C/min',
            rate
          );
        }
      }
    }
    prevTempRef.current = T;
    prevTimeRef.current = now;

    /* ── FORMULA 3: Temperature stability (standard deviation) ───── */
    tempHistRef.current = [...tempHistRef.current.slice(-20), T];
    if (tempHistRef.current.length >= 10) {
      const n    = tempHistRef.current.length;
      const mean = tempHistRef.current.reduce((a, b) => a + b, 0) / n;
      const stdDev = Math.sqrt(
        tempHistRef.current.reduce((s, t) => s + (t - mean) ** 2, 0) / n
      );
      if (stdDev > 2.5 && canAlert('temp-stability', 300_000)) {
        addAlert(
          `Temperature instability detected (σ = ${stdDev.toFixed(1)}°C). Possible compressor fault.`,
          'warning', '📊',
          'σ = √(Σ(T − T̄)² / n), alert when σ > 2.5°C',
          stdDev
        );
      }
    }

    /* ── FORMULA 4: Humidity bounds ─────────────────────────────── */
    if (H > 85 && canAlert('hum-critical', 120_000)) {
      addAlert(
        `Critical humidity: ${Math.round(H)}% — condensation and mould risk.`,
        'critical', '💧',
        'Threshold: H > 85%',
        H
      );
    } else if (H > 75 && canAlert('hum-high', 120_000)) {
      addAlert(
        `High humidity: ${Math.round(H)}% — check door seals.`,
        'warning', '💧',
        'Threshold: H > 75%',
        H
      );
    } else if (H < 20 && canAlert('hum-low', 120_000)) {
      addAlert(
        `Very low humidity: ${Math.round(H)}% — food may dry out.`,
        'info', '🏜️',
        'Threshold: H < 20%',
        H
      );
    }

    /* ── FORMULA 5: Food safety composite score ─────────────────── */
    // S = 100 − (0.5·|T − 4| + 0.3·|H − 60|)
    const S = Math.max(0, 100 - (0.5 * Math.abs(T - 4) + 0.3 * Math.abs(H - 60)));
    if (S < 40 && canAlert('food-safety-critical', 300_000)) {
      addAlert(
        `Food safety score: ${S.toFixed(0)}/100 — conditions are unsafe. Act immediately.`,
        'critical', '🦠',
        'S = 100 − (0.5·|T−4| + 0.3·|H−60|)',
        S
      );
    } else if (S < 65 && canAlert('food-safety-warn', 300_000)) {
      addAlert(
        `Food safety score: ${S.toFixed(0)}/100 — suboptimal conditions.`,
        'warning', '🦠',
        'S = 100 − (0.5·|T−4| + 0.3·|H−60|)',
        S
      );
    }

  }, [addAlert]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissAlert = useCallback((id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const dismissAll = useCallback(() => setAlerts([]), []);

  return { alerts, addAlert, analyzeSensor, dismissAlert, dismissAll };
}