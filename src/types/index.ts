import { LucideIcon } from 'lucide-react';

export interface SensorData {
  temperature: number;
  humidity: number;
  doorOpen: boolean;
  pressure: number;
  gasLevel: number;
  lastUpdate: string | null;
  connected: boolean;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  expiry: number;
  quantityAmount: number;
  quantityUnit: string;
  freshness: number;
  addedDate: number;
}

export interface Product {
  name: string;
  category: string;
  defaultExpiry: number;
  defaultUnit?: string;
}

export interface Mode {
  id: string;
  name: string;
  icon: LucideIcon; // was `any` — disabled type checking on this field entirely
}

export interface Theme {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  accent: string;
  hover: string;
  border?: string;
}

export interface ConsumptionData {
  day: string;
  dairy: number;
  meat: number;
  vegetables: number;
  fruits: number;
}

export interface EnergyData {
  time: string;
  usage: number;
  doorOpens: number;
  timestamp?: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

/** Raw, per-poll sensor readings (useESP32Sensors' temperatureHistory /
 *  humidityHistory / pressureHistory) — value is always a real number the
 *  instant it's pushed. Distinct on purpose from chartUtils.ts's
 *  FixedBucket, which represents POST-bucketing display data where a slot
 *  can genuinely have no reading (value: number | null). */
export interface ChartDataPoint {
  time: string;
  value: number;
  timestamp?: number;
}