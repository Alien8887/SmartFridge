import React, { useState, useEffect, useCallback } from 'react';
import { Snowflake, UserPlus, LogIn }                from 'lucide-react';
import { Header }         from '../components/layout/Header';
import { Sidebar }        from '../components/layout/Sidebar';
import { MobileMenu }     from '../components/layout/MobileMenu';
import { DashboardView }  from '../features/dashboard/DashboardView';
import { InventoryView }  from '../features/inventory/InventoryView';
import { SuggestionsView } from '../features/suggestions/SuggestionsView';
import { EnvironmentView } from '../features/environment/EnvironmentView';
import { MLPanel }        from '../components/ui/MLPanel';
import { useTheme }       from '../hooks/useTheme';
import { useAuth }        from '../hooks/useAuth';
import { useESP32Sensors } from '../hooks/useESP32Sensors';
import { useAlerts }      from '../hooks/useAlerts';
import { useInventory }   from '../hooks/useInventory';
import { useConsumption } from '../hooks/useConsumption';
import { useMLPredictions } from '../hooks/useMLPredictions';

function App() {
  const { user, loading: authLoading, error: authError, setError: setAuthError, login, register, logout, getToken } = useAuth();
  const { darkMode, setDarkMode, theme } = useTheme();

  const { alerts, addAlert, analyzeSensor, dismissAlert, dismissAll } = useAlerts();
  const { sensorData, temperatureHistory, humidityHistory, pressureHistory, energyHistory, doorOpenCount, totalEnergyLost, adjustTemperature } = useESP32Sensors(addAlert, getToken);
  const { inventory, addProduct, removeProduct } = useInventory();
  const { consumptionHistory, logItem, totalConsumed, totalWasted }    = useConsumption();
  const { ml, advice, loading: mlLoading, aiLoading, runPredictions, getAIAdvice } = useMLPredictions(getToken);

  const [loginUsername, setLoginUser]  = useState('');
  const [loginPassword, setLoginPass]  = useState('');
  const [regUsername,   setRegUser]    = useState('');
  const [regPassword,   setRegPass]    = useState('');
  const [regSuccess,    setRegSuccess] = useState('');
  const [showRegister,  setShowReg]    = useState(false);
  const [activeView,    setActiveView] = useState('dashboard');
  const [currentMode,   setCurrentMode] = useState(() => localStorage.getItem('current-mode') || 'normal');
  const [mobileOpen,    setMobileOpen] = useState(false);

  // Analyse sensor data for ML-backed alerts
  useEffect(() => { if (sensorData.connected) analyzeSensor(sensorData); }, [sensorData, analyzeSensor]);

  // Auto-run ML predictions every 5 minutes when connected
  useEffect(() => {
    if (!sensorData.connected || !user) return;
    runPredictions(sensorData.temperature, sensorData.humidity, inventory);
    const id = setInterval(() => runPredictions(sensorData.temperature, sensorData.humidity, inventory), 300_000);
    return () => clearInterval(id);
  }, [sensorData.connected, sensorData.temperature, sensorData.humidity, inventory, user, runPredictions]);

  const handleConsume = useCallback((id: number, cat: string) => { logItem(cat, 'consume'); removeProduct(id); }, [logItem, removeProduct]);
  const handleWaste   = useCallback((id: number, cat: string) => { logItem(cat, 'waste');   removeProduct(id); }, [logItem, removeProduct]);

  // ── Auth gate ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="w-10 h-10 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
        <div className={`${theme.card} border rounded-3xl p-8 md:p-10 shadow-2xl w-full max-w-md animate-scale-in`}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/30 animate-glow-pulse">
              <Snowflake className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${theme.text} mb-1`}>Smart Fridge</h1>
            <p className={`text-sm ${theme.textMuted}`}>Intelligent Food Management</p>
          </div>

          {/* Tabs */}
          <div className={`flex rounded-xl overflow-hidden border mb-6 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            {[{ id: false, label: 'Sign In', icon: LogIn }, { id: true, label: 'Register', icon: UserPlus }].map(t => (
              <button key={String(t.id)} onClick={() => { setShowReg(t.id); setAuthError(null); setRegSuccess(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  showRegister === t.id ? 'bg-sky-500 text-white' : `${theme.hover} ${theme.text}`
                }`}
              >
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          {authError  && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-slide-down">{authError}</div>}
          {regSuccess && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center animate-slide-down">{regSuccess}</div>}

          <div className="space-y-4">
            {!showRegister ? (
              // Login
              <>
                <input type="text" value={loginUsername} onChange={e => { setLoginUser(e.target.value); setAuthError(null); }}
                  onKeyDown={e => e.key === 'Enter' && login(loginUsername, loginPassword)}
                  placeholder="Username" autoComplete="username"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`}
                />
                <input type="password" value={loginPassword} onChange={e => { setLoginPass(e.target.value); setAuthError(null); }}
                  onKeyDown={e => e.key === 'Enter' && login(loginUsername, loginPassword)}
                  placeholder="Password" autoComplete="current-password"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`}
                />
                <button onClick={() => login(loginUsername, loginPassword)}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-sky-500/20">
                  Sign In
                </button>
                <div className={`p-3 rounded-xl text-xs space-y-0.5 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                  <p className={`font-semibold ${theme.textMuted} mb-1`}>Default accounts:</p>
                  <p className={theme.textMuted}>admin / admin123 · user / user123 · guest / guest</p>
                  <p className={`text-xs ${theme.textMuted} opacity-60`}>(Run /api/auth/seed once to create these)</p>
                </div>
              </>
            ) : (
              // Register
              <>
                <input type="text" value={regUsername} onChange={e => { setRegUser(e.target.value); setAuthError(null); }}
                  placeholder="Choose username (3–20 chars)" autoComplete="username"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`}
                />
                <input type="password" value={regPassword} onChange={e => { setRegPass(e.target.value); setAuthError(null); }}
                  placeholder="Choose password (min 4 chars)" autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`}
                />
                <button onClick={async () => {
                    const ok = await register(regUsername, regPassword);
                    if (ok) { setRegSuccess('Account created! You can now sign in.'); setRegUser(''); setRegPass(''); setShowReg(false); }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all active:scale-95">
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            <MLPanel
              ml={ml} advice={advice} loading={mlLoading} aiLoading={aiLoading}
              onRefresh={() => runPredictions(sensorData.temperature, sensorData.humidity, inventory)}
              onGetAdvice={() => getAIAdvice(sensorData.temperature, sensorData.humidity, inventory, doorOpenCount)}
              darkMode={darkMode} theme={theme}
            />
            <DashboardView
              sensorData={sensorData} alerts={alerts} inventory={inventory}
              temperatureHistory={temperatureHistory} humidityHistory={humidityHistory} pressureHistory={pressureHistory}
              consumptionHistory={consumptionHistory} totalConsumed={totalConsumed} totalWasted={totalWasted}
              currentMode={currentMode}
              setCurrentMode={m => { setCurrentMode(m); try { localStorage.setItem('current-mode', m); } catch {} }}
              adjustTemperature={adjustTemperature}
              onDismissAlert={dismissAlert} onDismissAll={dismissAll}
              darkMode={darkMode} theme={theme}
            />
          </>
        );
      case 'inventory':
        return (
          <InventoryView
            inventory={inventory}
            onAddProduct={(p, q) => addProduct(p, q)}
            onConsume={handleConsume} onWaste={handleWaste}
            darkMode={darkMode} theme={theme}
          />
        );
      case 'suggestions':
        return <SuggestionsView inventory={inventory} totalConsumed={totalConsumed} totalWasted={totalWasted} darkMode={darkMode} theme={theme} />;
      case 'environment':
        return (
          <EnvironmentView
            sensorData={sensorData} energyHistory={energyHistory}
            doorOpenCount={doorOpenCount} totalEnergyLost={totalEnergyLost}
            darkMode={darkMode} theme={theme}
          />
        );
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500`}>
      <Header
        username={user.username} darkMode={darkMode} setDarkMode={setDarkMode}
        onLogout={logout} mobileMenuOpen={mobileOpen} setMobileMenuOpen={setMobileOpen}
        isConnected={sensorData.connected} theme={theme}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 flex gap-4 md:gap-6">
        <Sidebar activeView={activeView} setActiveView={setActiveView} theme={theme} />
        <MobileMenu isOpen={mobileOpen} activeView={activeView} setActiveView={setActiveView} onClose={() => setMobileOpen(false)} theme={theme} />
        <main className="flex-1 min-w-0 space-y-4 md:space-y-6">{renderView()}</main>
      </div>
    </div>
  );
}

export default App;