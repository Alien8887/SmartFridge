import React from 'react';
import * as Icons from 'lucide-react';
import * as Charts from 'recharts';

const Snowflake = Icons.Snowflake;
const AlertCircle = Icons.AlertCircle;
const TrendingUp = Icons.TrendingUp;
const ShoppingCart = Icons.ShoppingCart;
const Thermometer = Icons.Thermometer;
const Droplets = Icons.Droplets;
const Package = Icons.Package;
const Clock = Icons.Clock;
const DollarSign = Icons.DollarSign;
const Users = Icons.Users;
const Moon = Icons.Moon;
const Sun = Icons.Sun;
const Zap = Icons.Zap;
const Calendar = Icons.Calendar;
const Apple = Icons.Apple;
const Beef = Icons.Beef;
const BarChart3 = Icons.BarChart3;
const Settings = Icons.Settings;
const CheckCircle2 = Icons.CheckCircle2;
const Menu = Icons.Menu;
const X = Icons.X;
const LogOut = Icons.LogOut;
const Wifi = Icons.Wifi;
const WifiOff = Icons.WifiOff;
const Plus = Icons.Plus;
const Minus = Icons.Minus;
const Bell = Icons.Bell;
const ShoppingBag = Icons.ShoppingBag;
const PlusCircle = Icons.PlusCircle;
const Info = Icons.Info;
const ChevronDown = Icons.ChevronDown;
const ChevronUp = Icons.ChevronUp;
const Activity = Icons.Activity;
const Wind = Icons.Wind;

const LineChart = Charts.LineChart;
const Line = Charts.Line;
const BarChart = Charts.BarChart;
const Bar = Charts.Bar;
const PieChart = Charts.PieChart;
const Pie = Charts.Pie;
const Cell = Charts.Cell;
const XAxis = Charts.XAxis;
const YAxis = Charts.YAxis;
const CartesianGrid = Charts.CartesianGrid;
const Tooltip = Charts.Tooltip;
const Legend = Charts.Legend;
const ResponsiveContainer = Charts.ResponsiveContainer;
const AreaChart = Charts.AreaChart;
const Area = Charts.Area;

// Memoized Chart Components for Performance
const TempChart = React.memo(({ data, darkMode }) => (
  <ResponsiveContainer width="100%" height={250}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
      <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
          borderRadius: '12px',
          color: darkMode ? '#f1f5f9' : '#0f172a'
        }}
        labelStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
        itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
      />
      <Area type="monotone" dataKey="value" stroke="#60A5FA" fillOpacity={1} fill="url(#colorTemp)" />
    </AreaChart>
  </ResponsiveContainer>
));

const HumidityChart = React.memo(({ data, darkMode }) => (
  <ResponsiveContainer width="100%" height={250}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#34D399" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
      <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
          borderRadius: '12px',
          color: darkMode ? '#f1f5f9' : '#0f172a'
        }}
        labelStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
        itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
      />
      <Area type="monotone" dataKey="value" stroke="#34D399" fillOpacity={1} fill="url(#colorHum)" />
    </AreaChart>
  </ResponsiveContainer>
));

const PressureChart = React.memo(({ data, darkMode }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
      <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
          borderRadius: '12px',
          color: darkMode ? '#f1f5f9' : '#0f172a'
        }}
        labelStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
        itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
      />
      <Line type="monotone" dataKey="value" stroke="#A78BFA" strokeWidth={3} name="Weight (kg)" />
    </LineChart>
  </ResponsiveContainer>
));

const ConsumptionChart = React.memo(({ data, darkMode }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
      <XAxis dataKey="day" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
          borderRadius: '12px',
          color: darkMode ? '#f1f5f9' : '#0f172a'
        }}
        labelStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
        itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
      />
      <Bar dataKey="dairy" stackId="a" fill="#60A5FA" />
      <Bar dataKey="meat" stackId="a" fill="#F87171" />
      <Bar dataKey="vegetables" stackId="a" fill="#34D399" />
      <Bar dataKey="fruits" stackId="a" fill="#FBBF24" />
    </BarChart>
  </ResponsiveContainer>
));

