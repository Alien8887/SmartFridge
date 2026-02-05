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
import { Product } from '../types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [currentMode, setCurrentMode] = useState('normal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { darkMode, setDarkMode, theme } = useTheme();
  const { alerts, addAlert } = useAlerts();
  const { inventory, addProduct } = useInventory();
  const { 
    sensorData, 
    temperatureHistory, 
    humidityHistory, 
    pressureHistory,
    adjustTemperature 
  } = useESP32Sensors(addAlert);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = () => {
    try {
      const loginData = localStorage.getItem('user-session');
      if (loginData) {
        const session = JSON.parse(loginData);
        setIsLoggedIn(true);
        setUsername(session.username);
      }

      const modeData = localStorage.getItem('current-mode');
      if (modeData) {
        setCurrentMode(modeData);
      }
    } catch (error) {
      console.log('No stored data');
    }
  };

  const handleLogin = () => {
    if (loginUsername.trim()) {
      setUsername(loginUsername.trim());
      setIsLoggedIn(true);
      try {
        localStorage.setItem('user-session', JSON.stringify({ username: loginUsername.trim() }));
      } catch (error) {
        console.error('Save failed');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setLoginUsername('');
    setLoginPassword('');
    try {
      localStorage.removeItem('user-session');
    } catch (error) {
      console.error('Clear failed');
    }
  };

  const handleAddProduct = (product: Product) => {
    addProduct(product);
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
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your username"
                className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-sky-500`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter password (demo only)"
                className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-sky-500`}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/30 transition-all"
            >
              Sign In
            </button>
          </div>

          <p className={`text-xs ${theme.textMuted} text-center mt-6`}>
            Demo Mode - Any credentials will work
          </p>
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
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            adjustTemperature={adjustTemperature}
            darkMode={darkMode}
            theme={theme}
          />
        );
      case 'inventory':
        return (
          <InventoryView
            inventory={inventory}
            onAddProduct={handleAddProduct}
            darkMode={darkMode}
            theme={theme}
          />
        );
      case 'suggestions':
        return <SuggestionsView darkMode={darkMode} theme={theme} />;
      case 'environment':
        return <EnvironmentView sensorData={sensorData} darkMode={darkMode} theme={theme} />;
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
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          theme={theme}
        />

        <MobileMenu
          isOpen={mobileMenuOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          onClose={() => setMobileMenuOpen(false)}
          theme={theme}
        />

        <div className="flex-1 min-w-0">
          {renderView()}
        </div>
      </div>
    </div>
  );
}

export default App;