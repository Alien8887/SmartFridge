import React, { useState } from 'react';
import {
  BrainCircuit, TrendingUp, TrendingDown, Minus,
  AlertOctagon, ShieldCheck, Sparkles,
} from 'lucide-react';
import { MLResult, SmartAdvice } from '../../hooks/useMLPredictions';
import { Theme } from '../../types';

interface MLPanelProps {
  ml:          MLResult | null;
  advice:      SmartAdvice | null;
  loading:     boolean;
  aiLoading:   boolean;
  onRefresh:   () => void;
  onGetAdvice: () => void;
  darkMode:    boolean;
  theme:       Theme;
}

const gradeColor: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-green-400',
  C: 'text-yellow-400',
  D: 'text-red-400',
};

const trendIcon = {
  rising:  TrendingUp,
  falling: TrendingDown,
  stable:  Minus,
};

export function MLPanel({
  ml, advice, loading, aiLoading,
  onRefresh, onGetAdvice, darkMode, theme,
}: MLPanelProps) {
  const [showModels, setShowModels] = useState(false);

  if (loading) {
    return (
      <div className={`${theme.card} border rounded-xl p-4 flex items-center gap-3 animate-pulse`}>
        <BrainCircuit className="w-6 h-6 text-purple-400" />
        <span className={theme.textMuted}>Running ML algorithms…</span>
      </div>
    );
  }

  if (!ml) {
    return (
      <div className={`${theme.card} border rounded-xl p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-purple-400" />
          <div>
            <p className={`font-medium ${theme.text}`}>ML Prediction Engine</p>
            <p className={`text-xs ${theme.textMuted}`}>
              EWMA · OLS Regression · Z-Score · Q10 Spoilage
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
        >
          Run Analysis
        </button>
      </div>
    );
  }

  const TrendIcon = trendIcon[ml.forecast.trend];

  return (
    <div className={`${theme.card} border rounded-xl p-4 space-y-4 animate-fade-in`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          <span className={`font-semibold ${theme.text}`}>ML Analysis</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
            {ml.modelInfo.dataPoints} readings
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className={`text-xs ${theme.textMuted} hover:${theme.text} transition-colors`}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => setShowModels(!showModels)}
            className={`text-xs ${theme.textMuted} transition-colors`}
          >
            {showModels ? 'Hide models' : 'Show models'}
          </button>
        </div>
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* EWMA smoothed */}
        <div className={`rounded-lg p-3 text-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
          <div className={`text-2xl font-bold ${theme.accent}`}>{ml.smoothedTemp}°C</div>
          <div className={`text-xs ${theme.textMuted}`}>EWMA smoothed</div>
        </div>

        {/* 6h forecast */}
        <div className={`rounded-lg p-3 text-center ${
          ml.forecast.willExceedSafe ? 'bg-red-500/10' : darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
        }`}>
          <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
            ml.forecast.willExceedSafe ? 'text-red-400' : theme.accent
          }`}>
            {ml.forecast.in6Hours}°C
            <TrendIcon className="w-4 h-4" />
          </div>
          <div className={`text-xs ${theme.textMuted}`}>
            6h forecast ({ml.forecast.confidence}%)
          </div>
          {ml.forecast.willExceedSafe && (
            <div className="text-xs text-red-400 font-medium mt-1">⚠️ Exceeds safe</div>
          )}
        </div>

        {/* Safety score */}
        <div className={`rounded-lg p-3 text-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
          <div className={`text-2xl font-bold ${gradeColor[ml.safetyGrade] || theme.accent}`}>
            {ml.safetyScore}<span className="text-sm">/100</span>
          </div>
          <div className={`text-xs ${theme.textMuted}`}>
            Safety score (grade {ml.safetyGrade})
          </div>
        </div>

        {/* Anomaly */}
        <div className={`rounded-lg p-3 text-center ${
          ml.anomaly.isAnomaly ? 'bg-yellow-500/10' : darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
        }`}>
          <div className={`flex justify-center ${ml.anomaly.isAnomaly ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {ml.anomaly.isAnomaly
              ? <AlertOctagon className="w-7 h-7" />
              : <ShieldCheck className="w-7 h-7" />}
          </div>
          <div className={`text-xs ${theme.textMuted} mt-1`}>
            {ml.anomaly.isAnomaly ? `Z=${ml.anomaly.zScore} anomaly` : 'Normal range'}
          </div>
        </div>
      </div>

      {/* Q10 spoilage risks */}
      {ml.spoilageRisks.length > 0 && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${theme.textMuted}`}>
            Q10 Spoilage Risk at {ml.currentTemp}°C
          </p>
          <div className="space-y-1.5">
            {ml.spoilageRisks.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <div className={`flex-1 text-xs truncate ${theme.text}`}>{item.name}</div>
                <div className="w-24 h-1.5 rounded-full bg-slate-600 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.priority === 'urgent' ? 'bg-red-500'
                      : item.priority === 'soon'  ? 'bg-yellow-500'
                      :                             'bg-emerald-500'
                    }`}
                    style={{ width: `${item.spoilageRisk}%` }}
                  />
                </div>
                <span className={`text-xs w-10 text-right font-medium ${
                  item.priority === 'urgent' ? 'text-red-400'
                  : item.priority === 'soon'  ? 'text-yellow-400'
                  :                             'text-emerald-400'
                }`}>
                  {item.spoilageRisk}%
                </span>
                <span className={`text-xs w-8 ${theme.textMuted}`}>{item.adjustedDaysLeft}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML insights */}
      {ml.insights.length > 0 && (
        <div className="space-y-1">
          {ml.insights.map((ins, i) => (
            <p key={i} className={`text-xs ${theme.textMuted}`}>{ins}</p>
          ))}
        </div>
      )}

      {/* Claude AI advice */}
      <div className={`border-t pt-3 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        {!advice ? (
          <button
            onClick={onGetAdvice}
            disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-sky-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {aiLoading ? 'Getting AI advice…' : 'Get Claude AI Advice'}
          </button>
        ) : (
          <div className="space-y-2 animate-fade-in">
            <p className={`text-xs font-semibold ${theme.textMuted} flex items-center gap-1`}>
              <Sparkles className="w-3 h-3 text-purple-400" />
              {advice.overallAssessment}
            </p>
            {advice.recommendations?.map((rec, i) => (
              <div key={i} className={`rounded-lg p-2 text-xs border ${
                rec.priority === 'high'   ? 'bg-red-500/10 border-red-500/20'
                : rec.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20'
                :                             'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <span className={`font-medium ${
                  rec.priority === 'high'   ? 'text-red-400'
                  : rec.priority === 'medium' ? 'text-yellow-400'
                  :                             'text-emerald-400'
                }`}>
                  {rec.action}
                </span>
                <span className={theme.textMuted}> — {rec.reason}</span>
              </div>
            ))}
            <button
              onClick={onGetAdvice}
              className={`text-xs ${theme.textMuted} hover:${theme.text} transition-colors`}
            >
              ↻ Refresh advice
            </button>
          </div>
        )}
      </div>

      {/* Model details (expandable) */}
      {showModels && (
        <div className={`rounded-lg p-3 text-xs space-y-1 animate-fade-in ${
          darkMode ? 'bg-slate-800' : 'bg-slate-50'
        }`}>
          <p className={`font-semibold mb-1 ${theme.text}`}>Algorithms running</p>
          {ml.modelInfo.algorithms.map(a => (
            <p key={a} className={`font-mono ${theme.textMuted}`}>• {a}</p>
          ))}
          <p className={`mt-1 ${theme.textMuted}`}>
            R² = {ml.modelInfo.rSquared} · {ml.modelInfo.dataPoints} training points
          </p>
        </div>
      )}
    </div>
  );
}