const EnergyChart = React.memo(({ data, darkMode }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
      <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
          borderRadius: '12px',
          color: darkMode ? '#f1f5f9' : '#0f172a'
        }}
        labelStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
        itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
      />
      <Legend wrapperStyle={{ color: darkMode ? '#94a3b8' : '#64748b' }} />
      <Line type="monotone" dataKey="usage" stroke="#60A5FA" strokeWidth={3} name="Energy (kWh)" />
      <Line type="monotone" dataKey="doorOpens" stroke="#F87171" strokeWidth={3} name="Door Opens" />
    </LineChart>
  </ResponsiveContainer>
));

const DistributionChart = React.memo(({ data, darkMode }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={70}
        outerRadius={110}
        paddingAngle={5}
        dataKey="value"
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{ 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
          borderRadius: '12px',
          color: darkMode ? '#f1f5f9' : '#0f172a'
        }}
        labelStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
        itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
      />
    </PieChart>
  </ResponsiveContainer>
));

const SmartFridge = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [darkMode, setDarkMode] = React.useState(true);
  const [activeView, setActiveView] = React.useState('dashboard');
  const [currentMode, setCurrentMode] = React.useState('normal');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [alerts, setAlerts] = React.useState([]);
  const [targetTemp, setTargetTemp] = React.useState(4.0);
  
  const [sensorData, setSensorData] = React.useState({
    temperature: null,
    humidity: null,
    doorOpen: false,
    pressure: null,
    gasLevel: null,
    lastUpdate: null,
    connected: false,
    dataSource: 'waiting' // 'waiting', 'esp32', 'demo'
  });

  const [temperatureHistory, setTemperatureHistory] = React.useState([]);
  const [humidityHistory, setHumidityHistory] = React.useState([]);
  const [pressureHistory, setPressureHistory] = React.useState([]);
  const [doorOpenHistory, setDoorOpenHistory] = React.useState([]);

  const [inventory, setInventory] = React.useState([
    { id: 1, name: 'Fresh Milk', category: 'Dairy', expiry: 2, quantity: '1L', freshness: 85 },
    { id: 2, name: 'Greek Yogurt', category: 'Dairy', expiry: 5, quantity: '500g', freshness: 92 },
    { id: 3, name: 'Chicken Breast', category: 'Meat', expiry: 1, quantity: '800g', freshness: 70 },
    { id: 4, name: 'Broccoli', category: 'Vegetables', expiry: 3, quantity: '400g', freshness: 88 },
    { id: 5, name: 'Strawberries', category: 'Fruits', expiry: 2, quantity: '300g', freshness: 78 },
    { id: 6, name: 'Cheese Block', category: 'Dairy', expiry: 14, quantity: '250g', freshness: 95 },
    { id: 7, name: 'Orange Juice', category: 'Beverages', expiry: 4, quantity: '1L', freshness: 90 },
    { id: 8, name: 'Eggs', category: 'Dairy', expiry: 7, quantity: '12pcs', freshness: 94 },
    { id: 9, name: 'Carrots', category: 'Vegetables', expiry: 8, quantity: '500g', freshness: 96 },
    { id: 10, name: 'Bananas', category: 'Fruits', expiry: 3, quantity: '6pcs', freshness: 82 },
    { id: 11, name: 'Spinach', category: 'Vegetables', expiry: 2, quantity: '200g', freshness: 75 },
    { id: 12, name: 'Ground Beef', category: 'Meat', expiry: 1, quantity: '500g', freshness: 68 },
    { id: 13, name: 'Butter', category: 'Dairy', expiry: 10, quantity: '200g', freshness: 91 },
    { id: 14, name: 'Tomatoes', category: 'Vegetables', expiry: 4, quantity: '6pcs', freshness: 87 },
    { id: 15, name: 'Apples', category: 'Fruits', expiry: 12, quantity: '8pcs', freshness: 97 },
    { id: 16, name: 'Salmon Fillet', category: 'Meat', expiry: 1, quantity: '400g', freshness: 72 },
    { id: 17, name: 'Bell Peppers', category: 'Vegetables', expiry: 5, quantity: '3pcs', freshness: 89 },
    { id: 18, name: 'Grapes', category: 'Fruits', expiry: 4, quantity: '500g', freshness: 84 }
  ]);

  const availableProducts = [
    { name: 'Fresh Milk', category: 'Dairy', defaultExpiry: 5, icon: Droplets },
    { name: 'Greek Yogurt', category: 'Dairy', defaultExpiry: 7, icon: Droplets },
    { name: 'Butter', category: 'Dairy', defaultExpiry: 30, icon: Droplets },
    { name: 'Cheese Block', category: 'Dairy', defaultExpiry: 20, icon: Droplets },
    { name: 'Eggs', category: 'Dairy', defaultExpiry: 21, icon: Droplets },
    { name: 'Chicken Breast', category: 'Meat', defaultExpiry: 3, icon: Beef },
    { name: 'Ground Beef', category: 'Meat', defaultExpiry: 2, icon: Beef },
    { name: 'Salmon Fillet', category: 'Meat', defaultExpiry: 2, icon: Beef },
    { name: 'Pork Chops', category: 'Meat', defaultExpiry: 3, icon: Beef },
    { name: 'Turkey Slices', category: 'Meat', defaultExpiry: 4, icon: Beef },
    { name: 'Broccoli', category: 'Vegetables', defaultExpiry: 5, icon: Apple },
    { name: 'Carrots', category: 'Vegetables', defaultExpiry: 10, icon: Apple },
    { name: 'Spinach', category: 'Vegetables', defaultExpiry: 4, icon: Apple },
    { name: 'Tomatoes', category: 'Vegetables', defaultExpiry: 7, icon: Apple },
    { name: 'Bell Peppers', category: 'Vegetables', defaultExpiry: 6, icon: Apple },
    { name: 'Lettuce', category: 'Vegetables', defaultExpiry: 5, icon: Apple },
    { name: 'Cucumbers', category: 'Vegetables', defaultExpiry: 7, icon: Apple },
    { name: 'Strawberries', category: 'Fruits', defaultExpiry: 3, icon: Apple },
    { name: 'Bananas', category: 'Fruits', defaultExpiry: 4, icon: Apple },
    { name: 'Apples', category: 'Fruits', defaultExpiry: 14, icon: Apple },
    { name: 'Grapes', category: 'Fruits', defaultExpiry: 5, icon: Apple },
    { name: 'Oranges', category: 'Fruits', defaultExpiry: 10, icon: Apple },
    { name: 'Blueberries', category: 'Fruits', defaultExpiry: 5, icon: Apple },
    { name: 'Orange Juice', category: 'Beverages', defaultExpiry: 5, icon: Droplets },
    { name: 'Apple Juice', category: 'Beverages', defaultExpiry: 5, icon: Droplets },
    { name: 'Almond Milk', category: 'Beverages', defaultExpiry: 7, icon: Droplets }
  ];

  React.useEffect(() => {
    const cleanup = connectToESP32();
    return cleanup;
  }, []);

  const handleLogin = () => {
    if (loginUsername.trim()) {
      setUsername(loginUsername.trim());
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setLoginUsername('');
    setLoginPassword('');
  };

  const connectToESP32 = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('https://smart-fridge-two.vercel.app/api/sensors');
        if (!response.ok) {
          throw new Error('Network error');
        }
        const data = await response.json();
        
        const newData = {
          temperature: typeof data.temperature === 'number' ? data.temperature : null,
          humidity: typeof data.humidity === 'number' ? data.humidity : null,
          doorOpen: Boolean(data.doorOpen),
          pressure: typeof data.weight === 'number' ? Math.abs(data.weight) : typeof data.pressure === 'number' ? Math.abs(data.pressure) : null,
          gasLevel: typeof data.gasLevel === 'number' ? data.gasLevel : null,
          lastUpdate: new Date().toISOString(),
          connected: true,
          dataSource: 'esp32'
        };

        setSensorData(prev => {
          // Alert on significant changes
          if (prev.connected && prev.temperature !== null && newData.temperature !== null) {
            const tempChange = Math.abs(newData.temperature - prev.temperature);
            const humChange = Math.abs((newData.humidity || 0) - (prev.humidity || 0));
            
            if (tempChange > 3) {
              addAlert(`⚠️ Temperature changed by ${tempChange.toFixed(1)}°C!`);
            }
            if (humChange > 15) {
              addAlert(`⚠️ Humidity changed by ${humChange.toFixed(1)}%!`);
            }
          }
          
          // Alert on door open
          if (newData.doorOpen && !prev.doorOpen) {
            addAlert('🚪 Fridge door opened');
          }
          
          return newData;
        });

        const timestamp = new Date().toLocaleTimeString();
        
        // Only update history if we have valid data
        if (newData.temperature !== null) {
          setTemperatureHistory(prev => [...prev, { time: timestamp, value: newData.temperature }].slice(-30));
        }
        if (newData.humidity !== null) {
          setHumidityHistory(prev => [...prev, { time: timestamp, value: newData.humidity }].slice(-30));
        }
        if (newData.pressure !== null) {
          setPressureHistory(prev => [...prev, { time: timestamp, value: newData.pressure }].slice(-30));
        }
        setDoorOpenHistory(prev => [...prev, { time: timestamp, value: newData.doorOpen ? 1 : 0 }].slice(-30));

      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        setSensorData(prev => ({ ...prev, connected: false, dataSource: 'waiting' }));
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const addAlert = (message) => {
    const newAlert = { id: Date.now(), message, timestamp: new Date() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 10));
  };

  const adjustTargetTemp = (change) => {
    setTargetTemp(prev => parseFloat((prev + change).toFixed(1)));
  };

  const addProductToInventory = (product) => {
    const newProduct = {
      id: Date.now(),
      name: product.name,
      category: product.category,
      expiry: product.defaultExpiry,
      quantity: '1x',
      freshness: 100
    };
    setInventory(prev => [...prev, newProduct]);
    setShowAddProduct(false);
    addAlert(`✅ Added ${product.name} to inventory`);
  };

  const removeProductFromInventory = (productId) => {
    const product = inventory.find(p => p.id === productId);
    setInventory(prev => prev.filter(p => p.id !== productId));
    if (product) {
      addAlert(`🗑️ Removed ${product.name} from inventory`);
    }
  };

  const getIconForCategory = (category) => {
    if (category === 'Dairy' || category === 'Beverages') return Droplets;
    if (category === 'Meat') return Beef;
    return Apple;
  };

  // Memoized static data
  const consumptionData = React.useMemo(() => [
    { day: 'Mon', dairy: 250, meat: 180, vegetables: 320, fruits: 150 },
    { day: 'Tue', dairy: 280, meat: 200, vegetables: 280, fruits: 180 },
    { day: 'Wed', dairy: 220, meat: 150, vegetables: 350, fruits: 200 },
    { day: 'Thu', dairy: 300, meat: 220, vegetables: 300, fruits: 170 },
    { day: 'Fri', dairy: 260, meat: 190, vegetables: 330, fruits: 190 },
    { day: 'Sat', dairy: 310, meat: 250, vegetables: 280, fruits: 220 },
    { day: 'Sun', dairy: 290, meat: 210, vegetables: 310, fruits: 200 }
  ], []);

  const energyData = React.useMemo(() => [
    { time: '00:00', usage: 45, doorOpens: 0 },
    { time: '04:00', usage: 42, doorOpens: 0 },
    { time: '08:00', usage: 58, doorOpens: 12 },
    { time: '12:00', usage: 62, doorOpens: 8 },
    { time: '16:00', usage: 55, doorOpens: 6 },
    { time: '20:00', usage: 68, doorOpens: 15 },
    { time: '24:00', usage: 48, doorOpens: 3 }
  ], []);

  const categoryDistribution = React.useMemo(() => [
    { name: 'Dairy', value: 35, color: '#60A5FA' },
    { name: 'Meat', value: 20, color: '#F87171' },
    { name: 'Vegetables', value: 25, color: '#34D399' },
    { name: 'Fruits', value: 15, color: '#FBBF24' },
    { name: 'Beverages', value: 5, color: '#A78BFA' }
  ], []);

  const mealSuggestions = React.useMemo(() => [
    { name: 'Creamy Chicken Broccoli', ingredients: ['Chicken Breast', 'Broccoli', 'Fresh Milk'], time: '25 min' },
    { name: 'Greek Yogurt Parfait', ingredients: ['Greek Yogurt', 'Strawberries', 'Bananas'], time: '5 min' },
    { name: 'Fresh Garden Salad', ingredients: ['Broccoli', 'Carrots', 'Spinach'], time: '10 min' },
    { name: 'Beef Stir Fry', ingredients: ['Ground Beef', 'Carrots', 'Bell Peppers'], time: '20 min' },
    { name: 'Salmon with Vegetables', ingredients: ['Salmon Fillet', 'Broccoli', 'Carrots'], time: '30 min' },
    { name: 'Fruit Smoothie Bowl', ingredients: ['Bananas', 'Strawberries', 'Greek Yogurt'], time: '5 min' }
  ], []);

  const modes = React.useMemo(() => [
    { id: 'normal', name: 'Normal', icon: Snowflake },
    { id: 'party', name: 'Party', icon: Users },
    { id: 'ramadan', name: 'Ramadan', icon: Moon },
    { id: 'diet', name: 'Diet', icon: Apple },
    { id: 'travel', name: 'Travel', icon: Calendar }
  ], []);

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

  const handleQuickBuy = (items) => {
    addAlert(`🛒 Quick buy initiated for ${items.length} items (Demo Mode)`);
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center p-4`}>
        <div className={`${t.card} border rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/50 flex items-center justify-center mb-4 animate-pulse">
              <Snowflake className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${t.text} mb-2`}>Smart Fridge</h1>
            <p className={`text-sm ${t.textMuted}`}>Intelligent Food Management System</p>
          </div>
          
          <div className={`mb-4 p-3 rounded-xl border ${darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} flex items-start gap-2`}>
            <Info className={`w-4 h-4 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'} shrink-0`} />
            <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Session-only demo: Data resets on page refresh
            </p>
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
                className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
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
                className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/30 transition-all transform hover:scale-105"
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
      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg ${sensorData.connected ? 'border-emerald-500/50' : 'border-red-500/50'} transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {sensorData.connected && sensorData.dataSource === 'esp32' ? (
              <div className="relative">
                <Wifi className="w-6 h-6 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            ) : (
              <WifiOff className="w-6 h-6 text-red-400 animate-pulse" />
            )}
            <div>
              <h3 className={`font-semibold ${t.text}`}>
                {sensorData.dataSource === 'esp32' 
                  ? '✓ ESP32 Connected - Live Data Stream' 
                  : '✗ Waiting for ESP32 Connection...'}
              </h3>
              <p className={`text-xs ${t.textMuted}`}>
                {sensorData.lastUpdate && sensorData.dataSource === 'esp32'
                  ? `Last update: ${new Date(sensorData.lastUpdate).toLocaleTimeString()} (Real ESP32 Data)` 
                  : 'No live data received yet - Connect your ESP32 device'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:flex md:gap-6 gap-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.temperature !== null ? t.accent : t.textMuted}`}>
                {sensorData.temperature !== null ? `${sensorData.temperature.toFixed(1)}°C` : '--°C'}
              </div>
              <div className={`text-xs ${t.textMuted}`}>
                {sensorData.dataSource === 'esp32' ? 'ESP32 Live' : 'Waiting'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.humidity !== null ? t.accent : t.textMuted}`}>
                {sensorData.humidity !== null ? `${Math.round(sensorData.humidity)}%` : '--%'}
              </div>
              <div className={`text-xs ${t.textMuted}`}>
                {sensorData.dataSource === 'esp32' ? 'ESP32 Live' : 'Waiting'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.doorOpen ? 'text-red-400' : 'text-emerald-400'}`}>
                {sensorData.doorOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <div className={`text-xs ${t.textMuted}`}>Door Status</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sensorData.pressure !== null ? t.accent : t.textMuted}`}>
                {sensorData.pressure !== null ? `${sensorData.pressure.toFixed(1)}kg` : '--kg'}
              </div>
              <div className={`text-xs ${t.textMuted}`}>Load Weight</div>
            </div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className={`${t.card} border border-yellow-500/50 rounded-2xl p-4 shadow-lg animate-fade-in`}>
          <h3 className={`font-semibold ${t.text} mb-3 flex items-center gap-2`}>
            <Bell className="w-5 h-5 text-yellow-400 animate-pulse" />
            Recent Alerts ({alerts.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'} transition-all hover:shadow-md`}>
                <p className={`text-sm ${t.text}`}>{alert.message}</p>
                <p className={`text-xs ${t.textMuted} mt-1`}>{alert.timestamp.toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
          <Thermometer className="w-5 h-5" /> Temperature Control (Demo Mode)
        </h3>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => adjustTargetTemp(-0.5)}
            className="p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg"
          >
            <Minus className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className={`text-5xl font-bold ${t.accent} mb-2`}>{targetTemp.toFixed(1)}°C</div>
            <div className={`text-sm ${t.textMuted}`}>Target Temperature</div>
            <div className={`text-xs ${t.textMuted} mt-2 flex items-center justify-center gap-1`}>
              <Activity className="w-3 h-3" />
              Demo Mode - Not Sent to ESP32
            </div>
          </div>
          <button
            onClick={() => adjustTargetTemp(0.5)}
            className="p-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105`}>
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

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105`}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className={`${t.accent} w-6 md:w-8 h-6 md:h-8`} />
            <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400`}>
              -23%
            </span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${t.text} mb-1`}>8.5kg</div>
          <div className={`text-xs md:text-sm ${t.textMuted}`}>Waste Prevented</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105`}>
          <div className="flex items-center justify-between mb-3">
            <Zap className={`${t.accent} w-6 md:w-8 h-6 md:h-8`} />
            <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full bg-sky-500/20 text-sky-400`}>
              OPTIMAL
            </span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${t.text} mb-1`}>52 kWh</div>
          <div className={`text-xs md:text-sm ${t.textMuted}`}>Energy This Week</div>
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105`}>
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
                onClick={() => {
                  setCurrentMode(mode.id);
                  addAlert(`🔄 Switched to ${mode.name} mode`);
                }}
                className={`p-2 md:p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
            <Thermometer className="w-5 h-5" /> Temperature History (ESP32)
          </h3>
          {temperatureHistory.length > 0 ? (
            <TempChart data={temperatureHistory} darkMode={darkMode} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className={`${t.textMuted} text-sm`}>Waiting for sensor data...</p>
            </div>
          )}
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
            <Droplets className="w-5 h-5" /> Humidity History (ESP32)
          </h3>
          {humidityHistory.length > 0 ? (
            <HumidityChart data={humidityHistory} darkMode={darkMode} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className={`${t.textMuted} text-sm`}>Waiting for sensor data...</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4`}>Weekly Consumption (Demo)</h3>
          <ConsumptionChart data={consumptionData} darkMode={darkMode} />
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
            <Package className="w-5 h-5" /> Load History (ESP32)
          </h3>
          {pressureHistory.length > 0 ? (
            <PressureChart data={pressureHistory} darkMode={darkMode} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className={`${t.textMuted} text-sm`}>Waiting for sensor data...</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4`}>Storage Distribution (Demo)</h3>
        <DistributionChart data={categoryDistribution} darkMode={darkMode} />
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
  );

  const InventoryView = () => (
    <div className="space-y-4 md:space-y-6">
      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className={`text-lg md:text-xl font-bold ${t.text} flex items-center gap-2`}>
            <Package className="w-5 md:w-6 h-5 md:h-6" /> Live Inventory ({inventory.length} items)
          </h3>
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {inventory.map(item => {
            const warning = getExpiryWarning(item.expiry);
            const Icon = getIconForCategory(item.category);
            return (
              <div key={item.id} className={`${t.hover} rounded-xl p-3 md:p-4 border ${darkMode ? 'border-slate-700' : 'border-slate-200'} transition-all hover:shadow-lg group`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${warning.color} ${warning.glow} shadow-lg flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 md:w-6 h-5 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${t.text} truncate`}>{item.name}</div>
                      <div className={`text-xs md:text-sm ${t.textMuted}`}>{item.category} • {item.quantity}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right shrink-0">
                      <div className={`text-xs md:text-sm font-bold ${getFreshnessColor(item.freshness)}`}>
                        {item.freshness}%
                      </div>
                      <div className={`text-xs ${t.textMuted} flex items-center gap-1 justify-end mt-1`}>
                        <Clock className="w-3 h-3" />
                        {item.expiry}d
                      </div>
                    </div>
                    <button
                      onClick={() => removeProductFromInventory(item.id)}
                      className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg ${darkMode ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-red-100 hover:bg-red-200'} text-red-500 transition-all`}
                    >
                      <X className="w-4 h-4" />
                    </button>
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

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${t.card} border rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-inherit pb-4">
              <h3 className={`text-xl font-bold ${t.text} flex items-center gap-2`}>
                <PlusCircle className="w-6 h-6" />
                Add Product to Inventory
              </h3>
              <button onClick={() => setShowAddProduct(false)} className={`p-2 rounded-lg ${t.hover} transition-all hover:scale-110`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableProducts.map((product, idx) => {
                const Icon = getIconForCategory(product.category);
                return (
                  <button
                    key={idx}
                    onClick={() => addProductToInventory(product)}
                    className={`${t.hover} border ${darkMode ? 'border-slate-700' : 'border-slate-200'} rounded-xl p-4 text-left transition-all hover:shadow-xl hover:scale-105 group`}
                  >
                    <Icon className={`w-8 h-8 ${t.accent} mb-2 group-hover:scale-110 transition-transform`} />
                    <div className={`font-semibold ${t.text} text-sm`}>{product.name}</div>
                    <div className={`text-xs ${t.textMuted} mt-1`}>{product.category}</div>
                    <div className={`text-xs ${t.textMuted} mt-1 flex items-center gap-1`}>
                      <Clock className="w-3 h-3" />
                      {product.defaultExpiry}d
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
            <div key={idx} className={`${t.hover} rounded-xl p-4 md:p-5 border ${darkMode ? 'border-slate-700' : 'border-slate-200'} transition-all hover:shadow-lg group`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h4 className={`font-semibold ${t.text} text-base md:text-lg`}>{meal.name}</h4>
                  <div className={`text-xs md:text-sm ${t.textMuted} flex items-center gap-2 mt-1`}>
                    <Clock className="w-4 h-4" /> {meal.time}
                  </div>
                </div>
                <button 
                  onClick={() => addAlert(`👨‍🍳 Started cooking: ${meal.name} (Demo)`)}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg text-sm"
                >
                  Cook Now
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ing, i) => (
                  <span key={i} className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'} transition-all group-hover:scale-105`}>
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base md:text-lg font-bold ${t.text}`}>Smart Shopping List</h3>
          <button 
            onClick={() => handleQuickBuy(['Fresh Milk', 'Chicken Breast', 'Broccoli', 'Strawberries', 'Eggs'])}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Quick Buy All
          </button>
        </div>
        <div className="space-y-2">
          {['Fresh Milk (2L)', 'Chicken Breast (1kg)', 'Broccoli (500g)', 'Strawberries (400g)', 'Eggs (12pcs)', 'Greek Yogurt (500g)', 'Carrots (1kg)'].map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${t.hover} group transition-all hover:shadow-md`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} />
                <span className={`${t.text} text-sm md:text-base`}>{item}</span>
              </div>
              <button 
                onClick={() => addAlert(`🛒 Quick buy: ${item} (Demo)`)}
                className="text-xs px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-all transform hover:scale-105"
              >
                Buy Now
              </button>
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
            <Thermometer className="w-4 md:w-5 h-4 md:h-5" /> Temperature (ESP32)
          </h3>
          <div className="text-center mb-6">
            <div className={`text-4xl md:text-5xl font-bold ${sensorData.temperature !== null ? t.accent : t.textMuted} mb-2`}>
              {sensorData.temperature !== null ? `${sensorData.temperature.toFixed(1)}°C` : '--°C'}
            </div>
            <div className={`text-xs md:text-sm ${t.textMuted}`}>
              {sensorData.dataSource === 'esp32' ? 'Live from ESP32' : 'Waiting for data...'}
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full" />
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 md:mb-6 flex items-center gap-2`}>
            <Droplets className="w-4 md:w-5 h-4 md:h-5" /> Humidity (ESP32)
          </h3>
          <div className="text-center mb-6">
            <div className={`text-4xl md:text-5xl font-bold ${sensorData.humidity !== null ? t.accent : t.textMuted} mb-2`}>
              {sensorData.humidity !== null ? `${Math.round(sensorData.humidity)}%` : '--%'}
            </div>
            <div className={`text-xs md:text-sm ${t.textMuted}`}>
              {sensorData.dataSource === 'esp32' ? 'Live from ESP32' : 'Waiting for data...'}
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-yellow-500 via-green-500 to-blue-500 rounded-full" />
        </div>
      </div>

      <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
        <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4`}>Energy Usage & Door Activity (Demo)</h3>
        <EnergyChart data={energyData} darkMode={darkMode} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
            <Wind className="w-5 h-5" /> Air Quality (Demo)
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${t.text}`}>CO2 Level</span>
                <span className={`text-sm font-bold ${t.accent}`}>420 ppm</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${t.text}`}>VOC Level</span>
                <span className={`text-sm font-bold ${t.accent}`}>Low</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${t.text}`}>Odor Detection</span>
                <span className={`text-sm font-bold text-emerald-400`}>Normal</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '88%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className={`${t.card} border rounded-2xl p-4 md:p-6 shadow-lg`}>
          <h3 className={`text-base md:text-lg font-bold ${t.text} mb-4 flex items-center gap-2`}>
            <Activity className="w-5 h-5" /> System Health (Demo)
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${t.text}`}>Compressor Status</span>
                <span className={`text-sm font-bold text-emerald-400`}>Active</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${t.text}`}>Defrost Cycle</span>
                <span className={`text-sm font-bold ${t.accent}`}>Next in 4h</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '65%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${t.text}`}>Filter Health</span>
                <span className={`text-sm font-bold text-emerald-400`}>Good</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '95%' }} />
              </div>
            </div>
          </div>
        </div>
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
      <div className={`${t.card} border-b backdrop-blur-xl sticky top-0 z-50 shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl ${t.hover} transition-all`}
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
              className={`p-2 md:p-3 rounded-xl ${t.hover} transition-all hover:scale-110`}
            >
              {darkMode ? <Sun className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} /> : <Moon className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} />}
            </button>
            <button
              onClick={handleLogout}
              className={`p-2 md:p-3 rounded-xl ${t.hover} transition-all hover:scale-110`}
            >
              <LogOut className={`w-4 md:w-5 h-4 md:h-5 ${t.accent}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 flex gap-4 md:gap-6">
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
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 transform scale-105' 
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

        {mobileMenuOpen && (
          <div className={`lg:hidden fixed inset-0 z-40 ${t.bg} backdrop-blur-sm`} style={{ top: '64px' }}>
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

        <div className="flex-1 min-w-0">
          <ViewComponent />
        </div>
      </div>
    </div>
  );
};

export default SmartFridge;