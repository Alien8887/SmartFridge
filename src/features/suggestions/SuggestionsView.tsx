import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, Clock, CheckCircle2, AlertTriangle, ChefHat, Flame,
  Star, Heart, Download, Plus, Minus, PackageCheck, TrendingDown, ShoppingBag, Users,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ModeInsightBanner } from '../../components/ui/ModeInsightBanner';
import { InventoryItem, Product, Theme } from '../../types';
import { RecipeMatch, buildMatches, nameMatch } from '../../utils/recipeMatching';
import { RecipeIngredient } from '../../data/demoMeals';
import { scaleIngredient, scaleCalories, formatIngredientAmount } from '../../utils/recipeScaling';
import { hasEnoughQuantity } from '../../utils/unitUtils';
import { availableProducts } from '../../data/productsCatalog';
import { exportShoppingList } from '../../utils/chartUtils';
import { formatStat } from '../../utils/numberUtils';
import { getModeInsight } from '../../data/modeEffects';

interface SuggestionsViewProps {
  inventory: InventoryItem[];
  onAddProduct: (product: Product, quantityAmount: number, quantityUnit: string) => void;
  onAddProducts: (items: { product: Product; amount: number; unit: string }[]) => void; // NEW
  onConsume: (id: number, amount: number) => void;
  ratings: Record<string, number>;
  onRate: (recipeId: string, stars: number) => void;
  dietaryPreferences?: string[];
  totalConsumed?: number;
  totalWasted?: number;
  currentMode?: string;
  householdSize?: number | null;
  dailyCalorieGoal?: number | null;
  darkMode: boolean;
  theme: Theme;
}

function catalogLookup(name: string): Product {
  const entry = availableProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
  return entry ? entry : { name, category: 'Other', defaultExpiry: 7 };
}

