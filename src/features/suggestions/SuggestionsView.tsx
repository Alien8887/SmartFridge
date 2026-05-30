import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, Clock, CheckCircle2, AlertTriangle,
  ChefHat, Flame, Leaf, ShoppingBag, TrendingDown, Zap,
} from 'lucide-react';
import { Modal }  from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { InventoryItem, Theme } from '../../types';
import { recipes, Recipe } from '../../data/demoMeals';

interface SuggestionsViewProps {
  inventory:      InventoryItem[];
  darkMode:       boolean;
  theme:          Theme;
  totalConsumed?: number;
  totalWasted?:   number;
}

interface RecipeMatch {
  recipe:                Recipe;
  canMake:               boolean;
  matchScore:            number;
  availableIngredients:  string[];
  missingIngredients:    string[];
  hasExpiringIngredient: boolean;
  urgencyLevel:          'urgent' | 'soon' | 'normal';
  minDays:               number;
}

type ActiveTab = 'recipes' | 'shopping';

// Partial name matching: "Chicken" matches "Chicken Breast"
function nameMatch(inventoryName: string, recipeIng: string): boolean {
  const inv = inventoryName.toLowerCase();
  const rec = recipeIng.toLowerCase();
  return inv.includes(rec) || rec.includes(inv.split(' ')[0]);
}

function getDaysLeft(item: InventoryItem): number {
  if (!item.addedDate) return item.expiry;
  const elapsed = Math.floor((Date.now() - item.addedDate) / 86_400_000);
  return Math.max(0, item.expiry - elapsed);
}

function buildMatches(inv: InventoryItem[]): RecipeMatch[] {
  return recipes.map(recipe => {
    const available: string[] = [];
    const missing:   string[] = [];
    let minDays = 999;
    let hasExpiring = false;

    recipe.ingredients.forEach(ing => {
      const found = inv.find(item => nameMatch(item.name, ing));
      if (found) {
        available.push(ing);
        const d = getDaysLeft(found);
        if (d < minDays) minDays = d;
        if (d <= 3) hasExpiring = true;
      } else {
        missing.push(ing);
      }
    });

    const matchScore = recipe.ingredients.length > 0
      ? available.length / recipe.ingredients.length
      : 0;

    const urgencyLevel: RecipeMatch['urgencyLevel'] =
      minDays <= 1 ? 'urgent' : minDays <= 3 ? 'soon' : 'normal';

    return {
      recipe,
      canMake: missing.length === 0,
      matchScore,
      availableIngredients:  available,
      missingIngredients:    missing,
      hasExpiringIngredient: hasExpiring,
      urgencyLevel,
      minDays: minDays === 999 ? 99 : minDays,
    };
  }).sort((a, b) => {
    // Sort: urgent first → then by match score
    const uo = { urgent: 0, soon: 1, normal: 2 };
    const uDiff = uo[a.urgencyLevel] - uo[b.urgencyLevel];
    if (uDiff !== 0) return uDiff;
    return b.matchScore - a.matchScore;
  });
}

// ── Sub-components ────────────────────────────────────────────────────────

function UrgencyBadge({ level, days }: { level: RecipeMatch['urgencyLevel']; days: number }) {
  if (level === 'urgent') return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-400 flex items-center gap-1">
      <Flame className="w-3 h-3" /> Use today ({days}d)
    </span>
  );
  if (level === 'soon') return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-500/20 text-orange-400 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" /> Expiring soon ({days}d)
    </span>
  );
  return null;
}

function MatchBar({ score, darkMode }: { score: number; darkMode: boolean }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-slate-500';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className={`flex-1 h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium" style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#94a3b8' }}>
        {pct}%
      </span>
    </div>
  );
}

