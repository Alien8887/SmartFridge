import React from 'react';
import {
  AlertCircle, Trash2, Zap, Wifi, WifiOff, Clock, Settings, Plus, Minus,
  Bell, CheckCircle2, X, BrainCircuit, TrendingUp, TrendingDown,
  AlertOctagon, ShieldCheck, Sparkles, Volume2, Gauge,
} from 'lucide-react';
import { Card }              from '../../components/ui/Card';
import { StatCard }          from '../../components/ui/StatCard';
import { ConsumptionChart }  from '../../components/charts/ConsumptionChart';
import { DeviceConnectCard } from '../../components/ui/DeviceConnectCard';
import type { EnhancedAlert } from '../../hooks/useAlerts';
import type { MLResult, SmartAdvice } from '../../hooks/useMLPredictions';
import { SensorData, InventoryItem, ConsumptionData, Theme } from '../../types';
import { modes } from '../../data/modes';

interface DashboardViewProps {
  sensorData:         SensorData;
  alerts:             EnhancedAlert[];
  inventory:          InventoryItem[];
  consumptionHistory: ConsumptionData[];
  totalConsumed:      number;
  totalWasted:        number;

  currentMode:    string;
  setCurrentMode: (id: string) => void;

  targetTemp:      number;
  goalTemp:        number;
  aiAdjusted:      boolean;
  aiReason:        string | null;
  servoAngle:      number;
  doorAlarmActive: boolean;
  setTargetTemp:   (t: number) => void;
  isConnected:     boolean;

  ml:              MLResult | null;
  advice:          SmartAdvice | null;
  mlLoading:       boolean;
  aiLoading:       boolean;
  mlUpdatedAt:     number | null;
  adviceUpdatedAt: number | null;
  onRunPredictions: () => void;
  onGetAdvice:      () => void;

  onDismissAlert: (id: number) => void;
  onDismissAll:   () => void;

  token:    string;
  darkMode: boolean;
  theme:    Theme;
}

const severityStyles = {
  critical: { bg: 'bg-red-500/10 border-red-500/30' },
  warning:  { bg: 'bg-yellow-500/10 border-yellow-500/30' },
  info:     { bg: 'bg-blue-500/10 border-blue-500/30' },
} as const;

const gradeColor: Record<string, string> = { A: 'text-emerald-400', B: 'text-green-400', C: 'text-yellow-400', D: 'text-red-400' };
const trendIcon = { rising: TrendingUp, falling: TrendingDown, stable: Minus };

