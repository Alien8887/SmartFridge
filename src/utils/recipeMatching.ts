import { InventoryItem } from '../types';
import { recipes, Recipe } from '../data/demoMeals';
import { getDaysUntilExpiry } from './expiryUtils';
import { hasEnoughQuantity } from './unitUtils';
import { scaleIngredient } from './recipeScaling';

export interface RecipeMatch {
  recipe: Recipe;
  canMake: boolean;
  matchScore: number;
  matchedItems: InventoryItem[];
  missingIngredients: string[];
  urgencyLevel: 'urgent' | 'soon' | 'normal';
  minDays: number;
  matchedPreferences: string[];
  servingsUsed: number;
}

export function nameMatch(inventoryName: string, recipeIngName: string): boolean {
  const inv = inventoryName.toLowerCase();
  const rec = recipeIngName.toLowerCase();
  return inv.includes(rec) || rec.includes(inv.split(' ')[0]);
}

export function buildMatches(inv: InventoryItem[], ratings: Record<string, number>, dietaryPreferences: string[] = [], householdSize?: number | null): RecipeMatch[] {
  return recipes.map(recipe => {
    // FIXED: was always checked against the recipe's OWN arbitrary base
    // serving count (e.g. 2), never the actual household size — so the
    // list's "Ready" badge and the cooking modal's live check could
    // disagree once you scaled servings. Both now use the same real
    // target, closing that gap at the source.
    const targetServings = householdSize && householdSize > 0 ? householdSize : recipe.servings;
    const matchedItems: InventoryItem[] = [];
    const missing: string[] = [];
    let minDays = 999;

    recipe.ingredients.forEach(ing => {
      const scaledIng = scaleIngredient(ing, recipe.servings, targetServings);
      const candidate = inv.find(item => nameMatch(item.name, ing.name) && item.quantityAmount > 0);
      const sufficient = candidate ? hasEnoughQuantity(candidate.quantityAmount, candidate.quantityUnit, scaledIng.amount, scaledIng.unit) : false;
      if (candidate && sufficient) {
        matchedItems.push(candidate);
        const d = getDaysUntilExpiry(candidate.expiry, candidate.addedDate);
        if (d < minDays) minDays = d;
      } else {
        missing.push(ing.name);
      }
    });

    const matchScore = recipe.ingredients.length > 0 ? matchedItems.length / recipe.ingredients.length : 0;
    const urgencyLevel: RecipeMatch['urgencyLevel'] = minDays <= 1 ? 'urgent' : minDays <= 3 ? 'soon' : 'normal';
    const matchedPreferences = dietaryPreferences.filter(pref => recipe.tags.some(t => t.toLowerCase().includes(pref.toLowerCase())));

    return { recipe, canMake: missing.length === 0, matchScore, matchedItems, missingIngredients: missing, urgencyLevel, minDays: minDays === 999 ? 99 : minDays, matchedPreferences, servingsUsed: targetServings };
  }).sort((a, b) => {
    const uo = { urgent: 0, soon: 1, normal: 2 };
    const uDiff = uo[a.urgencyLevel] - uo[b.urgencyLevel];
    if (uDiff !== 0) return uDiff;
    const scoreDiff = b.matchScore - a.matchScore;
    if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
    const ratingDiff = (ratings[b.recipe.id] ?? 3) - (ratings[a.recipe.id] ?? 3);
    if (ratingDiff !== 0) return ratingDiff;
    return b.matchedPreferences.length - a.matchedPreferences.length;
  });
}

export function pickBestRecipe(matches: RecipeMatch[], excludeIds: Set<string>, mealCategory?: Recipe['category']): RecipeMatch | null {
  if (matches.length === 0) return null;
  const byCategory = mealCategory ? matches.filter(m => m.recipe.category === mealCategory) : matches;
  const pool = byCategory.length > 0 ? byCategory : matches;

  const tier1 = pool.filter(m => m.canMake && !excludeIds.has(m.recipe.id));
  if (tier1.length > 0) return tier1[0];
  const tier2 = matches.filter(m => m.canMake && !excludeIds.has(m.recipe.id));
  if (tier2.length > 0) return tier2[0];
  const tier3 = pool.filter(m => !excludeIds.has(m.recipe.id));
  if (tier3.length > 0) return tier3[0];
  const tier4 = matches.filter(m => !excludeIds.has(m.recipe.id));
  if (tier4.length > 0) return tier4[0];
  return pool[0] ?? matches[0];
}