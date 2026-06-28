import React, { useState, useEffect } from 'react';
import { Snowflake } from 'lucide-react';
import { Header }        from '../components/layout/Header';
import { Sidebar }       from '../components/layout/Sidebar';
import { MobileMenu }    from '../components/layout/MobileMenu';
import { DashboardView } from '../features/dashboard/DashboardView';
import { InventoryView } from '../features/inventory/InventoryView';
import { SuggestionsView } from '../features/suggestions/SuggestionsView';
import { EnvironmentView } from '../features/environment/EnvironmentView';
import { useTheme }       from '../hooks/useTheme';
import { useESP32Sensors } from '../hooks/useESP32Sensors';
import { useAlerts }      from '../hooks/useAlerts';
import { useInventory }   from '../hooks/useInventory';
import { useConsumption } from '../hooks/useConsumption';

const VALID_USERS: Record<string, string> = {
  admin: 'admin123',
  user:  'user123',
  guest: 'guest',
};

function App() {
  // ── hooks (order matters: useAlerts before useESP32Sensors) ──────────
  const { inventory, addProduct, removeProduct }                = useInventory();
  const { consumptionHistory, logItem, totalConsumed, totalWasted } = useConsumption();
  const { darkMode, setDarkMode, theme }                        = useTheme();
  const { alerts, addAlert, analyzeSensor, dismissAlert, dismissAll } = useAlerts();
  const {
    sensorData, temperatureHistory, humidityHistory,
    pressureHistory, energyHistory, doorOpenCount,
    totalEnergyLost, adjustTemperature,
  } = useESP32Sensors(addAlert);

  // ── auth state ────────────────────────────────────────────────────────
  const [isLoggedIn,     setIsLoggedIn]     = useState(false);
  const [username,       setUsername]       = useState('');
  const [loginUsername,  setLoginUsername]  = useState('');
  const [loginPassword,  setLoginPassword]  = useState('');
  const [authError,      setAuthError]      = useState('');

  // ── UI state ──────────────────────────────────────────────────────────
  const [activeView,     setActiveView]     = useState('dashboard');
  const [currentMode,    setCurrentMode]    = useState('normal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Analyse sensor data for formula-based alerts ──────────────────────
  useEffect(() => {
    if (sensorData.connected) analyzeSensor(sensorData);
  }, [sensorData, analyzeSensor]);

  // ── Restore session ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user-session');
      if (raw) { const s = JSON.parse(raw); setIsLoggedIn(true); setUsername(s.username); }
      const mode = localStorage.getItem('current-mode');
      if (mode) setCurrentMode(mode);
    } catch { /* ignore */ }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogin = () => {
    const t = loginUsername.trim().toLowerCase();
    if (VALID_USERS[t] === loginPassword) {
      setUsername(t); setIsLoggedIn(true); setAuthError('');
      try { localStorage.setItem('user-session', JSON.stringify({ username: t })); } catch { /* ignore */ }
    } else {
      setAuthError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setUsername(''); setLoginUsername('');
    setLoginPassword(''); setAuthError(''); setActiveView('dashboard');
    try { localStorage.removeItem('user-session'); } catch { /* ignore */ }
  };

  const handleConsume = (id: number, category: string) => { logItem(category, 'consume'); removeProduct(id); };
  const handleWaste   = (id: number, category: string) => { logItem(category, 'waste');   removeProduct(id); };

  // ── Login screen ──────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
        <div className={`${theme.card} border rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full animate-scale-in`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/30 animate-glow-pulse">
              <Snowflake className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${theme.text} mb-1`}>Smart Fridge</h1>
            <p className={`text-sm ${theme.textMuted}`}>Intelligent Food Management System</p>
          </div>

          <div className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-sm text-center animate-slide-down">
                {authError}
              </div>
            )}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={e => { setLoginUsername(e.target.value); setAuthError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="admin / user / guest"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                           : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setAuthError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Enter password"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                           : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-sky-500/20"
            >
              Sign In
            </button>
          </div>

          <div className={`mt-6 p-3 rounded-xl text-xs space-y-1 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
            <p className={`font-semibold ${theme.textMuted}`}>Demo accounts:</p>
            {Object.entries(VALID_USERS).map(([u, p]) => (
              <p key={u} className={theme.textMuted}>{u} / {p}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── View renderer ─────────────────────────────────────────────────────
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            sensorData={sensorData}
            alerts={alerts}
            inventory={inventory}
            temperatureHistory={temperatureHistory}
            humidityHistory={humidityHistory}
            pressureHistory={pressureHistory}
            consumptionHistory={consumptionHistory}
            totalConsumed={totalConsumed}
            totalWasted={totalWasted}
            currentMode={currentMode}
            setCurrentMode={m => { setCurrentMode(m); try { localStorage.setItem('current-mode', m); } catch { /* ignore */ } }}
            adjustTemperature={adjustTemperature}
            onDismissAlert={dismissAlert}
            onDismissAll={dismissAll}
            darkMode={darkMode}
            theme={theme}
          />
        );
      case 'inventory':
        return (
          <InventoryView
            inventory={inventory}
            onAddProduct={addProduct}   // addProduct now accepts (product, quantity)
            onConsume={handleConsume}
            onWaste={handleWaste}
            darkMode={darkMode}
            theme={theme}
          />
        );
      case 'suggestions':
        return (
          <SuggestionsView
            inventory={inventory}
            totalConsumed={totalConsumed}
            totalWasted={totalWasted}
            darkMode={darkMode}
            theme={theme}
          />
        );
      case 'environment':
        return (
          <EnvironmentView
            sensorData={sensorData}
            energyHistory={energyHistory}
            doorOpenCount={doorOpenCount}
            totalEnergyLost={totalEnergyLost}
            darkMode={darkMode}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500`}>
      <Header
        username={username}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isConnected={sensorData.connected}
        theme={theme}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 flex gap-4 md:gap-6">
        <Sidebar activeView={activeView} setActiveView={setActiveView} theme={theme} />
        <MobileMenu
          isOpen={mobileMenuOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          onClose={() => setMobileMenuOpen(false)}
          theme={theme}
        />
        <div className="flex-1 min-w-0">{renderView()}</div>
      </div>
    </div>
  );
}

export default App;