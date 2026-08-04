export interface ModeEffect {
  tempOffsetC: number;
  pollIntervalMultiplier: number;
  banner?: string;
}

export const modeEffects: Record<string, ModeEffect> = {
  normal:  { tempOffsetC: 0,   pollIntervalMultiplier: 1 },
  eco:     { tempOffsetC: 1.5, pollIntervalMultiplier: 3,   banner: 'Eco mode: target relaxed by 1.5°C and AI checks run a third as often to save energy.' },
  party:   { tempOffsetC: -1,  pollIntervalMultiplier: 0.5, banner: 'Party mode: running 1°C colder and checking twice as often to offset frequent door opens.' },
  ramadan: { tempOffsetC: 0,   pollIntervalMultiplier: 1,   banner: 'Ramadan mode: no fridge changes — a reminder to plan ahead for iftar and suhoor.' },
  diet:    { tempOffsetC: 0,   pollIntervalMultiplier: 1,   banner: 'Diet mode: no fridge changes — check Calendar for your daily calorie goal.' },
  travel:  { tempOffsetC: 0.5, pollIntervalMultiplier: 2,   banner: "Travel mode: saving a little energy and checking half as often while you're away." },
};

export function getModeEffect(modeId: string): ModeEffect {
  return modeEffects[modeId] ?? modeEffects.normal;
}

/** Extends mode selection into Suggestions — always reusing REAL data
 *  (urgent-item counts, cookable-recipe counts, the user's own calorie
 *  goal), never inventing content the app doesn't actually track. */
export function getModeInsight(modeId: string, ctx: { urgentCount: number; cookableCount: number; dailyCalorieGoal: number | null }): string | null {
  switch (modeId) {
    case 'party':
      return `Party mode: recipes below default to bigger portions automatically. ${ctx.cookableCount} dish${ctx.cookableCount === 1 ? '' : 'es'} ready to cook right now.`;
    case 'eco':
      return ctx.urgentCount > 0 ? `Eco mode: use up ${ctx.urgentCount} urgent item${ctx.urgentCount === 1 ? '' : 's'} below before they spoil and go to waste.` : null;
    case 'diet':
      return ctx.dailyCalorieGoal
        ? `Diet mode active — your Calendar calorie goal is ${ctx.dailyCalorieGoal} kcal/day. Recipe calories update live as you adjust servings.`
        : 'Diet mode active — set a daily calorie goal in Profile to see it tracked here and in Calendar.';
    case 'travel':
      return ctx.urgentCount > 0 ? `Traveling soon? ${ctx.urgentCount} item${ctx.urgentCount === 1 ? '' : 's'} will expire — use them up before you go.` : 'Traveling soon? No urgent items right now — good timing.';
    case 'ramadan':
      return 'Ramadan mode: plan iftar and suhoor around what needs using up soonest — check the urgent items below.';
    default:
      return null;
  }
}