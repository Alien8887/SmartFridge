import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Coffee, Sun, Moon, Sparkles, Copy, Check, ClipboardList, Trash2, RotateCcw } from 'lucide-react';
import { SectionHeading } from '../../components/ui/SectionHeading';import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { Theme, ConsumptionData, InventoryItem } from '../../types';
import { recipes, Recipe } from '../../data/demoMeals';
import { CalendarData, MealSlot, CalendarUpdate } from '../../hooks/useCalendar';
import { startOfWeek, addDays, toDateKey, formatDayLabel, isToday } from '../../utils/dateUtils';
import { buildMatches, pickBestRecipe } from '../../utils/recipeMatching';

interface CalendarViewProps {
  calendar: CalendarData; loading: boolean;
  onSetMeal: (date: string, meal: MealSlot, recipeId: string | null) => void;
  onSetMeals: (updates: CalendarUpdate[]) => void;
  dailyCalorieGoal: number | null; consumptionHistory: ConsumptionData[];
  inventory: InventoryItem[]; ratings: Record<string, number>;
  darkMode: boolean; theme: Theme;
}

const MEAL_META: Record<MealSlot, { label: string; icon: typeof Coffee; activeBg: string; iconColor: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, activeBg: 'bg-amber-500/10 hover:bg-amber-500/20', iconColor: 'text-amber-400' },
  lunch: { label: 'Lunch', icon: Sun, activeBg: 'bg-sky-500/10 hover:bg-sky-500/20', iconColor: 'text-sky-400' },
  dinner: { label: 'Dinner', icon: Moon, activeBg: 'bg-indigo-500/10 hover:bg-indigo-500/20', iconColor: 'text-indigo-400' },
};
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
const MEAL_TO_CATEGORY: Record<MealSlot, Recipe['category']> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

