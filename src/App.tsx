import React, { useState, useEffect } from 'react';
import { 
  Snowflake, AlertCircle, TrendingUp, ShoppingCart, 
  Thermometer, Droplets, Package, Clock, DollarSign,
  Users, Moon, Sun, Zap, Calendar, Apple, Beef,
  BarChart3, Settings, Image, CheckCircle2, Menu, X,
  LogOut, Wifi, WifiOff
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SmartFridge = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [currentMode, setCurrentMode] = useState('normal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real sensor states
  const [sensorData, setSensorData] = useState({
    temperature: 4.2,
    humidity: 65,
    doorOpen: false,
    pressure: 50,
    gasLevel: 0,
    lastUpdate: new Date().toISOString(),
    connected: false
  });

  // Mock inventory data (virtual)
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Fresh Milk', category: 'Dairy', expiry: 2, quantity: '1L', freshness: 85 },
    { id: 2, name: 'Greek Yogurt', category: 'Dairy', expiry: 5, quantity: '500g', freshness: 92 },
    { id: 3, name: 'Chicken Breast', category: 'Meat', expiry: 1, quantity: '800g', freshness: 70 },
    { id: 4, name: 'Broccoli', category: 'Vegetables', expiry: 3, quantity: '400g', freshness: 88 },
    { id: 5, name: 'Strawberries', category: 'Fruits', expiry: 2, quantity: '300g', freshness: 78 },
    { id: 6, name: 'Cheese Block', category: 'Dairy', expiry: 14, quantity: '250g', freshness: 95 },
    { id: 7, name: 'Orange Juice', category: 'Beverages', expiry: 4, quantity: '1L', freshness: 90 },
    { id: 8, name: 'Eggs', category: 'Dairy', expiry: 7, quantity: '12pcs', freshness: 94 }
  ]);

  // Load stored data on mount
  useEffect(() => {
    loadStoredData();
    // Simulate ESP32 connection
    connectToESP32();
  }, []);

  const loadStoredData = async () => {
    try {
      const loginResult = await window.storage.get('user-session', false);
      if (loginResult?.value) {
        const session = JSON.parse(loginResult.value);
        setIsLoggedIn(true);
        setUsername(session.username);
      }

      const inventoryResult = await window.storage.get('inventory', false);
      if (inventoryResult?.value) {
        setInventory(JSON.parse(inventoryResult.value));
      }

      const modeResult = await window.storage.get('current-mode', false);
      if (modeResult?.value) {
        setCurrentMode(modeResult.value);
      }
    } catch (error) {
      console.log('No stored data found, using defaults');
    }
  };

  const handleLogin = async () => {
    if (loginUsername.trim()) {
      setUsername(loginUsername.trim());
      setIsLoggedIn(true);
      try {
        await window.storage.set('user-session', JSON.stringify({ username: loginUsername.trim() }), false);
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setUsername('');
    setLoginUsername('');
    setLoginPassword('');
    try {
      await window.storage.delete('user-session', false);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  // Simulate ESP32 connection and receive sensor data
  const connectToESP32 = () => {
    // Simulate connection
    setSensorData(prev => ({ ...prev, connected: true }));

    // Poll for sensor updates every 2 seconds
    const interval = setInterval(async () => {
      try {
        // In production, this would fetch from your Vercel API endpoint
        // const response = await fetch('/api/sensors');
        // const data = await response.json();
        
        // For now, simulate sensor fluctuations
        setSensorData(prev => ({
          temperature: parseFloat((prev.temperature + (Math.random() - 0.5) * 0.2).toFixed(1)),
          humidity: Math.min(90, Math.max(30, prev.humidity + (Math.random() - 0.5) * 2)),
          doorOpen: Math.random() > 0.95 ? !prev.doorOpen : prev.doorOpen,
          pressure: Math.min(100, Math.max(0, prev.pressure + (Math.random() - 0.5) * 5)),
          gasLevel: Math.min(100, Math.max(0, prev.gasLevel + (Math.random() - 0.5))),
          lastUpdate: new Date().toISOString(),
          connected: true
        }));
      } catch (error) {
        setSensorData(prev => ({ ...prev, connected: false }));
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const consumptionData = [
    { day: 'Mon', dairy: 250, meat: 180, vegetables: 320, fruits: 150 },
    { day: 'Tue', dairy: 280, meat: 200, vegetables: 280, fruits: 180 },
    { day: 'Wed', dairy: 220, meat: 150, vegetables: 350, fruits: 200 },
    { day: 'Thu', dairy: 300, meat: 220, vegetables: 300, fruits: 170 },
    { day: 'Fri', dairy: 260, meat: 190, vegetables: 330, fruits: 190 },
    { day: 'Sat', dairy: 310, meat: 250, vegetables: 280, fruits: 220 },
    { day: 'Sun', dairy: 290, meat: 210, vegetables: 310, fruits: 200 }
  ];

  const energyData = [
    { time: '00:00', usage: 45, doorOpens: 0 },
    { time: '04:00', usage: 42, doorOpens: 0 },
    { time: '08:00', usage: 58, doorOpens: 12 },
    { time: '12:00', usage: 62, doorOpens: 8 },
    { time: '16:00', usage: 55, doorOpens: 6 },
    { time: '20:00', usage: 68, doorOpens: 15 },
    { time: '24:00', usage: 48, doorOpens: 3 }
  ];

  const categoryDistribution = [
    { name: 'Dairy', value: 35, color: '#60A5FA' },
    { name: 'Meat', value: 20, color: '#F87171' },
    { name: 'Vegetables', value: 25, color: '#34D399' },
    { name: 'Fruits', value: 15, color: '#FBBF24' },
    { name: 'Beverages', value: 5, color: '#A78BFA' }
  ];

  const mealSuggestions = [
    { name: 'Creamy Chicken Broccoli', ingredients: ['Chicken Breast', 'Broccoli', 'Fresh Milk'], time: '25 min' },
    { name: 'Greek Yogurt Parfait', ingredients: ['Greek Yogurt', 'Strawberries'], time: '5 min' },
    { name: 'Fresh Garden Salad', ingredients: ['Broccoli', 'Cheese Block'], time: '10 min' }
  ];

  const modes = [
    { id: 'normal', name: 'Normal', icon: Snowflake },
    { id: 'party', name: 'Party', icon: Users },
    { id: 'ramadan', name: 'Ramadan', icon: Moon },
    { id: 'diet', name: 'Diet', icon: Apple },
    { id: 'travel', name: 'Travel', icon: Calendar }
  ];

  const theme = {
    light: {
      bg: 'bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100',
      card: 'bg-white/80 backdrop-blur-lg border-slate-200',
      text: 'text-slate-900',
      textMuted: 'text-slate-600',
      accent: 'text-sky-600',
      hover: 'hover:bg-sky-50'
    },
    dark: {
      bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-black',
      card: 'bg-slate-800/50 backdrop-blur-lg border-slate-700',
      text: 'text-white',
      textMuted: 'text-slate-400',
      accent: 'text-sky-400',
      hover: 'hover:bg-slate-700/50'
    }
  };

  const t = darkMode ? theme.dark : theme.light;

  const getFreshnessColor = (freshness) => {
    if (freshness >= 85) return darkMode ? 'text-emerald-400' : 'text-emerald-600';
    if (freshness >= 70) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  };

  const getExpiryWarning = (days) => {
    if (days <= 1) return { color: 'bg-red-500', text: 'Urgent', glow: 'shadow-red-500/50' };
    if (days <= 3) return { color: 'bg-yellow-500', text: 'Soon', glow: 'shadow-yellow-500/50' };
    return { color: 'bg-emerald-500', text: 'Fresh', glow: 'shadow-emerald-500/50' };
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center p-4`}>
        <div className={`${t.card} border rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/50 flex items-center justify-center mb-4">
              <Snowflake className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${t.text} mb-2`}>Smart Fridge</h1>
            <p className={`text-sm ${t.textMuted}`}>Intelligent Food Management System</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${t.text} mb-2`}>Username</label>
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
              <label className={`block text-sm font-medium ${t.text} mb-2`}>Password</label>
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

          <p className={`text-xs ${t.textMuted} text-center mt-6`}>
            Demo Mode - Any credentials will work
          </p>
        </div>
      </div>
    );
  }

  const DashboardView = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Sensor Status Banner */}
      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {sensorData.connected ? (
              <Wifi className="w-6 h-6 text-emerald-400" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-400" />
            )}
            <div>
              <h3 className={`font-semibold ${t.text}`}>
                {sensorData.connected ? 'ESP32 Connected' : 'ESP32 Disconnected'}
              </h3>
              <p className={`text-xs ${t.textMuted}`}>
                Last update: {new Date(sensorData.lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:flex md:gap-6 gap-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${t.accent}`}>{sensorData.temperature}°C</div>
              <div className={`text-xs ${t.textMuted}`}>Temp</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${t.accent}`}>{Math.round(sensorData.humidity)}%</div>
              <div className={`text-xs ${t.textMuted}`}>Humidity</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.doorOpen ? 'text-red-400' : 'text-emerald-400'}`}>
                {sensorData.doorOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <div className={`text-xs ${t.textMuted}`}>Door</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${t.accent}`}>{Math.round(sensorData.pressure)}%</div>
              <div className={`text-xs ${t.textMuted}`}>Load</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className={`${t.accent} w-6 md:w-8 h-6 md:h-8`} />
            <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full bg-red-500/20 text-red-400`}>
              {inventory.filter(i => i.expiry <= 2).length} URGENT
            </span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${t.text} mb-1`}>
            {inventory.filter(i => i.expiry <= 3).length}
          </div>
          <div className={`text-xs md:text-sm ${t.textMuted}`}>Items Near Expiry</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className={`${t.accent} w-6 md:w-8 h-6 md:h-8`} />
            <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400`}>
              -23%
            </span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${t.text} mb-1`}>8.5kg</div>
          <div className={`text-xs md:text-sm ${t.textMuted}`}>Waste Prevented</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <Zap className={`${t.accent} w-6 md:w-8 h-6 md:h-8`} />
            <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full bg-sky-500/20 text-sky-400`}>
              OPTIMAL
            </span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${t.text} mb-1`}>52 kWh</div>
          <div className={`text-xs md:text-sm ${t.textMuted}`}>Energy This Week</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <DollarSign className={`${t.accent} w-6 md:w-8 h-6 md:h-8`} />
            <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400`}>
              SAVED $45
            </span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${t.text} mb-1`}>$187</div>
          <div className={`text-xs md:text-sm ${t.textMuted}`}>Monthly Budget</div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
          <Settings className="w-4 md:w-5 h-4 md:h-5" /> Active Mode
        </h3>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={async () => {
                  setCurrentMode(mode.id);
                  try {
                    await window.storage.set('current-mode', mode.id, false);
                  } catch (error) {
                    console.error('Failed to save mode:', error);
                  }
                }}
                className={`p-2 md:p-4 rounded-xl border-2 transition-all ${
                  currentMode === mode.id 
                    ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/30' 
                    : `border-transparent ${t.hover}`
                }`}
              >
                <Icon className={`w-4 md:w-6 h-4 md:h-6 mx-auto mb-1 md:mb-2 ${currentMode === mode.id ? 'text-sky-400' : t.textMuted}`} />
                <div className={`text-xs font-medium ${currentMode === mode.id ? t.text : t.textMuted}`}>
                  {mode.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4`}>Weekly Consumption</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={consumptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="day" stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="dairy" stackId="a" fill="#60A5FA" />
              <Bar dataKey="meat" stackId="a" fill="#F87171" />
              <Bar dataKey="vegetables" stackId="a" fill="#34D399" />
              <Bar dataKey="fruits" stackId="a" fill="#FBBF24" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4`}>Storage Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
                  borderRadius: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {categoryDistribution.map(cat => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className={`text-xs ${t.textMuted}`}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const InventoryView = () => (
    <div className="space-y-4 md:space-y-6">
      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-lg md:text-xl font-bold ${t.text} mb-4 md:mb-6 flex items-center gap-2`}>
          <Package className="w-5 md:w-6 h-5 md:h-6" /> Live Inventory
        </h3>
        <div className="space-y-3">
          {inventory.map(item => {
            const warning = getExpiryWarning(item.expiry);
            return (
              <div key={item.id} className={`${t.hover} rounded-xl p-3 md:p-4 border ${darkMode ? 'border-slate-700' : 'border-slate-200'} transition-all`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${warning.color} ${warning.glow} shadow-lg flex items-center justify-center shrink-0`}>
                      {item.category === 'Dairy' && <Droplets className="w-5 md:w-6 h-5 md:h-6 text-white" />}
                      {item.category === 'Meat' && <Beef className="w-5 md:w-6 h-5 md:h-6 text-white" />}
                      {item.category === 'Vegetables' && <Apple className="w-5 md:w-6 h-5 md:h-6 text-white" />}
                      {item.category === 'Fruits' && <Apple className="w-5 md:w-6 h-5 md:h-6 text-white" />}
                      {item.category === 'Beverages' && <Droplets className="w-5 md:w-6 h-5 md:h-6 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${t.text} truncate`}>{item.name}</div>
                      <div className={`text-xs md:text-sm ${t.textMuted}`}>{item.category} • {item.quantity}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs md:text-sm font-bold ${getFreshnessColor(item.freshness)}`}>
                      {item.freshness}%
                    </div>
                    <div className={`text-xs ${t.textMuted} flex items-center gap-1 justify-end mt-1`}>
                      <Clock className="w-3 h-3" />
                      {item.expiry}d
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${warning.color} transition-all duration-500`}
                    style={{ width: `${item.freshness}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const SuggestionsView = () => (
    <div className="space-y-4 md:space-y-6">
      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-lg md:text-xl font-bold ${t.text} mb-4 md:mb-6 flex items-center gap-2`}>
          <ShoppingCart className="w-5 md:w-6 h-5 md:h-6" /> Smart Meal Suggestions
        </h3>
        <div className="space-y-4">
          {mealSuggestions.map((meal, idx) => (
            <div key={idx} className={`${t.hover} rounded-xl p-4 md:p-5 border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h4 className={`font-semibold ${t.text} text-base md:text-lg`}>{meal.name}</h4>
                  <div className={`text-xs md:text-sm ${t.textMuted} flex items-center gap-2 mt-1`}>
                    <Clock className="w-4 h-4" /> {meal.time}
                  </div>
                </div>
                <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors text-sm">
                  Cook
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ing, i) => (
                  <span key={i} className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4`}>Smart Shopping List</h3>
        <div className="space-y-2">
          {['Fresh Milk (2L)', 'Chicken Breast (1kg)', 'Broccoli (500g)', 'Strawberries (400g)'].map((item, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${t.hover}`}>
              <CheckCircle2 className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} />
              <span className={`${t.text} text-sm md:text-base`}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const EnvironmentView = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 md:mb-6 flex items-center gap-2`}>
            <Thermometer className="w-4 md:w-5 h-4 md:h-5" /> Temperature (Real Sensor)
          </h3>
          <div className="text-center mb-6">
            <div className={`text-4xl md:text-5xl font-bold ${t.accent} mb-2`}>{sensorData.temperature}°C</div>
            <div className={`text-xs md:text-sm ${t.textMuted}`}>Optimal Range: 2-4°C</div>
          </div>
          <div className="h-3 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full" />
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 md:mb-6 flex items-center gap-2`}>
            <Droplets className="w-4 md:w-5 h-4 md:h-5" /> Humidity (Real Sensor)
          </h3>
          <div className="text-center mb-6">
            <div className={`text-4xl md:text-5xl font-bold ${t.accent} mb-2`}>{Math.round(sensorData.humidity)}%</div>
            <div className={`text-xs md:text-sm ${t.textMuted}`}>Optimal Range: 60-70%</div>
          </div>
          <div className="h-3 bg-gradient-to-r from-yellow-500 via-green-500 to-blue-500 rounded-full" />
        </div>
      </div>

      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4`}>Energy Usage & Door Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#64748b'} />
            <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
                borderRadius: '12px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="usage" stroke="#60A5FA" strokeWidth={3} name="Energy (kWh)" />
            <Line type="monotone" dataKey="doorOpens" stroke="#F87171" strokeWidth={3} name="Door Opens" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const views = {
    dashboard: DashboardView,
    inventory: InventoryView,
    suggestions: SuggestionsView,
    environment: EnvironmentView
  };

  const ViewComponent = views[activeView];

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-500`}>
      {/* Header */}
      <div className={`${t.card} border-b backdrop-blur-xl sticky top-0 z-50 shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl ${t.hover}`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/50 flex items-center justify-center">
              <Snowflake className="w-6 md:w-7 h-6 md:h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-lg md:text-2xl font-bold ${t.text}`}>Smart Fridge</h1>
              <p className={`text-xs ${t.textMuted} hidden sm:block`}>Welcome, {username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 md:p-3 rounded-xl ${t.hover} transition-colors`}
            >
              {darkMode ? <Sun className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} /> : <Moon className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} />}
            </button>
            <button
              onClick={handleLogout}
              className={`p-2 md:p-3 rounded-xl ${t.hover} transition-colors`}
            >
              <LogOut className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 flex gap-4 md:gap-6">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:block ${t.card} border rounded-2xl p-4 shadow-lg w-64 shrink-0 h-fit sticky top-24`}>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'inventory', icon: Package, label: 'Inventory' },
              { id: 'suggestions', icon: ShoppingCart, label: 'Suggestions' },
              { id: 'environment', icon: Thermometer, label: 'Environment' }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeView === item.id 
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                      : `${t.hover} ${t.text}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden fixed inset-0 z-40 ${t.bg}`} style={{ top: '64px' }}>
            <div className={`${t.card} border-r h-full p-4`}>
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                  { id: 'inventory', icon: Package, label: 'Inventory' },
                  { id: 'suggestions', icon: ShoppingCart, label: 'Suggestions' },
                  { id: 'environment', icon: Thermometer, label: 'Environment' }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeView === item.id 
                          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                          : `${t.hover} ${t.text}`
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <ViewComponent />
        </div>
      </div>
    </div>
  );
};

export default SmartFridge;