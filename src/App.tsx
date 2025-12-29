import React, { useState, useMemo } from 'react';
import { 
  Snowflake, AlertCircle, TrendingUp, ShoppingCart, 
  Thermometer, Droplets, Package, Clock, DollarSign,
  Users, Moon, Sun, Zap, Calendar, Apple, Beef,
  BarChart3, Settings, Image, CheckCircle2
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SmartFridge = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [currentMode, setCurrentMode] = useState('normal');
  const [temperature, setTemperature] = useState(4);
  const [humidity, setHumidity] = useState(65);

  // Mock inventory data
  const inventory = [
    { id: 1, name: 'Fresh Milk', category: 'Dairy', expiry: 2, quantity: '1L', freshness: 85 },
    { id: 2, name: 'Greek Yogurt', category: 'Dairy', expiry: 5, quantity: '500g', freshness: 92 },
    { id: 3, name: 'Chicken Breast', category: 'Meat', expiry: 1, quantity: '800g', freshness: 70 },
    { id: 4, name: 'Broccoli', category: 'Vegetables', expiry: 3, quantity: '400g', freshness: 88 },
    { id: 5, name: 'Strawberries', category: 'Fruits', expiry: 2, quantity: '300g', freshness: 78 },
    { id: 6, name: 'Cheese Block', category: 'Dairy', expiry: 14, quantity: '250g', freshness: 95 },
    { id: 7, name: 'Orange Juice', category: 'Beverages', expiry: 4, quantity: '1L', freshness: 90 },
    { id: 8, name: 'Eggs', category: 'Dairy', expiry: 7, quantity: '12pcs', freshness: 94 }
  ];

  // Mock consumption data
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

  const getFreshnessColor = (freshness: number): string => {
    if (freshness >= 85) return darkMode ? 'text-emerald-400' : 'text-emerald-600';
    if (freshness >= 70) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  };

  const getExpiryWarning = (days: number): { color: string; text: string; glow: string } => {
    if (days <= 1) return { color: 'bg-red-500', text: 'Urgent', glow: 'shadow-red-500/50' };
    if (days <= 3) return { color: 'bg-yellow-500', text: 'Soon', glow: 'shadow-yellow-500/50' };
    return { color: 'bg-emerald-500', text: 'Fresh', glow: 'shadow-emerald-500/50' };
  };

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${t.card} border rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className={`${t.accent} w-8 h-8`} />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-red-500/20 text-red-400`}>
              {inventory.filter(i => i.expiry <= 2).length} URGENT
            </span>
          </div>
          <div className={`text-3xl font-bold ${t.text} mb-1`}>
            {inventory.filter(i => i.expiry <= 3).length}
          </div>
          <div className={`text-sm ${t.textMuted}`}>Items Near Expiry</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className={`${t.accent} w-8 h-8`} />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400`}>
              -23%
            </span>
          </div>
          <div className={`text-3xl font-bold ${t.text} mb-1`}>8.5kg</div>
          <div className={`text-sm ${t.textMuted}`}>Waste Prevented</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <Zap className={`${t.accent} w-8 h-8`} />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/20 text-sky-400`}>
              OPTIMAL
            </span>
          </div>
          <div className={`text-3xl font-bold ${t.text} mb-1`}>52 kWh</div>
          <div className={`text-sm ${t.textMuted}`}>Energy This Week</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-center justify-between mb-3">
            <DollarSign className={`${t.accent} w-8 h-8`} />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400`}>
              SAVED $45
            </span>
          </div>
          <div className={`text-3xl font-bold ${t.text} mb-1`}>$187</div>
          <div className={`text-sm ${t.textMuted}`}>Monthly Budget</div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
        <h3 className={`text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
          <Settings className="w-5 h-5" /> Active Mode
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setCurrentMode(mode.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  currentMode === mode.id 
                    ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/30' 
                    : `border-transparent ${t.hover}`
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${currentMode === mode.id ? 'text-sky-400' : t.textMuted}`} />
                <div className={`text-xs font-medium ${currentMode === mode.id ? t.text : t.textMuted}`}>
                  {mode.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
          <h3 className={`text-lg font-bold ${t.text} mb-4`}>Weekly Consumption</h3>
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

        <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
          <h3 className={`text-lg font-bold ${t.text} mb-4`}>Storage Distribution</h3>
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
    <div className="space-y-6">
      <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold ${t.text} mb-6 flex items-center gap-2`}>
          <Package className="w-6 h-6" /> Live Inventory
        </h3>
        <div className="space-y-3">
          {inventory.map(item => {
            const warning = getExpiryWarning(item.expiry);
            return (
              <div key={item.id} className={`${t.hover} rounded-xl p-4 border ${darkMode ? 'border-slate-700' : 'border-slate-200'} transition-all`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg ${warning.color} ${warning.glow} shadow-lg flex items-center justify-center`}>
                      {item.category === 'Dairy' && <Droplets className="w-6 h-6 text-white" />}
                      {item.category === 'Meat' && <Beef className="w-6 h-6 text-white" />}
                      {item.category === 'Vegetables' && <Apple className="w-6 h-6 text-white" />}
                      {item.category === 'Fruits' && <Apple className="w-6 h-6 text-white" />}
                      {item.category === 'Beverages' && <Droplets className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${t.text}`}>{item.name}</div>
                      <div className={`text-sm ${t.textMuted}`}>{item.category} • {item.quantity}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getFreshnessColor(item.freshness)}`}>
                      {item.freshness}% Fresh
                    </div>
                    <div className={`text-xs ${t.textMuted} flex items-center gap-1 justify-end mt-1`}>
                      <Clock className="w-3 h-3" />
                      Expires in {item.expiry}d
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
    <div className="space-y-6">
      <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold ${t.text} mb-6 flex items-center gap-2`}>
          <ShoppingCart className="w-6 h-6" /> Smart Meal Suggestions
        </h3>
        <div className="space-y-4">
          {mealSuggestions.map((meal, idx) => (
            <div key={idx} className={`${t.hover} rounded-xl p-5 border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className={`font-semibold ${t.text} text-lg`}>{meal.name}</h4>
                  <div className={`text-sm ${t.textMuted} flex items-center gap-2 mt-1`}>
                    <Clock className="w-4 h-4" /> {meal.time}
                  </div>
                </div>
                <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors">
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

      <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
        <h3 className={`text-lg font-bold ${t.text} mb-4`}>Smart Shopping List</h3>
        <div className="space-y-2">
          {['Fresh Milk (2L)', 'Chicken Breast (1kg)', 'Broccoli (500g)', 'Strawberries (400g)'].map((item, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${t.hover}`}>
              <CheckCircle2 className={`w-5 h-5 ${t.accent}`} />
              <span className={t.text}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const EnvironmentView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
          <h3 className={`text-lg font-bold ${t.text} mb-6 flex items-center gap-2`}>
            <Thermometer className="w-5 h-5" /> Temperature Control
          </h3>
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold ${t.accent} mb-2`}>{temperature}°C</div>
            <div className={`text-sm ${t.textMuted}`}>Optimal Range: 2-4°C</div>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${t.textMuted}`}>0°C</span>
            <span className={`text-xs ${t.textMuted}`}>10°C</span>
          </div>
        </div>

        <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
          <h3 className={`text-lg font-bold ${t.text} mb-6 flex items-center gap-2`}>
            <Droplets className="w-5 h-5" /> Humidity Control
          </h3>
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold ${t.accent} mb-2`}>{humidity}%</div>
            <div className={`text-sm ${t.textMuted}`}>Optimal Range: 60-70%</div>
          </div>
          <input
            type="range"
            min="30"
            max="90"
            value={humidity}
            onChange={(e) => setHumidity(Number(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${t.textMuted}`}>30%</span>
            <span className={`text-xs ${t.textMuted}`}>90%</span>
          </div>
        </div>
      </div>

      <div className={`${t.card} border rounded-2xl p-6 shadow-lg`}>
        <h3 className={`text-lg font-bold ${t.text} mb-4`}>Energy Usage & Door Activity</h3>
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

  const views: Record<string, () => React.ReactElement> = {
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/50 flex items-center justify-center">
              <Snowflake className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${t.text}`}>Smart Fridge</h1>
              <p className={`text-xs ${t.textMuted}`}>Intelligent Food Management</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl ${t.hover} transition-colors`}
          >
            {darkMode ? <Sun className={`w-5 h-5 ${t.accent}`} /> : <Moon className={`w-5 h-5 ${t.accent}`} />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Sidebar */}
        <div className={`${t.card} border rounded-2xl p-4 shadow-lg w-64 shrink-0 h-fit sticky top-24`}>
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

        {/* Main Content */}
        <div className="flex-1">
          <ViewComponent />
        </div>
      </div>
    </div>
  );
};

export default SmartFridge;