function recipeById(id: string | null): Recipe | undefined { return id ? recipes.find(r => r.id === id) : undefined; }

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString([], sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

interface JustFilled { slotKey: string; name: string; emoji: string; }

export function CalendarView({ calendar, loading, onSetMeal, onSetMeals, dailyCalorieGoal, consumptionHistory, inventory, ratings, darkMode, theme }: CalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [pickerTarget, setPickerTarget] = useState<{ date: string; meal: MealSlot } | null>(null);
  const [copySource, setCopySource] = useState<string | null>(null);
  const [justFilled, setJustFilled] = useState<JustFilled | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const matches = useMemo(() => buildMatches(inventory, ratings), [inventory, ratings]);

  const dayCalories = (dateKey: string): number => {
    const day = calendar[dateKey];
    if (!day) return 0;
    return SLOTS.reduce((sum, m) => sum + (recipeById(day[m])?.calories ?? 0), 0);
  };

  const weekStats = useMemo(() => {
    let planned = 0, totalCalories = 0;
    days.forEach(d => { const day = calendar[toDateKey(d)]; if (!day) return; SLOTS.forEach(m => { if (day[m]) { planned++; totalCalories += recipeById(day[m])?.calories ?? 0; } }); });
    return { planned, totalSlots: days.length * 3, totalCalories };
  }, [days, calendar]);

  const usedRecipeIds = useMemo(() => {
    const set = new Set<string>();
    days.forEach(d => { const day = calendar[toDateKey(d)]; if (day) SLOTS.forEach(m => { if (day[m]) set.add(day[m]!); }); });
    return set;
  }, [days, calendar]);

  const suggestForSlot = (dateKey: string, meal: MealSlot) => {
    const best = pickBestRecipe(matches, usedRecipeIds, MEAL_TO_CATEGORY[meal]);
    if (!best) return;
    onSetMeal(dateKey, meal, best.recipe.id);
    const slotKey = `${dateKey}-${meal}`;
    setJustFilled({ slotKey, name: best.recipe.name, emoji: best.recipe.emoji });
    setTimeout(() => setJustFilled(null), 1400);
  };

  const fillWeek = () => {
    const usedThisRun = new Set(usedRecipeIds);
    const updates: CalendarUpdate[] = [];
    days.forEach(d => {
      const key = toDateKey(d);
      const day = calendar[key] || { breakfast: null, lunch: null, dinner: null };
      SLOTS.forEach(m => {
        if (day[m]) return;
        const best = pickBestRecipe(matches, usedThisRun, MEAL_TO_CATEGORY[m]);
        if (best) { updates.push({ date: key, meal: m, recipeId: best.recipe.id }); usedThisRun.add(best.recipe.id); }
      });
    });
    onSetMeals(updates);
  };

  const clearWeek = () => {
    const updates: CalendarUpdate[] = [];
    days.forEach(d => { const key = toDateKey(d); SLOTS.forEach(m => updates.push({ date: key, meal: m, recipeId: null })); });
    onSetMeals(updates);
    setConfirmingClear(false);
  };

  const copyDayInto = (targetKey: string) => {
    if (!copySource) return;
    const source = calendar[copySource];
    if (!source) return;
    const updates: CalendarUpdate[] = SLOTS.map(m => ({ date: targetKey, meal: m, recipeId: source[m] }));
    onSetMeals(updates);
    setCopySource(null);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <SectionHeading
        icon={CalendarIcon}
        title="Meal Calendar"
        subtitle={`${formatWeekRange(weekStart)} · Today: ${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}`}
        accentColor="teal"
        theme={theme}
        darkMode={darkMode}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fillWeek} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors"><ClipboardList className="w-3.5 h-3.5" /> Fill week</button>
            {confirmingClear ? (
              <div className="flex items-center gap-1">
                <button onClick={clearWeek} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Confirm</button>
                <button onClick={() => setConfirmingClear(false)} className="text-xs px-2 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmingClear(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Clear week</button>
            )}
            <button onClick={() => setWeekStart(w => addDays(w, -7))} className={`p-2 rounded-lg ${theme.hover}`} aria-label="Previous week"><ChevronLeft className={`w-4 h-4 ${theme.text}`} /></button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors">This week</button>
            <button onClick={() => setWeekStart(w => addDays(w, 7))} className={`p-2 rounded-lg ${theme.hover}`} aria-label="Next week"><ChevronRight className={`w-4 h-4 ${theme.text}`} /></button>
          </div>
        }
      />

      {copySource && (
        <div className="animate-slide-down flex items-center justify-between bg-teal-500/10 border border-teal-500/30 rounded-xl p-3">
          <span className="text-sm text-teal-400">Copying {formatDayLabel(new Date(copySource))} — click another day's copy icon to paste, or cancel.</span>
          <button onClick={() => setCopySource(null)} className="text-xs px-2 py-1 rounded-lg bg-slate-600 text-white hover:bg-slate-500 transition-colors">Cancel</button>
        </div>
      )}

      <Card className={`${theme.card} border-teal-500/20`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><p className={`text-xs ${theme.textMuted}`}>Meals planned this week</p><p className={`text-lg font-bold ${theme.text}`}>{weekStats.planned} / {weekStats.totalSlots}</p></div>
          <div className={`h-2 flex-1 min-w-[100px] rounded-full mx-4 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${(weekStats.planned / weekStats.totalSlots) * 100}%` }} /></div>
          <div className="text-right"><p className={`text-xs ${theme.textMuted}`}>Weekly calories</p><p className={`text-lg font-bold ${theme.text}`}>{weekStats.totalCalories}{dailyCalorieGoal ? ` / ${dailyCalorieGoal * 7}` : ''}</p></div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`rounded-xl border p-3 space-y-2 ${theme.card} ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <Skeleton darkMode={darkMode} className="h-4 w-16" />
              <Skeleton darkMode={darkMode} className="h-10 w-full" />
              <Skeleton darkMode={darkMode} className="h-10 w-full" />
              <Skeleton darkMode={darkMode} className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map(day => {
            const dateKey = toDateKey(day);
            const meals = calendar[dateKey] || { breakfast: null, lunch: null, dinner: null };
            const calories = dayCalories(dateKey);
            const today = isToday(day);
            const goalPct = dailyCalorieGoal ? Math.round((calories / dailyCalorieGoal) * 100) : null;

            return (
              <div key={dateKey} className={`rounded-xl border p-3 flex flex-col gap-2 animate-fade-in card-hover ${theme.card} ${today ? 'border-teal-500 ring-1 ring-teal-500/30' : darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${today ? 'text-teal-400' : theme.textMuted}`}>{formatDayLabel(day)}</span>
                  <div className="flex items-center gap-1">
                    {today && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500 text-white font-medium">Today</span>}
                    <button onClick={() => copySource === dateKey ? setCopySource(null) : (copySource ? copyDayInto(dateKey) : setCopySource(dateKey))} title={copySource && copySource !== dateKey ? 'Paste here' : 'Copy this day'} className={`p-1 rounded-md transition-colors ${copySource === dateKey ? 'bg-teal-500 text-white' : `${theme.hover} ${theme.textMuted}`}`}>
                      {copySource === dateKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {SLOTS.map(meal => {
                  const meta = MEAL_META[meal];
                  const Icon = meta.icon;
                  const recipe = recipeById(meals[meal]);
                  const slotKey = `${dateKey}-${meal}`;
                  const isJustFilled = justFilled?.slotKey === slotKey;
                  const preview = !recipe && !isJustFilled ? pickBestRecipe(matches, usedRecipeIds, MEAL_TO_CATEGORY[meal]) : null;

                  return (
                    <div key={meal} className="flex items-center gap-1 w-full">
                      <button
                        onClick={() => setPickerTarget({ date: dateKey, meal })}
                        className={`flex-1 min-w-0 overflow-hidden flex items-center gap-2 p-2 rounded-lg text-left transition-all ${recipe || isJustFilled ? meta.activeBg : darkMode ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {isJustFilled ? (
                          <span className="flex-1 min-w-0 overflow-hidden flex items-center gap-1.5 text-xs font-medium text-indigo-400 animate-fade-in">
                            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate min-w-0">Added: {justFilled!.emoji} {justFilled!.name}</span>
                          </span>
                        ) : recipe ? (
                          <>
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${meta.iconColor}`} />
                            <span className="min-w-0 flex-1 overflow-hidden">
                              <span className={`block text-xs font-medium truncate ${theme.text}`}>{recipe.emoji} {recipe.name}</span>
                              <span className={`block text-[10px] truncate ${theme.textMuted}`}>{recipe.calories} kcal</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${theme.textMuted}`} />
                            <span className={`text-xs flex items-center gap-1 min-w-0 overflow-hidden ${theme.textMuted}`}>
                              <Plus className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{meta.label}</span>
                            </span>
                          </>
                        )}
                      </button>
                      {!recipe && !isJustFilled && (
                        <button
                          onClick={() => suggestForSlot(dateKey, meal)}
                          title={preview ? `Suggest: ${preview.recipe.name}` : 'No suggestion available'}
                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                <div className={`mt-1 pt-2 border-t text-center ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`text-xs font-semibold ${theme.text}`}>{calories} kcal</span>
                  {goalPct !== null && <div className={`h-1 rounded-full mt-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}><div className={`h-full rounded-full transition-all duration-500 ${goalPct > 110 ? 'bg-red-500' : goalPct > 90 ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(100, goalPct)}%` }} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card className={theme.card}>
        <h3 className={`text-base font-bold ${theme.text} mb-4`}>Weekly consumption</h3>
        <ConsumptionChart data={consumptionHistory} darkMode={darkMode} />
      </Card>

      {pickerTarget && (
        <Modal isOpen title={`Choose a recipe — ${MEAL_META[pickerTarget.meal].label}`} onClose={() => setPickerTarget(null)} theme={theme}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button onClick={() => { suggestForSlot(pickerTarget.date, pickerTarget.meal); setPickerTarget(null); }} className="w-full flex items-center gap-2 p-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium transition-colors"><Sparkles className="w-4 h-4" /> Suggest for me</button>
            {calendar[pickerTarget.date]?.[pickerTarget.meal] && <button onClick={() => { onSetMeal(pickerTarget.date, pickerTarget.meal, null); setPickerTarget(null); }} className="w-full flex items-center gap-2 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"><X className="w-4 h-4" /> Clear this meal</button>}
            {recipes.filter(r => r.category === MEAL_TO_CATEGORY[pickerTarget.meal]).concat(recipes.filter(r => r.category !== MEAL_TO_CATEGORY[pickerTarget.meal])).map(r => (
              <button key={r.id} onClick={() => { onSetMeal(pickerTarget.date, pickerTarget.meal, r.id); setPickerTarget(null); }} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <span className="text-xl">{r.emoji}</span><span className="flex-1 text-left"><span className={`block text-sm font-medium ${theme.text}`}>{r.name}</span><span className={`block text-xs ${theme.textMuted}`}>{r.calories} kcal · {r.time}</span></span>
                {r.category === MEAL_TO_CATEGORY[pickerTarget.meal] && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">{r.category}</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}