function StarRating({ recipeId, rating, onRate, darkMode }: { recipeId: string; rating: number; onRate: (id: string, stars: number) => void; darkMode: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={e => { e.stopPropagation(); onRate(recipeId, n); }} onMouseEnter={() => setHover(n)} className="p-0.5" aria-label={`Rate ${n} stars`}>
          <Star className={`w-3.5 h-3.5 ${(hover || rating) >= n ? 'fill-amber-400 text-amber-400' : darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

function UrgencyBadge({ level, days }: { level: RecipeMatch['urgencyLevel']; days: number }) {
  if (level === 'urgent') return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-400 flex items-center gap-1"><Flame className="w-3 h-3" /> Use today ({days}d)</span>;
  if (level === 'soon') return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-500/20 text-orange-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Expiring soon ({days}d)</span>;
  return null;
}

function MatchBar({ score, darkMode }: { score: number; darkMode: boolean }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className={`flex-1 h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-indigo-400">{pct}%</span>
    </div>
  );
}

function RecipeCard({ match, ratings, onRate, darkMode, theme, onSelect }: { match: RecipeMatch; ratings: Record<string, number>; onRate: (id: string, stars: number) => void; darkMode: boolean; theme: Theme; onSelect: () => void }) {
  const { recipe: r, urgencyLevel, minDays, matchScore, missingIngredients, matchedPreferences } = match;
  const rating = ratings[r.id] ?? 0;
  const loved = rating >= 4;
  const border = urgencyLevel === 'urgent' ? 'border-red-500/50' : urgencyLevel === 'soon' ? 'border-orange-500/40' : match.canMake ? 'border-emerald-500/30' : '';

  return (
    <div className={`animate-fade-in card-hover ${theme.card} border rounded-xl p-4 ${border}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xl">{r.emoji}</span>
            <h4 className={`font-semibold text-sm ${theme.text}`}>{r.name}</h4>
            <UrgencyBadge level={urgencyLevel} days={minDays} />
            {match.canMake && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>}
            {loved && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold flex items-center gap-1"><Heart className="w-3 h-3 fill-indigo-400" /> You loved this</span>}
            {matchedPreferences.map(p => <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-medium">{p}</span>)}
          </div>
          <div className={`flex items-center gap-3 text-xs ${theme.textMuted}`}>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
            <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" />{r.difficulty}</span>
            <span>{r.calories} kcal</span>
          </div>
        </div>
        <Button onClick={onSelect} variant={match.canMake ? 'primary' : 'ghost'} size="sm" isDark={darkMode}>{match.canMake ? '🍳 Cook' : 'View'}</Button>
      </div>
      <MatchBar score={matchScore} darkMode={darkMode} />
      {missingIngredients.length > 0 && <p className={`text-xs mt-2 ${theme.textMuted}`}>🛒 Need: {missingIngredients.join(', ')}</p>}
      <div className="flex items-center justify-between mt-3">
        <StarRating recipeId={r.id} rating={rating} onRate={onRate} darkMode={darkMode} />
        <div className="flex flex-wrap gap-1">{r.tags.slice(0, 2).map(tag => <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{tag}</span>)}</div>
      </div>
    </div>
  );
}

function RecipeModal({ match, inventory, boughtIngredients, onBuyIngredient, onClose, onConsume, defaultServings, darkMode, theme }: {
  match: RecipeMatch; inventory: InventoryItem[]; boughtIngredients: Set<string>;
  onBuyIngredient: (ing: RecipeIngredient, shortfallAmount: number) => void;
  onClose: () => void; onConsume: (id: number, amount: number) => void;
  defaultServings: number; darkMode: boolean; theme: Theme;
}) {
  const { recipe: r } = match;
  const [servings, setServings] = useState(Math.max(1, defaultServings));
  const [cooked, setCooked] = useState(false);

  const scaledIngredients = useMemo(() => r.ingredients.map(ing => scaleIngredient(ing, r.servings, servings)), [r, servings]);
  const scaledCalories = scaleCalories(r.calories, r.servings, servings);

  // FIXED: searches the FULL inventory directly (not the pre-filtered,
  // base-servings-sufficient subset in match.matchedItems), and uses
  // hasEnoughQuantity against the CURRENT serving count. This is what
  // makes "only 1g in stock" show correctly instead of a stale "Ready."
  const ingredientStatus = useMemo(() => scaledIngredients.map(ing => {
    const invItem = inventory.find(i => nameMatch(i.name, ing.name) && i.quantityAmount > 0);
    const bought = boughtIngredients.has(ing.name);
    const have = invItem ? invItem.quantityAmount : 0;
    const haveUnit = invItem ? invItem.quantityUnit : ing.unit;
    const sufficient = invItem ? hasEnoughQuantity(have, haveUnit, ing.amount, ing.unit) : bought;
    return { ing, invItem, sufficient, have, haveUnit, bought };
  }), [scaledIngredients, inventory, boughtIngredients]);

  const canCookAtServings = ingredientStatus.every(s => s.sufficient);

  const handleCook = () => {
    ingredientStatus.forEach(s => { if (s.invItem) onConsume(s.invItem.id, Math.min(s.ing.amount, s.invItem.quantityAmount)); });
    setCooked(true);
    setTimeout(() => onClose(), 900);
  };

  return (
    <Modal isOpen title={`${r.emoji} ${r.name}`} onClose={onClose} theme={theme}>
      <div className="animate-scale-in space-y-5">
        {cooked ? (
          <div className="flex flex-col items-center justify-center py-10 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 animate-number-pop">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <p className={`font-semibold ${theme.text}`}>Cooked! Ingredients deducted.</p>
          </div>
        ) : (
          <>
            <div className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /><span className={`text-sm font-medium ${theme.text}`}>Cooking for</span></div>
              <div className="flex items-center gap-3">
                <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-7 h-7 rounded-lg bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                <span className={`text-lg font-bold w-6 text-center ${theme.text}`}>{servings}</span>
                <button onClick={() => setServings(s => Math.min(20, s + 1))} className="w-7 h-7 rounded-lg bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[{ label: 'Time', val: r.time }, { label: 'Difficulty', val: r.difficulty }, { label: 'Calories', val: `${scaledCalories} kcal` }, { label: 'Servings', val: `${servings}` }].map(m => (
                <div key={m.label} className={`px-3 py-2 rounded-lg text-center ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div className={`text-xs ${theme.textMuted}`}>{m.label}</div>
                  <div className={`font-semibold text-sm ${theme.text}`}>{m.val}</div>
                </div>
              ))}
            </div>

            <div>
              <h4 className={`font-semibold ${theme.text} mb-2`}>Ingredients for {servings} {servings === 1 ? 'person' : 'people'}</h4>
              <div className="space-y-1.5">
                {ingredientStatus.map(({ ing, invItem, sufficient, have, haveUnit, bought }) => {
                  const shortfall = Math.max(0, ing.amount - (invItem ? have : 0));
                  return (
                    <div key={ing.name} className={`flex items-center justify-between gap-2 text-sm ${sufficient ? theme.text : theme.textMuted}`}>
                      <span className="flex items-center gap-2 min-w-0">
                        {sufficient ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <ShoppingCart className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        <span className="truncate">{ing.name} — {formatIngredientAmount(ing.amount, ing.unit)}</span>
                      </span>
                      {!sufficient && !bought && (
                        // FIXED: adds the real shortfall amount, in the
                        // recipe's own unit — was always "1 pcs" before.
                        <button onClick={() => onBuyIngredient(ing, shortfall)} className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                          <Plus className="w-3 h-3" /> Add {formatIngredientAmount(shortfall, ing.unit)}
                        </button>
                      )}
                      {!sufficient && invItem && <span className="flex-shrink-0 text-xs text-amber-400">only {formatIngredientAmount(have, haveUnit)} in stock</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className={`font-semibold ${theme.text} mb-2`}>Instructions</h4>
              <ol className="space-y-2">
                {r.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className={`text-sm ${theme.textMuted} pt-0.5`}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {canCookAtServings ? (
              <Button variant="primary" fullWidth onClick={handleCook}>🍳 Cook for {servings} — deduct ingredients</Button>
            ) : (
              <p className={`text-xs ${theme.textMuted}`}>Add the missing/insufficient ingredients above before cooking for {servings}.</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

export function SuggestionsView({ inventory, onAddProduct, onAddProducts, onConsume, ratings, onRate, dietaryPreferences = [], totalConsumed = 0, totalWasted = 0, currentMode, householdSize, dailyCalorieGoal, darkMode, theme }: SuggestionsViewProps) {
  const [activeTab, setActiveTab] = useState<'recipes' | 'shopping'>('recipes');
  const [selectedMatch, setSelectedMatch] = useState<RecipeMatch | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dietaryFilter, setDietaryFilter] = useState<string | null>(null);
  const [boughtItems, setBoughtItems] = useState<Set<string>>(new Set());

  const matches = useMemo(() => buildMatches(inventory, ratings, dietaryPreferences), [inventory, ratings, dietaryPreferences]);
  const urgent = matches.filter(m => m.urgencyLevel === 'urgent');
  const canMake = matches.filter(m => m.canMake);
  const loved = matches.filter(m => (ratings[m.recipe.id] ?? 0) >= 4);

  const modeInsight = useMemo(() => currentMode ? getModeInsight(currentMode, { urgentCount: urgent.length, cookableCount: canMake.length, dailyCalorieGoal: dailyCalorieGoal ?? null }) : null, [currentMode, urgent.length, canMake.length, dailyCalorieGoal]);

  const defaultServingsFor = (recipe: any): number => {
    if (currentMode === 'party') return Math.max((householdSize ?? 2) * 2, 6);
    return householdSize ?? recipe.servings;
  };

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
  const displayed = (categoryFilter === 'All' ? matches : matches.filter(m => m.recipe.category === categoryFilter))
    .filter(m => !dietaryFilter || m.recipe.tags.some(t => t.toLowerCase().includes(dietaryFilter.toLowerCase())))
    .slice(0, 12);

  // FIXED: was a bare Set<string> of names. Now a Map keeping each missing
  // ingredient's REAL spec (amount+unit) from the first recipe that needed
  // it, so "Add to fridge" adds a sensible amount instead of always "1 pcs."
  const shoppingMap = new Map<string, RecipeIngredient>();
  matches.slice(0, 8).forEach(m => {
    m.recipe.ingredients.forEach(ing => {
      if (m.missingIngredients.includes(ing.name) && !shoppingMap.has(ing.name)) shoppingMap.set(ing.name, ing);
    });
  });
  const shoppingList = [...shoppingMap.entries()].filter(([name]) => !boughtItems.has(name)).slice(0, 12);


  const handleBuyIngredientForRecipe = (ing: RecipeIngredient, shortfallAmount: number) => {
    onAddProduct(catalogLookup(ing.name), shortfallAmount > 0 ? shortfallAmount : ing.amount, ing.unit);
    setBoughtItems(prev => new Set([...prev, ing.name]));
  };

  const handleBuy = ([name, ing]: [string, RecipeIngredient]) => {
    onAddProduct(catalogLookup(name), ing.amount, ing.unit);
    setBoughtItems(prev => new Set([...prev, name]));
  };

  // FIXED (issue 4): was `shoppingList.forEach(handleBuy)` — N independent
  // concurrent POSTs racing on the same server-side list. Now builds the
  // whole batch and sends it as ONE request via addProducts.
  const handleBuyAll = () => {
    const items = shoppingList.map(([, ing]) => ({ product: catalogLookup(ing.name), amount: ing.amount, unit: ing.unit }));
    onAddProducts(items);
    setBoughtItems(prev => new Set([...prev, ...shoppingList.map(([name]) => name)]));
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {urgent.length > 0 && (
        <div className="animate-slide-down bg-red-500/10 border border-red-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Flame className="w-5 h-5 text-red-400" /><h3 className={`font-semibold ${theme.text}`}>Use Today to Prevent Waste</h3></div>
          <div className="flex flex-wrap gap-2">{urgent.slice(0, 5).map(m => <button key={m.recipe.id} onClick={() => setSelectedMatch(m)} className="text-sm px-3 py-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">{m.recipe.emoji} {m.recipe.name}</button>)}</div>
        </div>
      )}

      {modeInsight && <ModeInsightBanner message={modeInsight} darkMode={darkMode} theme={theme} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <TrendingDown className="w-5 h-5 text-emerald-400" />, val: formatStat(totalConsumed), label: 'Items used' },
          { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, val: formatStat(totalWasted), label: 'Items wasted' },
          { icon: <CheckCircle2 className="w-5 h-5 text-sky-400" />, val: canMake.length.toString(), label: 'Cookable now' },
          { icon: <ShoppingBag className="w-5 h-5 text-indigo-400" />, val: '$0.00', label: 'Money saved (demo)' },
        ].map(s => (
          <div key={s.label} className={`${theme.card} border rounded-xl p-3 text-center card-hover`}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${theme.text}`}>{s.val}</div>
            <div className={`text-xs ${theme.textMuted}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={`flex items-center gap-4 flex-wrap text-xs ${theme.textMuted} px-1`}>
        <span className="flex items-center gap-1"><PackageCheck className="w-3.5 h-3.5 text-sky-400" /> {canMake.length} cookable now</span>
        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-indigo-400" /> {loved.length} favorites</span>
        <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5 text-emerald-400" /> {shoppingList.length} to buy</span>
      </div>

      <div className={`flex rounded-xl overflow-hidden border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        {(['recipes', 'shopping'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-sky-500 text-white' : `${theme.hover} ${theme.text}`}`}>{tab === 'recipes' ? '🍳 Recipes' : '🛒 Shopping List'}</button>
        ))}
      </div>

      {activeTab === 'recipes' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">{categories.map(cat => <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-sky-500 text-white' : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{cat}</button>)}</div>
          {dietaryPreferences.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              <span className={`text-xs ${theme.textMuted}`}>Your preferences:</span>
              {dietaryPreferences.map(pref => <button key={pref} onClick={() => setDietaryFilter(f => f === pref ? null : pref)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${dietaryFilter === pref ? 'bg-indigo-500 text-white' : darkMode ? 'bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>{pref}</button>)}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{displayed.map(match => <RecipeCard key={match.recipe.id} match={match} ratings={ratings} onRate={onRate} darkMode={darkMode} theme={theme} onSelect={() => setSelectedMatch(match)} />)}</div>
        </div>
      )}

      {activeTab === 'shopping' && (
        <div className={`${theme.card} border rounded-xl p-4 animate-fade-in`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}><ShoppingCart className="w-4 h-4 text-indigo-400" /> Suggested Shopping List</h3>
            <div className="flex gap-2">
              {shoppingList.length > 0 && <button onClick={handleBuyAll} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"><PackageCheck className="w-3 h-3" /> Add all</button>}
              <button onClick={() => exportShoppingList(shoppingList.map(([name]) => name))} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors"><Download className="w-3 h-3" /> Export</button>
            </div>
          </div>
          {shoppingList.length === 0 ? (
            <div className="text-center py-8"><CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" /><p className={`text-sm ${theme.textMuted}`}>Your fridge has everything for the top recipes!</p></div>
          ) : (
            <div className="space-y-2">{shoppingList.map(([name, ing]) => (
              <div key={name} className={`flex items-center justify-between p-3 rounded-lg ${theme.hover}`}>
                <div className="flex items-center gap-3"><ShoppingCart className={`w-4 h-4 ${theme.textMuted}`} /><span className={`text-sm ${theme.text}`}>{name}</span><span className={`text-xs ${theme.textMuted}`}>{formatIngredientAmount(ing.amount, ing.unit)}</span></div>
                <button onClick={() => handleBuy([name, ing])} className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">Add to fridge</button>
              </div>
            ))}</div>
          )}
        </div>
      )}

      {selectedMatch && <RecipeModal match={selectedMatch} inventory={inventory} boughtIngredients={boughtItems} onBuyIngredient={handleBuyIngredientForRecipe} onClose={() => setSelectedMatch(null)} onConsume={onConsume} defaultServings={defaultServingsFor(selectedMatch.recipe)} darkMode={darkMode} theme={theme} />}
    </div>
  );
}