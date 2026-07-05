export interface ModeEffect {
    /** Nudges the served goal temperature relative to the user's target, in °C.
     *  Positive = warmer/energy-saving, negative = colder/precautionary.
     *  Resolved server-side in api/sensors.js, alongside the AI's colder-only
     *  override — the two are reconciled there, never on the client. */
    tempOffsetC: number;
    /** Multiplies how often ML predictions / AI advice are polled from App.tsx.
     *  1 = normal cadence, 3 = a third as often, 0.5 = twice as often. */
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