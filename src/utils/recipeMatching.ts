import { InventoryItem } from '../types';
import { recipes, Recipe } from '../data/demoMeals';
import { getDaysUntilExpiry } from './expiryUtils';

export interface RecipeMatch {
  recipe: Recipe;
  canMake: boolean;
  matchScore: number;
  matchedItems: InventoryItem[];
  missingIngredients: string[];
  urgencyLevel: 'urgent' | 'soon' | 'normal';
  minDays: number;
  matchedPreferences: string[];
}

export function nameMatch(inventoryName: string, recipeIng: string): boolean {
  const inv = inventoryName.toLowerCase();
  const rec = recipeIng.toLowerCase();
  return inv.includes(rec) || rec.includes(inv.split(' ')[0]);
}

export function buildMatches(inv: InventoryItem[], ratings: Record<string, number>, dietaryPreferences: string[] = []): RecipeMatch[] {
  return recipes.map(recipe => {
    const matchedItems: InventoryItem[] = [];
    const missing: string[] = [];
    let minDays = 999;

    recipe.ingredients.forEach(ing => {
      const found = inv.find(item => nameMatch(item.name, ing) && item.quantityAmount > 0);
      if (found) { matchedItems.push(found); const d = getDaysUntilExpiry(found.expiry, found.addedDate); if (d < minDays) minDays = d; }
      else missing.push(ing);
    });

    const matchScore = recipe.ingredients.length > 0 ? matchedItems.length / recipe.ingredients.length : 0;
    const urgencyLevel: RecipeMatch['urgencyLevel'] = minDays <= 1 ? 'urgent' : minDays <= 3 ? 'soon' : 'normal';
    const matchedPreferences = dietaryPreferences.filter(pref => recipe.tags.some(t => t.toLowerCase().includes(pref.toLowerCase())));

    return { recipe, canMake: missing.length === 0, matchScore, matchedItems, missingIngredients: missing, urgencyLevel, minDays: minDays === 999 ? 99 : minDays, matchedPreferences };
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

/** Picks the best cookable recipe not already used elsewhere in the current
 *  week's plan, so "Fill week" doesn't repeat the same dish seven times. */
export function pickBestRecipe(matches: RecipeMatch[], excludeIds: Set<string>): RecipeMatch | null {
  const cookable = matches.filter(m => m.canMake);
  const fresh = cookable.filter(m => !excludeIds.has(m.recipe.id));
  if (fresh.length > 0) return fresh[0];
  if (cookable.length > 0) return cookable[0];
  return matches[0] ?? null;
}