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
  quantity: string;
  freshness: number;
}

export interface Product {
  name: string;
  category: string;
  defaultExpiry: number;
}

export interface Alert {
  id: number;
  message: string;
  timestamp: Date;
}

export interface MealSuggestion {
  name: string;
  ingredients: string[];
  time: string;
}

export interface Mode {
  id: string;
  name: string;
  icon: any;
}

export interface Theme {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  accent: string;
  hover: string;
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

export interface ChartDataPoint {
  time: string;
  value: number;
  timestamp?: number;
}