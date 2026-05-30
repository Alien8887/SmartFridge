import React, { useState, useEffect } from 'react';
import { Snowflake } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileMenu } from '../components/layout/MobileMenu';
import { DashboardView } from '../features/dashboard/DashboardView';
import { InventoryView } from '../features/inventory/InventoryView';
import { SuggestionsView } from '../features/suggestions/SuggestionsView';
import { EnvironmentView } from '../features/environment/EnvironmentView';
import { useTheme } from '../hooks/useTheme';
import { useESP32Sensors } from '../hooks/useESP32Sensors';
import { useAlerts } from '../hooks/useAlerts';
import { useInventory } from '../hooks/useInventory';
import { useConsumption } from '../hooks/useConsumption';

const VALID_USERS: Record<string, string> = {
  admin:  'admin123',
  user:   'user123',
  guest:  'guest'
};

function App() {
  const { inventory, addProduct, removeProduct }          = useInventory();
  const { consumptionHistory, logItem, totalConsumed, totalWasted } = useConsumption();
  const { alerts, addAlert } = useAlerts();
  const {
    sensorData,
    temperatureHistory,
    humidityHistory,
    pressureHistory,
    energyHistory,
    doorOpenCount,
    totalEnergyLost,
    adjustTemperature
  } = useESP32Sensors(addAlert);

  const handleConsume = (id: number, category: string) => {
    logItem(category, 'consume');
    removeProduct(id);
  };

  const handleWaste = (id: number, category: string) => {
    logItem(category, 'waste');
    removeProduct(id);
  };

  const [isLoggedIn,     setIsLoggedIn]     = useState(false);
  const [username,       setUsername]       = useState('');
  const [loginUsername,  setLoginUsername]  = useState('');
  const [loginPassword,  setLoginPassword]  = useState('');
  const [authError,      setAuthError]      = useState('');
  const [activeView,     setActiveView]     = useState('dashboard');
  const [currentMode,    setCurrentMode]    = useState('normal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { darkMode, setDarkMode, theme } = useTheme();

  useEffect(() => {
    try {
      const loginData = localStorage.getItem('user-session');
      if (loginData) {
        const s = JSON.parse(loginData);
        setIsLoggedIn(true);
        setUsername(s.username);
      }
      const modeData = localStorage.getItem('current-mode');
      if (modeData) setCurrentMode(modeData);
    } catch {}
  }, []);

  const handleLogin = () => {
    const trimmed = loginUsername.trim().toLowerCase();
    if (VALID_USERS[trimmed] && VALID_USERS[trimmed] === loginPassword) {
      setUsername(trimmed);
      setIsLoggedIn(true);
      setAuthError('');
      try { localStorage.setItem('user-session', JSON.stringify({ username: trimmed })); } catch {}
    } else {
      setAuthError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setLoginUsername('');
    setLoginPassword('');
    setAuthError('');
    try { localStorage.removeItem('user-session'); } catch {}
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
        <div className={`${theme.card} border rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/50 flex items-center justify-center mb-4">
              <Snowflake className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Smart Fridge</h1>
            <p className={`text-sm ${theme.textMuted}`}>Intelligent Food Management System</p>
          </div>

          <div className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
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
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-sky-500`}
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
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-sky-500`}
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/30 transition-all"
            >
              Sign In
            </button>
          </div>

          <div className={`mt-6 p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
            <p className={`text-xs ${theme.textMuted} font-semibold mb-1`}>Accounts:</p>
            <p className={`text-xs ${theme.textMuted}`}>admin / admin123</p>
            <p className={`text-xs ${theme.textMuted}`}>user / user123</p>
            <p className={`text-xs ${theme.textMuted}`}>guest / guest</p>
          </div>
        </div>
      </div>
    );
  }

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
            setCurrentMode={m => { setCurrentMode(m); try { localStorage.setItem('current-mode', m); } catch {} }}
            adjustTemperature={adjustTemperature}
            darkMode={darkMode}
            theme={theme}
          />
        );
      case 'inventory':
        return (
          <InventoryView
            inventory={inventory}
            onAddProduct={addProduct}
            onConsume={handleConsume}
            onWaste={handleWaste}
            darkMode={darkMode}
            theme={theme}
          />
        );
      case 'suggestions':
        return <SuggestionsView darkMode={darkMode} theme={theme} />;
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

// Stable ref for addAlert before hooks stabilize
function addAlert_ref(msg: string) {}