import { RecipeIngredient } from '../data/demoMeals';

/** Scales one ingredient's amount from a recipe's base servings to a
 *  requested serving count, then rounds to something sensible to actually
 *  measure or type: whole pieces for pcs, nearest 5 for g/ml, nearest 0.1
 *  for kg/L. */
export function scaleIngredient(ing: RecipeIngredient, baseServings: number, wantedServings: number): RecipeIngredient {
  const factor = baseServings > 0 ? wantedServings / baseServings : 1;
  const raw = ing.amount * factor;
  let amount: number;
  if (ing.unit === 'pcs') amount = Math.max(1, Math.round(raw));
  else if (ing.unit === 'kg' || ing.unit === 'L') amount = Math.round(raw * 10) / 10;
  else amount = Math.max(5, Math.round(raw / 5) * 5);
  return { ...ing, amount };
}

export function scaleCalories(baseCalories: number, baseServings: number, wantedServings: number): number {
  if (baseServings <= 0) return baseCalories;
  return Math.round(baseCalories * (wantedServings / baseServings));
}

export function formatIngredientAmount(amount: number, unit: string): string {
  if (unit === 'pcs') return `${amount}`;
  if (unit === 'kg' || unit === 'L') return `${amount.toFixed(1)} ${unit}`;
  return `${amount} ${unit}`;
}