function RecipeCard({ match, darkMode, theme, onSelect }: {
  match: RecipeMatch; darkMode: boolean; theme: Theme; onSelect: () => void;
}) {
  const { recipe: r, urgencyLevel, minDays, matchScore, missingIngredients } = match;

  const border = urgencyLevel === 'urgent' ? 'border-red-500/50'
    : urgencyLevel === 'soon' ? 'border-orange-500/40'
    : match.canMake ? 'border-emerald-500/30'
    : '';

  return (
    <div className={`animate-fade-in card-hover ${theme.card} border rounded-xl p-4 ${border}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xl">{r.emoji}</span>
            <h4 className={`font-semibold text-sm ${theme.text}`}>{r.name}</h4>
            <UrgencyBadge level={urgencyLevel} days={minDays} />
            {match.canMake && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready to cook
              </span>
            )}
          </div>
          <div className={`flex items-center gap-3 text-xs ${theme.textMuted}`}>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
            <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" />{r.difficulty}</span>
            <span>{r.calories} kcal</span>
          </div>
        </div>
        <Button
          onClick={onSelect}
          variant={match.canMake ? 'primary' : 'secondary'}
          size="sm"
          isDark={darkMode}
        >
          {match.canMake ? '🍳 Cook Now' : 'View'}
        </Button>
      </div>

      <MatchBar score={matchScore} darkMode={darkMode} />

      {/* Missing ingredients */}
      {missingIngredients.length > 0 && (
        <p className={`text-xs mt-2 ${theme.textMuted}`}>
          🛒 Need: {missingIngredients.join(', ')}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {r.tags.slice(0, 3).map(tag => (
          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function RecipeModal({ match, onClose, darkMode, theme }: {
  match: RecipeMatch; onClose: () => void; darkMode: boolean; theme: Theme;
}) {
  const { recipe: r, availableIngredients, missingIngredients } = match;

  return (
    <Modal isOpen title={`${r.emoji} ${r.name}`} onClose={onClose} theme={theme}>
      <div className="animate-scale-in space-y-5">

        {/* Meta */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Time',       val: r.time         },
            { label: 'Difficulty', val: r.difficulty   },
            { label: 'Calories',   val: `${r.calories} kcal` },
            { label: 'Servings',   val: `${r.servings}` },
          ].map(m => (
            <div key={m.label} className={`px-3 py-2 rounded-lg text-center ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div className={`text-xs ${theme.textMuted}`}>{m.label}</div>
              <div className={`font-semibold text-sm ${theme.text}`}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Ingredients */}
        <div>
          <h4 className={`font-semibold ${theme.text} mb-2`}>Ingredients</h4>
          <div className="space-y-1">
            {r.ingredients.map(ing => {
              const have = availableIngredients.some(a => a.toLowerCase() === ing.toLowerCase());
              return (
                <div key={ing} className={`flex items-center gap-2 text-sm ${have ? theme.text : theme.textMuted}`}>
                  {have
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    : <ShoppingCart className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  <span>{ing}</span>
                  {!have && <span className="text-xs text-red-400 ml-auto">Buy</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps */}
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

        {missingIngredients.length === 0 && (
          <Button variant="primary" className="w-full">
            🍳 Start Cooking (Demo)
          </Button>
        )}
      </div>
    </Modal>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────

export function SuggestionsView({
  inventory,
  darkMode,
  theme,
  totalConsumed = 0,
  totalWasted   = 0,
}: SuggestionsViewProps) {
  const [activeTab,      setActiveTab]      = useState<ActiveTab>('recipes');
  const [selectedMatch,  setSelectedMatch]  = useState<RecipeMatch | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const matches = useMemo(() => buildMatches(inventory), [inventory]);

  const urgent      = matches.filter(m => m.urgencyLevel === 'urgent');
  const canMake     = matches.filter(m => m.canMake);
  const almostThere = matches.filter(m => !m.canMake && m.matchScore >= 0.5);

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
  const displayed  = (categoryFilter === 'All' ? matches : matches.filter(m => m.recipe.category === categoryFilter))
    .slice(0, 12);

  // Shopping list: unique missing ingredients across top recipes
  const shoppingSet = new Set<string>();
  matches.slice(0, 8).forEach(m => m.missingIngredients.forEach(i => shoppingSet.add(i)));
  const shoppingList = Array.from(shoppingSet).slice(0, 12);

  // Savings stats
  const wasteSaved  = totalConsumed;
  const co2Saved    = (totalConsumed * 0.31).toFixed(2); // kg CO2 per food item estimate

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">

      {/* Urgent banner */}
      {urgent.length > 0 && (
        <div className="animate-slide-down bg-red-500/10 border border-red-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-red-400" />
            <h3 className={`font-semibold ${theme.text}`}>Use Today to Prevent Waste</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {urgent.slice(0, 5).map(m => (
              <button
                key={m.recipe.id}
                onClick={() => setSelectedMatch(m)}
                className="text-sm px-3 py-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                {m.recipe.emoji} {m.recipe.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Savings stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Leaf className="w-5 h-5 text-emerald-400" />, val: String(wasteSaved), label: 'Items Saved',    sub: 'from waste'       },
          { icon: <Zap  className="w-5 h-5 text-yellow-400" />, val: co2Saved + ' kg',   label: 'CO₂ Prevented', sub: 'estimated'        },
          { icon: <TrendingDown className="w-5 h-5 text-sky-400" />, val: canMake.length.toString(), label: 'Cookable Now', sub: 'with what you have' },
          { icon: <ShoppingCart  className="w-5 h-5 text-purple-400" />, val: '$0.00', label: 'Money Saved', sub: 'demo mode'   },
        ].map(s => (
          <div key={s.label} className={`${theme.card} border rounded-xl p-3 text-center card-hover`}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${theme.text}`}>{s.val}</div>
            <div className={`text-xs font-medium ${theme.text}`}>{s.label}</div>
            <div className={`text-xs ${theme.textMuted}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick insights */}
      {almostThere.length > 0 && (
        <div className={`${theme.card} border rounded-xl p-4`}>
          <div className={`text-sm font-semibold ${theme.text} mb-2 flex items-center gap-2`}>
            💡 Almost Ready
          </div>
          <p className={`text-sm ${theme.textMuted}`}>
            You are 1–2 ingredients away from cooking{' '}
            {almostThere.slice(0, 3).map(m => m.recipe.name).join(', ')}.
            Consider adding them to your shopping list.
          </p>
        </div>
      )}

      {/* Tab switcher */}
      <div className={`flex rounded-xl overflow-hidden border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        {(['recipes', 'shopping'] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-sky-500 text-white'
                : `${theme.hover} ${theme.text}`
            }`}
          >
            {tab === 'recipes' ? '🍳 Recipes' : '🛒 Shopping List'}
          </button>
        ))}
      </div>

      {/* RECIPES TAB */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-sky-500 text-white'
                    : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Recipe grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayed.map(match => (
              <RecipeCard
                key={match.recipe.id}
                match={match}
                darkMode={darkMode}
                theme={theme}
                onSelect={() => setSelectedMatch(match)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SHOPPING LIST TAB */}
      {activeTab === 'shopping' && (
        <div className="space-y-3 animate-fade-in">
          <div className={`${theme.card} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${theme.text}`}>
                Suggested Shopping List
              </h3>
              <span className={`text-xs ${theme.textMuted}`}>Based on top recipes</span>
            </div>

            {shoppingList.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className={`text-sm ${theme.textMuted}`}>Your fridge has everything for the top recipes!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shoppingList.map(item => (
                  <div key={item} className={`flex items-center justify-between p-3 rounded-lg ${theme.hover}`}>
                    <div className="flex items-center gap-3">
                      <ShoppingCart className={`w-4 h-4 ${theme.textMuted}`} />
                      <span className={`text-sm ${theme.text}`}>{item}</span>
                    </div>
                    <button className="text-xs px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <Button variant="primary" className="w-full" icon={<ShoppingBag className="w-4 h-4" />}>
                Export List (Demo)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe detail modal */}
      {selectedMatch && (
        <RecipeModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          darkMode={darkMode}
          theme={theme}
        />
      )}
    </div>
  );
}