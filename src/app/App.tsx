import React, { useState, useEffect, useCallback } from 'react';
import { Snowflake, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileMenu } from '../components/layout/MobileMenu';
import { DashboardView } from '../features/dashboard/DashboardView';
import { InventoryView } from '../features/inventory/InventoryView';
import { SuggestionsView } from '../features/suggestions/SuggestionsView';
import { EnvironmentView } from '../features/environment/EnvironmentView';
import { CalendarView } from '../features/calendar/CalendarView';
import { ProfileView } from '../features/profile/ProfileView';
import { AdminView } from '../features/admin/AdminView';
import { AIChatWidget } from '../components/ui/AIChatWidget';
import { ConfettiBurst } from '../components/ui/ConfettiBurst';
import { MilestoneToast } from '../components/ui/MilestoneToast';
import { PageTransition } from '../components/ui/PageTransition';
import { GradientBlob } from '../components/ui/GradientBlob';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useESP32Sensors } from '../hooks/useESP32Sensors';
import { useAlerts } from '../hooks/useAlerts';
import { useInventory } from '../hooks/useInventory';
import { useConsumption } from '../hooks/useConsumption';
import { useMLPredictions } from '../hooks/useMLPredictions';
import { usePreferences } from '../hooks/usePreferences';
import { useProfile } from '../hooks/useProfile';
import { useCalendar } from '../hooks/useCalendar';
import { useConfettiOnMilestone } from '../hooks/useConfettiOnMilestone';
import { getModeEffect } from '../data/modeEffects';
import { MILESTONES } from '../data/milestones';
import { Product } from '../types';

