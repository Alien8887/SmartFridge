import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Coffee, Sun, Moon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Theme } from '../../types';
import { recipes, Recipe } from '../../data/demoMeals';
import { CalendarData, MealSlot } from '../../hooks/useCalendar';
import { startOfWeek, addDays, toDateKey, formatDayLabel, isToday } from '../../utils/dateUtils';

interface CalendarViewProps {
  calendar: CalendarData;
  loading: boolean;
  onSetMeal: (date: string, meal: MealSlot, recipeId: string | null) => void;
  dailyCalorieGoal: number | null;
  darkMode: boolean;
  theme: Theme;
}

const MEAL_META: Record<MealSlot, { label: string; icon: typeof Coffee; activeBg: string; iconColor: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, activeBg: 'bg-amber-500/10 hover:bg-amber-500/20', iconColor: 'text-amber-400' },
  lunch:     { label: 'Lunch',     icon: Sun,    activeBg: 'bg-sky-500/10 hover:bg-sky-500/20',     iconColor: 'text-sky-400'   },
  dinner:    { label: 'Dinner',    icon: Moon,   activeBg: 'bg-indigo-500/10 hover:bg-indigo-500/20', iconColor: 'text-indigo-400' },
};

function recipeById(id: string | null): Recipe | undefined { return id ? recipes.find(r => r.id === id) : undefined; }

export function CalendarView({ calendar, loading, onSetMeal, dailyCalorieGoal, darkMode, theme }: CalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [pickerTarget, setPickerTarget] = useState<{ date: string; meal: MealSlot } | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const dayCalories = (dateKey: string): number => {
    const day = calendar[dateKey];
    if (!day) return 0;
    return (['breakfast', 'lunch', 'dinner'] as MealSlot[]).reduce((sum, m) => sum + (recipeById(day[m])?.calories ?? 0), 0);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>Meal Calendar</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(w => addDays(w, -7))} className={`p-2 rounded-lg ${theme.hover}`} aria-label="Previous week"><ChevronLeft className={`w-4 h-4 ${theme.text}`} /></button>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>This week</button>
          <button onClick={() => setWeekStart(w => addDays(w, 7))} className={`p-2 rounded-lg ${theme.hover}`} aria-label="Next week"><ChevronRight className={`w-4 h-4 ${theme.text}`} /></button>
        </div>
      </div>

      {loading ? (
        <Card className={theme.card}><div className="text-center py-10"><div className="w-8 h-8 mx-auto rounded-full border-4 border-sky-500 border-t-transparent animate-spin" /></div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map(day => {
            const dateKey = toDateKey(day);
            const meals = calendar[dateKey] || { breakfast: null, lunch: null, dinner: null };
            const calories = dayCalories(dateKey);
            const today = isToday(day);
            const goalPct = dailyCalorieGoal ? Math.round((calories / dailyCalorieGoal) * 100) : null;

            return (
              <div key={dateKey} className={`rounded-xl border p-3 flex flex-col gap-2 animate-fade-in card-hover ${theme.card} ${today ? 'border-sky-500 ring-1 ring-sky-500/30' : darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${today ? 'text-sky-400' : theme.textMuted}`}>{formatDayLabel(day)}</span>
                  {today && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500 text-white font-medium">Today</span>}
                </div>

                {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map(meal => {
                  const meta = MEAL_META[meal];
                  const Icon = meta.icon;
                  const recipe = recipeById(meals[meal]);
                  return (
                    <button key={meal} onClick={() => setPickerTarget({ date: dateKey, meal })}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${recipe ? meta.activeBg : darkMode ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${recipe ? meta.iconColor : theme.textMuted}`} />
                      {recipe ? (
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs font-medium truncate ${theme.text}`}>{recipe.emoji} {recipe.name}</span>
                          <span className={`block text-[10px] ${theme.textMuted}`}>{recipe.calories} kcal</span>
                        </span>
                      ) : (
                        <span className={`text-xs ${theme.textMuted} flex items-center gap-1`}><Plus className="w-3 h-3" /> {meta.label}</span>
                      )}
                    </button>
                  );
                })}

                <div className={`mt-1 pt-2 border-t text-center ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`text-xs font-semibold ${theme.text}`}>{calories} kcal</span>
                  {goalPct !== null && (
                    <div className={`h-1 rounded-full mt-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div className={`h-full rounded-full transition-all duration-500 ${goalPct > 110 ? 'bg-red-500' : goalPct > 90 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${Math.min(100, goalPct)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pickerTarget && (
        <Modal isOpen title={`Choose a recipe — ${MEAL_META[pickerTarget.meal].label}`} onClose={() => setPickerTarget(null)} theme={theme}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {calendar[pickerTarget.date]?.[pickerTarget.meal] && (
              <button onClick={() => { onSetMeal(pickerTarget.date, pickerTarget.meal, null); setPickerTarget(null); }}
                className="w-full flex items-center gap-2 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors">
                <X className="w-4 h-4" /> Clear this meal
              </button>
            )}
            {recipes.map(r => (
              <button key={r.id} onClick={() => { onSetMeal(pickerTarget.date, pickerTarget.meal, r.id); setPickerTarget(null); }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <span className="text-xl">{r.emoji}</span>
                <span className="flex-1 text-left">
                  <span className={`block text-sm font-medium ${theme.text}`}>{r.name}</span>
                  <span className={`block text-xs ${theme.textMuted}`}>{r.calories} kcal · {r.time}</span>
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}