function timeAgo(ts: number | null): string {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function DashboardView({
  sensorData, alerts, inventory,
  consumptionHistory, totalConsumed, totalWasted,
  currentMode, setCurrentMode,
  targetTemp, goalTemp, aiAdjusted, aiReason, servoAngle, doorAlarmActive, setTargetTemp, isConnected,
  ml, advice, mlLoading, aiLoading, mlUpdatedAt, adviceUpdatedAt, onRunPredictions, onGetAdvice,
  onDismissAlert, onDismissAll,
  token, darkMode, theme,
}: DashboardViewProps) {

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const TrendIcon = ml ? trendIcon[ml.forecast.trend] : Minus;
  const servoPct = Math.round((servoAngle / 180) * 100);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">

      {/* Connect prompt — only shown until a real fridge is talking to us */}
      {!isConnected && <DeviceConnectCard token={token} darkMode={darkMode} theme={theme} />}

      {/* Connection status */}
      <Card className={`${theme.card} ${isConnected ? 'border-emerald-500/40' : 'border-red-500/40'} animate-slide-down`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="relative">
                <Wifi className="w-6 h-6 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            ) : (
              <WifiOff className="w-6 h-6 text-red-400 animate-pulse" />
            )}
            <div>
              <h3 className={`font-semibold ${theme.text}`}>
                {isConnected ? '✓ Fridge connected — live data' : '✗ Fridge offline'}
              </h3>
              <p className={`text-xs flex items-center gap-1 mt-0.5 ${theme.textMuted}`}>
                <Clock className="w-3 h-3" />
                {sensorData.lastUpdate ? `Updated ${new Date(sensorData.lastUpdate).toLocaleTimeString()}` : 'No data received yet'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex md:gap-6 gap-3">
            {[
              { label: 'Temperature', val: `${sensorData.temperature.toFixed(1)}°C` },
              { label: 'Humidity',    val: `${Math.round(sensorData.humidity)}%` },
              { label: 'Door',        val: sensorData.doorOpen ? 'OPEN' : 'CLOSED',
                color: sensorData.doorOpen ? 'text-red-400' : 'text-emerald-400' },
              { label: 'Weight',      val: `${sensorData.pressure.toFixed(1)} kg` },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${color || (isConnected ? theme.accent : theme.textMuted)}`}>{val}</div>
                <div className={`text-xs ${theme.textMuted}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* AI intelligence panel — purple is reserved for this block only, so it's
          instantly recognizable as the AI section of the dashboard. */}
      <div className={`rounded-xl border p-4 space-y-4 animate-fade-in ${
        darkMode ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50/60 border-purple-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <span className={`font-semibold ${theme.text}`}>AI analysis</span>
            {ml && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                {ml.modelInfo.dataPoints} readings · {timeAgo(mlUpdatedAt)}
              </span>
            )}
          </div>
          <button
            onClick={onRunPredictions}
            disabled={mlLoading}
            className="text-xs px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
          >
            {mlLoading ? 'Analyzing…' : ml ? 'Refresh' : 'Run analysis'}
          </button>
        </div>

        {!ml ? (
          <p className={`text-sm ${theme.textMuted}`}>
            Five real models run server-side on your sensor history: EWMA smoothing, linear-regression
            forecasting, Z-score anomaly detection, the Q10 spoilage-rate model, and a composite food-safety
            score. Run analysis to see them applied to your fridge.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`rounded-lg p-3 text-center ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <div className="text-2xl font-bold text-purple-400 animate-number-pop">{ml.smoothedTemp}°C</div>
                <div className={`text-xs ${theme.textMuted}`}>Smoothed (EWMA)</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${ml.forecast.willExceedSafe ? 'bg-red-500/10' : darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${ml.forecast.willExceedSafe ? 'text-red-400' : 'text-purple-400'}`}>
                  {ml.forecast.in6Hours}°C <TrendIcon className="w-4 h-4" />
                </div>
                <div className={`text-xs ${theme.textMuted}`}>6h forecast ({ml.forecast.confidence}%)</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <div className={`text-2xl font-bold ${gradeColor[ml.safetyGrade] || 'text-purple-400'}`}>
                  {ml.safetyScore}<span className="text-sm">/100</span>
                </div>
                <div className={`text-xs ${theme.textMuted}`}>Safety score (grade {ml.safetyGrade})</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${ml.anomaly.isAnomaly ? 'bg-yellow-500/10' : darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <div className={`flex justify-center ${ml.anomaly.isAnomaly ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {ml.anomaly.isAnomaly ? <AlertOctagon className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div className={`text-xs ${theme.textMuted} mt-1`}>
                  {ml.anomaly.isAnomaly ? `Z=${ml.anomaly.zScore} anomaly` : 'Normal range'}
                </div>
              </div>
            </div>

            {ml.spoilageRisks.length > 0 && (
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${theme.textMuted}`}>
                  Spoilage risk at {ml.currentTemp}°C (Q10 model)
                </p>
                <div className="space-y-1.5">
                  {ml.spoilageRisks.slice(0, 4).map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className={`flex-1 text-xs truncate ${theme.text}`}>{item.name}</span>
                      <div className="w-24 h-1.5 rounded-full bg-slate-600 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.priority === 'urgent' ? 'bg-red-500' : item.priority === 'soon' ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${item.spoilageRisk}%` }}
                        />
                      </div>
                      <span className={`text-xs w-9 text-right font-medium ${
                        item.priority === 'urgent' ? 'text-red-400' : item.priority === 'soon' ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>{item.spoilageRisk}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ml.insights.slice(0, 3).map((ins, i) => (
              <p key={i} className={`text-xs ${theme.textMuted}`}>{ins}</p>
            ))}

            <div className={`border-t pt-3 ${darkMode ? 'border-purple-500/20' : 'border-purple-200'}`}>
              {!advice ? (
                <button
                  onClick={onGetAdvice}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-sky-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiLoading ? 'Asking Claude…' : 'Get Claude AI advice'}
                </button>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <p className={`text-xs font-semibold flex items-center gap-1 ${theme.textMuted}`}>
                    <Sparkles className="w-3 h-3 text-purple-400" /> {advice.overallAssessment}
                    {adviceUpdatedAt && <span className="ml-auto font-normal">{timeAgo(adviceUpdatedAt)}</span>}
                  </p>
                  {advice.recommendations?.map((rec, i) => (
                    <div key={i} className={`rounded-lg p-2 text-xs border ${
                      rec.priority === 'high' ? 'bg-red-500/10 border-red-500/20'
                      : rec.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      <span className={`font-medium ${
                        rec.priority === 'high' ? 'text-red-400' : rec.priority === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>{rec.action}</span>
                      <span className={theme.textMuted}> — {rec.reason}</span>
                    </div>
                  ))}
                  <button onClick={onGetAdvice} className={`text-xs ${theme.textMuted} hover:${theme.text} transition-colors`}>↻ Refresh advice</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className={`${theme.card} ${criticalAlerts.length > 0 ? 'border-red-500/30' : 'border-yellow-500/30'} animate-slide-down`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
              <Bell className="w-5 h-5 text-yellow-400" />
              Alerts ({alerts.length})
              {criticalAlerts.length > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{criticalAlerts.length} critical</span>
              )}
            </h3>
            {alerts.length > 1 && (
              <button onClick={onDismissAll} className={`text-xs ${theme.textMuted} hover:${theme.text} transition-colors`}>Dismiss all</button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${severityStyles[alert.severity].bg} animate-slide-down`}>
                <span className="text-base flex-shrink-0">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${theme.text}`}>{alert.message}</p>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>{alert.timestamp.toLocaleTimeString()}</p>
                </div>
                {/* Fixed-contrast dismiss button — never relies on a hover class
                    that could vanish against a dark severity background. */}
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="flex-shrink-0 p-1 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-white transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Target vs goal temperature + hardware status */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4`}>Temperature control</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted} mb-1`}>Your target</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setTargetTemp(targetTemp - 0.5)}
                className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors active:scale-95">
                <Minus className="w-4 h-4" />
              </button>
              <div className={`text-3xl font-bold ${theme.accent}`}>{targetTemp.toFixed(1)}°C</div>
              <button onClick={() => setTargetTemp(targetTemp + 0.5)}
                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors active:scale-95">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted} mb-1`}>Fridge is chasing</p>
            <div className={`text-3xl font-bold ${aiAdjusted ? 'text-purple-400' : theme.accent}`}>
              {goalTemp.toFixed(1)}°C
            </div>
            {aiAdjusted ? (
              <p className="text-xs text-purple-400 mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> AI-lowered: {aiReason}
              </p>
            ) : (
              <p className={`text-xs ${theme.textMuted} mt-1`}>Matches your target</p>
            )}
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Gauge className={`w-4 h-4 flex-shrink-0 ${theme.textMuted}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className={theme.textMuted}>Cooling valve</span>
                <span className={theme.text}>{servoAngle}°</span>
              </div>
              <div className={`h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${servoPct}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className={`w-4 h-4 flex-shrink-0 ${doorAlarmActive ? 'text-red-400 animate-pulse' : theme.textMuted}`} />
            <span className={`text-xs ${doorAlarmActive ? 'text-red-400 font-medium' : theme.textMuted}`}>
              {doorAlarmActive ? 'Door alarm sounding' : sensorData.doorOpen ? 'Door open' : 'Door closed, buzzer idle'}
            </span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<AlertCircle className="w-6 h-6" />}
          value={inventory.filter(i => i.expiry <= 3).length.toString()} label="Near expiry"
          badge={{ text: `${inventory.filter(i => i.expiry <= 1).length} URGENT`, color: 'bg-red-500/20 text-red-400' }} theme={theme} />
        <StatCard icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          value={String(totalConsumed)} label="Items consumed"
          badge={{ text: 'TRACKED', color: 'bg-emerald-500/20 text-emerald-400' }} theme={theme} />
        <StatCard icon={<Trash2 className="w-6 h-6 text-red-400" />}
          value={String(totalWasted)} label="Items wasted"
          badge={totalWasted > 5 ? { text: 'HIGH WASTE', color: 'bg-red-500/20 text-red-400' } : { text: 'LOW WASTE', color: 'bg-emerald-500/20 text-emerald-400' }} theme={theme} />
        <StatCard icon={<Zap className="w-6 h-6 text-yellow-400" />}
          value={String(inventory.length)} label="Total items"
          badge={{ text: 'IN FRIDGE', color: 'bg-sky-500/20 text-sky-400' }} theme={theme} />
      </div>

      {/* Mode */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4 flex items-center gap-2`}>
          <Settings className="w-4 h-4" /> Active mode
        </h3>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {modes.map(mode => {
            const Icon = mode.icon;
            const active = currentMode === mode.id;
            return (
              <button
                key={mode.id} onClick={() => setCurrentMode(mode.id)}
                className={`p-2 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                  active ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/20' : `border-transparent ${theme.hover}`
                }`}
              >
                <Icon className={`w-4 md:w-6 h-4 md:h-6 mx-auto mb-1 ${active ? 'text-sky-400' : theme.textMuted}`} />
                <div className={`text-xs font-medium ${active ? theme.text : theme.textMuted}`}>{mode.name}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Consumption — the one chart that belongs on the dashboard; full
          temperature/humidity/pressure history lives in the Environment tab
          so this page doesn't repeat the same data twice. */}
      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4`}>Weekly consumption</h3>
        <ConsumptionChart data={consumptionHistory} darkMode={darkMode} />
      </Card>
    </div>
  );
}