function App() {
  const { user, loading: authLoading, error: authError, setError: setAuthError, login, register, logout } = useAuth();
  const { darkMode, setDarkMode, theme } = useTheme();

  const token = user?.token ?? '';
  const username = user?.username ?? '';
  const role = user?.role ?? 'user';

  const { alerts, addAlert, analyzeSensor, dismissAlert, dismissAll } = useAlerts();
  const {
    sensorData, temperatureHistory, humidityHistory, pressureHistory, energyHistory,
    targetTemp, goalTemp, aiAdjusted, aiReason, modeAdjusted, modeOffsetApplied, servoAngle,
    doorOpenCount, totalEnergyLost, doorAlarmActive, lastOpenDurationSec, diagnostics,
    setTargetTemp, setMode, isConnected,
  } = useESP32Sensors(addAlert, token, username);

  const { inventory, loading: invLoading, addProduct, addProducts, consumeItem, wasteItem, resetInventory } = useInventory(token, username);
  const { consumptionHistory, logItem, totalConsumed, totalWasted, topItems, resetStats, loading: consumptionLoading } = useConsumption(token, username);
  const { ml, advice, loading: mlLoading, aiLoading, mlUpdatedAt, adviceUpdatedAt, runPredictions, getAIAdvice } = useMLPredictions(token, username);
  const { ratings, rateRecipe } = usePreferences(token, username);
  const { profile, loading: profileLoading, updateFridgeInfo, logoutAllSessions, deleteAccount, exportData } = useProfile(token, username);
  const { calendar, loading: calendarLoading, setMeal, setMeals } = useCalendar(token, username);

  const [activeView, setActiveView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentMode, setCurrentModeState] = useState(() => { try { return localStorage.getItem('current-mode') || 'normal'; } catch { return 'normal'; } });
  const modeEffect = getModeEffect(currentMode);

  const setCurrentMode = useCallback((id: string) => {
    setCurrentModeState(id);
    try { localStorage.setItem('current-mode', id); } catch { /* ignore */ }
    setMode(id, getModeEffect(id).tempOffsetC);
  }, [setMode]);

  const [loginUsername, setLoginUser] = useState(''); const [loginPassword, setLoginPass] = useState('');
  const [regUsername, setRegUser] = useState(''); const [regPassword, setRegPass] = useState('');
  const [regSuccess, setRegSuccess] = useState(''); const [showRegister, setShowReg] = useState(false);

  const { burst: milestoneBurst, justUnlocked, clearUnlocked } = useConfettiOnMilestone(totalConsumed, MILESTONES, consumptionLoading, username);

  useEffect(() => { if (sensorData.connected) analyzeSensor(sensorData); }, [sensorData, analyzeSensor]);

  useEffect(() => {
    if (!token) return;
    setMode(currentMode, modeEffect.tempOffsetC);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!isConnected || !token) return;
    runPredictions(sensorData.temperature, sensorData.humidity, inventory);
    const id = setInterval(() => runPredictions(sensorData.temperature, sensorData.humidity, inventory), 300_000 * modeEffect.pollIntervalMultiplier);
    return () => clearInterval(id);
  }, [isConnected, token, sensorData.temperature, sensorData.humidity, inventory, runPredictions, modeEffect.pollIntervalMultiplier]);

  useEffect(() => {
    if (!isConnected || !token || !advice) return;
    const id = setInterval(() => getAIAdvice(sensorData.temperature, sensorData.humidity, inventory, doorOpenCount), 600_000 * modeEffect.pollIntervalMultiplier);
    return () => clearInterval(id);
  }, [isConnected, token, advice, sensorData.temperature, sensorData.humidity, inventory, doorOpenCount, getAIAdvice, modeEffect.pollIntervalMultiplier]);

  const handleConsume = useCallback((id: number, amount: number) => {
    const item = inventory.find(i => i.id === id); if (!item) return;
    consumeItem(id, amount); logItem(item.name, item.category, 'consume', amount);
  }, [inventory, consumeItem, logItem]);

  const handleWaste = useCallback((id: number, amount: number) => {
    const item = inventory.find(i => i.id === id); if (!item) return;
    wasteItem(id, amount); logItem(item.name, item.category, 'waste', amount);
  }, [inventory, wasteItem, logItem]);

  const handleAddProduct = useCallback((p: Product, amt: number, unit: string) => addProduct(p, amt, unit), [addProduct]);

  if (authLoading) return <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}><div className="w-10 h-10 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" /></div>;

  if (!user) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4 relative`}>
        <GradientBlob darkMode={darkMode} />
        <div className={`${theme.card} border rounded-3xl p-8 md:p-10 shadow-2xl w-full max-w-md animate-scale-in relative`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/30 animate-glow-pulse relative">
              <Snowflake className="w-12 h-12 text-white" />
              <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1.5 -right-1.5 animate-number-pop" />
            </div>
            <h1 className={`text-3xl font-bold ${theme.text} mb-1`}>Smart Fridge</h1>
            <p className={`text-sm ${theme.textMuted}`}>Intelligent Food Management</p>
          </div>
          <div className={`flex rounded-xl overflow-hidden border mb-6 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            {[{ id: false, label: 'Sign in', icon: LogIn }, { id: true, label: 'Register', icon: UserPlus }].map(t => (
              <button key={String(t.id)} onClick={() => { setShowReg(t.id); setAuthError(null); setRegSuccess(''); }} className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${showRegister === t.id ? 'bg-sky-500 text-white' : darkMode ? 'text-slate-200 hover:bg-slate-700/60' : 'text-slate-700 hover:bg-slate-100'}`}><t.icon className="w-4 h-4" />{t.label}</button>
            ))}
          </div>
          {authError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-slide-down">{authError}</div>}
          {regSuccess && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center animate-slide-down">{regSuccess}</div>}
          <div className="space-y-4">
            {!showRegister ? (
              <>
                <div className="animate-slide-down" style={{ animationDelay: '50ms' }}>
                  <input type="text" value={loginUsername} onChange={e => { setLoginUser(e.target.value); setAuthError(null); }} onKeyDown={e => e.key === 'Enter' && login(loginUsername, loginPassword)} placeholder="Username" autoComplete="username" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`} />
                </div>
                <div className="animate-slide-down" style={{ animationDelay: '100ms' }}>
                  <input type="password" value={loginPassword} onChange={e => { setLoginPass(e.target.value); setAuthError(null); }} onKeyDown={e => e.key === 'Enter' && login(loginUsername, loginPassword)} placeholder="Password" autoComplete="current-password" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`} />
                </div>
                <button onClick={() => login(loginUsername, loginPassword)} className="relative w-full py-3 overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-sky-500/20 group">
                  <span className="relative z-10">Sign in</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
                <div className={`p-3 rounded-xl text-xs space-y-0.5 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}><p className={`font-semibold ${theme.textMuted} mb-1`}>Default accounts:</p><p className={theme.textMuted}>admin / admin123 · user / user123</p></div>
              </>
            ) : (
              <>
                <input type="text" value={regUsername} onChange={e => { setRegUser(e.target.value); setAuthError(null); }} placeholder="Choose username (3–20 chars)" autoComplete="username" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`} />
                <input type="password" value={regPassword} onChange={e => { setRegPass(e.target.value); setAuthError(null); }} placeholder="Choose password (min 4 chars)" autoComplete="new-password" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`} />
                <button onClick={async () => { const ok = await register(regUsername, regPassword); if (ok) { setRegSuccess('Account created — you can sign in now.'); setRegUser(''); setRegPass(''); setShowReg(false); } }} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all active:scale-95">Create account</button>
              </>
            )}
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
            sensorData={sensorData} alerts={alerts} inventory={inventory} totalConsumed={totalConsumed} totalWasted={totalWasted}
            currentMode={currentMode} setCurrentMode={setCurrentMode}
            targetTemp={targetTemp} goalTemp={goalTemp} aiAdjusted={aiAdjusted} aiReason={aiReason}
            modeAdjusted={modeAdjusted} modeOffsetApplied={modeOffsetApplied} modeBanner={modeEffect.banner}
            servoAngle={servoAngle} doorAlarmActive={doorAlarmActive} setTargetTemp={setTargetTemp} isConnected={isConnected}
            ml={ml} advice={advice} mlLoading={mlLoading} aiLoading={aiLoading} mlUpdatedAt={mlUpdatedAt} adviceUpdatedAt={adviceUpdatedAt}
            onRunPredictions={() => runPredictions(sensorData.temperature, sensorData.humidity, inventory, true)}
            onGetAdvice={() => getAIAdvice(sensorData.temperature, sensorData.humidity, inventory, doorOpenCount)}
            onDismissAlert={dismissAlert} onDismissAll={dismissAll}
            darkMode={darkMode} theme={theme}
          />
        );
      case 'inventory':
        return <InventoryView inventory={inventory} loading={invLoading} topItems={topItems} onAddProduct={handleAddProduct} onConsume={handleConsume} onWaste={handleWaste} darkMode={darkMode} theme={theme} />;
      case 'suggestions':
        return (
          <SuggestionsView
            inventory={inventory} onAddProduct={handleAddProduct} onAddProducts={addProducts} onConsume={handleConsume}
            ratings={ratings} onRate={rateRecipe} dietaryPreferences={profile?.dietaryPreferences ?? []}
            totalConsumed={totalConsumed} totalWasted={totalWasted}
            currentMode={currentMode} householdSize={profile?.householdSize ?? null} dailyCalorieGoal={profile?.dailyCalorieGoal ?? null}
            darkMode={darkMode} theme={theme}
          />
        );
      case 'environment':
        return (
          <EnvironmentView
            sensorData={sensorData} energyHistory={energyHistory}
            temperatureHistory={temperatureHistory} humidityHistory={humidityHistory} pressureHistory={pressureHistory}
            targetTemp={targetTemp} goalTemp={goalTemp} aiAdjusted={aiAdjusted} aiReason={aiReason}
            modeAdjusted={modeAdjusted} modeOffsetApplied={modeOffsetApplied}
            servoAngle={servoAngle} doorOpenCount={doorOpenCount} totalEnergyLost={totalEnergyLost}
            doorAlarmActive={doorAlarmActive} lastOpenDurationSec={lastOpenDurationSec} diagnostics={diagnostics}
            darkMode={darkMode} theme={theme}
          />
        );
      case 'calendar':
        return <CalendarView calendar={calendar} loading={calendarLoading} onSetMeal={setMeal} onSetMeals={setMeals} dailyCalorieGoal={profile?.dailyCalorieGoal ?? null} consumptionHistory={consumptionHistory} inventory={inventory} ratings={ratings} darkMode={darkMode} theme={theme} />;
      case 'profile':
        return <ProfileView token={token} username={username} darkMode={darkMode} theme={theme} profile={profile} profileLoading={profileLoading} totalConsumed={totalConsumed} onUpdateFridgeInfo={updateFridgeInfo} onResetInventory={resetInventory} onResetStats={resetStats} onLogoutAllSessions={logoutAllSessions} onDeleteAccount={deleteAccount} onExportData={exportData} onLogout={logout} />;
      case 'admin':
        return role === 'admin' ? <AdminView token={token} darkMode={darkMode} theme={theme} /> : null;
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500`}>
      {milestoneBurst && <ConfettiBurst />}
      {justUnlocked && <MilestoneToast label={justUnlocked.label} icon={justUnlocked.icon} onDismiss={clearUnlocked} />}
      <Header username={username} role={user.role} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={logout} mobileMenuOpen={mobileOpen} setMobileMenuOpen={setMobileOpen} isConnected={isConnected} theme={theme} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 flex gap-4 md:gap-6">
        <Sidebar activeView={activeView} setActiveView={setActiveView} theme={theme} darkMode={darkMode} role={role} />
        <MobileMenu isOpen={mobileOpen} activeView={activeView} setActiveView={setActiveView} onClose={() => setMobileOpen(false)} theme={theme} darkMode={darkMode} role={role} />
        <main className="flex-1 min-w-0">
          <PageTransition activeKey={activeView}>{renderView()}</PageTransition>
        </main>
      </div>
      <AIChatWidget token={token} temperature={sensorData.temperature} humidity={sensorData.humidity} inventory={inventory} currentMode={currentMode} onApplyMode={setCurrentMode} darkMode={darkMode} theme={theme} />
    </div>
  );
}

export default App;