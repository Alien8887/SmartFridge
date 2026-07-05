/**
 * Color language used throughout Smart Fridge. This file doesn't change any
 * rendering by itself — it documents the rule so new UI stays consistent,
 * and the few exported constants are used by newly-added components.
 *
 *  PURPLE   — genuine AI/ML output only: the AI Analysis block, AI
 *             Recommendations, chart prediction curves, the chat assistant.
 *  INDIGO   — rule-based "smart" logic that ISN'T a model call: recipe
 *             match scoring, shopping-list intelligence, dietary-preference
 *             tags.
 *  AMBER    — security and high-importance account actions: admin role,
 *             admin panel, session management, milestones/achievements.
 *  SKY/BLUE — the app's primary/default action color (buttons, active nav).
 *  TEAL     — Calendar & meal planning's own identity, distinct from the
 *             generic blue "main" color. New as of this update.
 *  YELLOW   — energy: kWh figures, the energy chart, door-open cost.
 *  RED      — danger/expired/critical/waste: anything urgent or destructive.
 *  EMERALD  — freshness, success, "good" states, low-waste.
 */
export const AI_COLOR = 'purple';
export const SMART_COLOR = 'indigo';
export const SECURITY_COLOR = 'amber';
export const PRIMARY_COLOR = 'sky';
export const CALENDAR_COLOR = 'teal';
export const ENERGY_COLOR = 'yellow';
export const DANGER_COLOR = 'red';
export const SUCCESS_COLOR = 'emerald';